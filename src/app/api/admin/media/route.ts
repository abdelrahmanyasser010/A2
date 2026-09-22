import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/server/admin-auth";
import { deleteMedia, listMedia, mediaStorageMode, uploadMedia } from "@/server/media-storage";
import { getAdminProducts } from "@/server/store-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ assets: await listMedia(), storage: mediaStorageMode });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load media." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await request.formData();
    const folder = String(form.get("folder") || "catalogue");
    const files = form.getAll("files").filter((value): value is File => value instanceof File);
    const assets = await uploadMedia(files, folder);
    return NextResponse.json({ assets }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload media." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const key = String(body.key || "");
    const assets = await listMedia();
    const asset = assets.find((item) => item.key === key);
    if (asset) {
      const products = await getAdminProducts();
      const usedBy = products.filter((product) => [...product.images, ...product.spinFrames].includes(asset.url)).map((product) => product.name);
      if (usedBy.length) {
        return NextResponse.json({ error: `This asset is still used by: ${usedBy.join(", ")}. Remove it from those products first.` }, { status: 409 });
      }
    }
    return NextResponse.json(await deleteMedia(key));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete media." }, { status: 400 });
  }
}
