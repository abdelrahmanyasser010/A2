import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { MediaAsset } from "@/lib/media";

const MAX_FILE_SIZE = Number(process.env.MEDIA_MAX_FILE_MB || 15) * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const LOCAL_ROOT = path.join(process.cwd(), "public", "uploads");
const PREFIX = (process.env.MEDIA_PREFIX || "products").replace(/^\/+|\/+$/g, "") || "products";

export const mediaStorageMode = (process.env.MEDIA_STORAGE || "local").toLowerCase() === "s3" ? "s3" : "local";

function safeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "asset";
}

function extensionFor(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(fromName)) return fromName === ".jpeg" ? ".jpg" : fromName;
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/avif") return ".avif";
  return ".jpg";
}

function mimeForKey(key: string) {
  const ext = path.extname(key).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  return "image/jpeg";
}

function validateFile(file: File) {
  if (!ALLOWED_MIME.has(file.type)) throw new Error(`${file.name}: unsupported image type.`);
  if (file.size <= 0) throw new Error(`${file.name}: empty file.`);
  if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name}: maximum file size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`);
}

function makeKey(file: File, folder?: string) {
  const base = safeSegment(path.basename(file.name, path.extname(file.name)));
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
  const subfolder = folder ? safeSegment(folder) : new Date().toISOString().slice(0, 7);
  return `${PREFIX}/${subfolder}/${base}-${suffix}${extensionFor(file)}`;
}

function localUrl(key: string) {
  return `/uploads/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function s3PublicUrl(key: string) {
  const base = process.env.MEDIA_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) throw new Error("MEDIA_PUBLIC_URL is required when MEDIA_STORAGE=s3.");
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function getS3Client() {
  const region = process.env.S3_REGION || "auto";
  const endpoint = process.env.S3_ENDPOINT || undefined;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey || !process.env.S3_BUCKET) throw new Error("S3 media storage is not fully configured.");
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey }
  });
}

async function uploadLocal(files: File[], folder?: string): Promise<MediaAsset[]> {
  const assets: MediaAsset[] = [];
  for (const file of files) {
    validateFile(file);
    const key = makeKey(file, folder);
    const absolute = path.join(LOCAL_ROOT, ...key.split("/"));
    if (!absolute.startsWith(LOCAL_ROOT)) throw new Error("Invalid media path.");
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, Buffer.from(await file.arrayBuffer()));
    const stat = await fs.stat(absolute);
    assets.push({ key, url: localUrl(key), name: path.basename(key), size: stat.size, mimeType: file.type, updatedAt: stat.mtime.toISOString(), storage: "local" });
  }
  return assets;
}

async function uploadS3(files: File[], folder?: string): Promise<MediaAsset[]> {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET!;
  const assets: MediaAsset[] = [];
  for (const file of files) {
    validateFile(file);
    const key = makeKey(file, folder);
    const body = Buffer.from(await file.arrayBuffer());
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable"
    }));
    assets.push({ key, url: s3PublicUrl(key), name: path.basename(key), size: body.byteLength, mimeType: file.type, updatedAt: new Date().toISOString(), storage: "s3" });
  }
  return assets;
}

export async function uploadMedia(files: File[], folder?: string) {
  if (!files.length) throw new Error("Choose at least one image.");
  if (files.length > 40) throw new Error("Upload a maximum of 40 images at once.");
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > 120 * 1024 * 1024) throw new Error("A single upload request cannot exceed 120 MB.");
  return mediaStorageMode === "s3" ? uploadS3(files, folder) : uploadLocal(files, folder);
}

async function walkLocal(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walkLocal(full) : [full];
    }));
    return nested.flat();
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function listLocal(): Promise<MediaAsset[]> {
  const files = await walkLocal(path.join(LOCAL_ROOT, PREFIX));
  const rows = await Promise.all(files.filter((file) => [".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(path.extname(file).toLowerCase())).map(async (absolute) => {
    const stat = await fs.stat(absolute);
    const key = path.relative(LOCAL_ROOT, absolute).split(path.sep).join("/");
    return { key, url: localUrl(key), name: path.basename(key), size: stat.size, mimeType: mimeForKey(key), updatedAt: stat.mtime.toISOString(), storage: "local" as const };
  }));
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function listS3(): Promise<MediaAsset[]> {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET!;
  let continuationToken: string | undefined;
  const rows: MediaAsset[] = [];
  do {
    const result = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `${PREFIX}/`, ContinuationToken: continuationToken, MaxKeys: 1000 }));
    for (const object of result.Contents || []) {
      if (!object.Key || object.Key.endsWith("/")) continue;
      rows.push({
        key: object.Key,
        url: s3PublicUrl(object.Key),
        name: path.basename(object.Key),
        size: object.Size || 0,
        mimeType: mimeForKey(object.Key),
        updatedAt: (object.LastModified || new Date()).toISOString(),
        storage: "s3"
      });
    }
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listMedia() {
  return mediaStorageMode === "s3" ? listS3() : listLocal();
}

export async function deleteMedia(key: string) {
  if (!key || !key.startsWith(`${PREFIX}/`) || key.includes("..")) throw new Error("Invalid media key.");
  if (mediaStorageMode === "s3") {
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
  } else {
    const absolute = path.join(LOCAL_ROOT, ...key.split("/"));
    if (!absolute.startsWith(LOCAL_ROOT)) throw new Error("Invalid media path.");
    await fs.rm(absolute, { force: true });
  }
  return { ok: true };
}
