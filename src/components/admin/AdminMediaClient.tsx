"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clipboard, ImagePlus, RefreshCw, Search, Trash2, Upload, Star, ArrowLeft, ArrowRight, X } from "lucide-react";
import type { MediaAsset } from "@/lib/media";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function fetchMedia() {
  const response = await fetch("/api/admin/media", { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر تحميل مكتبة الوسائط.");
  return data as { assets: MediaAsset[]; storage: "local" | "s3" };
}

async function uploadFiles(files: File[], folder = "catalogue") {
  const form = new FormData();
  form.set("folder", folder);
  files.forEach((file) => form.append("files", file));
  const response = await fetch("/api/admin/media", { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر رفع الصور.");
  return data.assets as MediaAsset[];
}

export function AdminMediaClient() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [storage, setStorage] = useState<"local" | "s3">("local");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await fetchMedia();
      setAssets(data.assets);
      setStorage(data.storage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تحميل الوسائط.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((asset) => `${asset.name} ${asset.key}`.toLowerCase().includes(q));
  }, [assets, search]);

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []) as File[];
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setMessage("");
    try {
      const uploaded = await uploadFiles(files);
      setAssets((current) => [...uploaded, ...current]);
      setMessage(`تم رفع ${uploaded.length} صورة بنجاح.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر رفع الصور.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(asset: MediaAsset) {
    if (!confirm(`هل أنت متأكد من حذف الصورة (${asset.name})؟ سيتم منع الحذف إذا كان هناك منتج يستخدمها.`))
      return;
    const response = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: asset.key })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || "تعذر حذف الملف.");
    setAssets((current) => current.filter((item) => item.key !== asset.key));
    setMessage("تم حذف الصورة بنجاح.");
  }

  async function copyUrl(asset: MediaAsset) {
    await navigator.clipboard.writeText(asset.url);
    setCopied(asset.key);
    window.setTimeout(() => setCopied(""), 1500);
  }

  return (
    <>
      <div className="adminPageHeading">
        <div>
          <p>الملفات والوسائط</p>
          <h1>مكتبة الصور</h1>
        </div>
        <label className={`adminPrimary mediaUploadButton ${uploading ? "disabled" : ""}`}>
          <Upload size={15} />
          {uploading ? "جاري الرفع…" : "رفع صور جديدة"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={onUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="mediaStatusLine">
        <span>
          <strong>{storage === "s3" ? "مساحة تخزين سحابية S3" : "مساحة التخزين المحلية"}</strong> ·{" "}
          {assets.length} ملف مسجل
        </span>
        <button onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} /> تحديث المكتبة
        </button>
      </div>

      {message && <div className="adminAlert">{message}</div>}

      <section className="adminPanel noPad">
        <div className="adminToolbar">
          <label className="adminSearch">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في أسماء الصور والملفات…"
            />
          </label>
          <span>{visible.length} صورة معروضة</span>
        </div>
        {loading ? (
          <div className="adminEmptyState">جاري تحميل الصور…</div>
        ) : visible.length === 0 ? (
          <div className="adminEmptyState">لا توجد صور بعد. ارفع صور المنتجات أو إطارات الـ 360°.</div>
        ) : (
          <div className="mediaLibraryGrid">
            {visible.map((asset) => (
              <article className="mediaAssetCard" key={asset.key}>
                <div className="mediaAssetPreview" style={{ backgroundImage: `url(${asset.url})` }} />
                <div className="mediaAssetMeta">
                  <strong title={asset.name}>{asset.name}</strong>
                  <span>
                    {formatBytes(asset.size)} · {asset.mimeType.replace("image/", "").toUpperCase()}
                  </span>
                </div>
                <div className="mediaAssetActions">
                  <button onClick={() => void copyUrl(asset)}>
                    {copied === asset.key ? <Check size={14} /> : <Clipboard size={14} />}
                    <span>{copied === asset.key ? "تم النسخ" : "نسخ الرابط"}</span>
                  </button>
                  <button className="danger" onClick={() => void remove(asset)}>
                    <Trash2 size={14} />
                    <span>حذف</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function ProductMediaField({
  label,
  value,
  onChange,
  folder = "catalogue"
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (next: string[]) => void;
  folder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  async function openLibrary() {
    setOpen(true);
    setLoading(true);
    setError("");
    setSelected([]);
    try {
      const data = await fetchMedia();
      setAssets(data.assets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الصور.");
    } finally {
      setLoading(false);
    }
  }

  async function quickUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []) as File[];
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadFiles(files, folder);
      onChange([...value, ...uploaded.map((asset) => asset.url)]);
      setAssets((current) => [...uploaded, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر رفع الصور.");
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.length) return;
    const next = [...value];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  function toggle(url: string) {
    setSelected((current) =>
      current.includes(url) ? current.filter((item) => item !== url) : [...current, url]
    );
  }

  function applySelection() {
    onChange([...value, ...selected.filter((url) => !value.includes(url))]);
    setOpen(false);
  }

  return (
    <div className="modernMediaField">
      <div className="modernMediaFieldHead">
        <strong>{label}</strong>
        {value.length > 0 && <span className="modernMediaCountBadge">{value.length} صور محددة</span>}
      </div>

      {error && <div className="fieldError">{error}</div>}

      <div className="modernMediaDropzone">
        <label className="modernUploadActionBtn">
          <Upload size={18} />
          <span>{uploading ? "جاري الرفع الآن…" : "رفع صور من جهازك"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={quickUpload}
            disabled={uploading}
          />
        </label>
        <button type="button" className="modernLibraryActionBtn" onClick={() => void openLibrary()}>
          <ImagePlus size={17} />
          <span>تصفح مكتبة الوسائط</span>
        </button>
      </div>

      {value.length > 0 && (
        <div className="modernMediaThumbGrid">
          {value.map((url, index) => (
            <div className="modernMediaCard" key={`${url}-${index}`}>
              <div className="modernMediaCardImg" style={{ backgroundImage: `url(${url})` }} />
              {index === 0 && <span className="modernMainBadge">الغلاف الرئيسي</span>}
              <span className="modernIndexBadge">{index + 1}</span>
              <div className="modernCardActions">
                <button
                  type="button"
                  title="تحريك لليمين"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  title="حذف الصورة"
                  className="deleteAction"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <Trash2 size={13} />
                </button>
                <button
                  type="button"
                  title="تحريك لليسار"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowLeft size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="adminModalBackdrop mediaPickerBackdrop">
          <section className="adminModal mediaPickerModal">
            <div className="adminModalHead">
              <div>
                <p>مكتبة الصور</p>
                <h2>اختيار صور المنتج</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <div className="mediaPickerBody">
              {loading ? (
                <div className="adminEmptyState">جاري التحميل…</div>
              ) : assets.length === 0 ? (
                <div className="adminEmptyState">لا توجد صور في المكتبة بعد.</div>
              ) : (
                <div className="mediaPickerGrid">
                  {assets.map((asset) => {
                    const active = selected.includes(asset.url);
                    return (
                      <button
                        type="button"
                        key={asset.key}
                        className={active ? "selected" : ""}
                        onClick={() => toggle(asset.url)}
                      >
                        <span className="mediaPickerThumb" style={{ backgroundImage: `url(${asset.url})` }} />
                        <span className="mediaPickerCheck">{active ? <Check size={14} /> : null}</span>
                        <small>{asset.name}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mediaPickerFooter">
              <span>تم تحديد {selected.length} صور</span>
              <div>
                <button type="button" onClick={() => setOpen(false)}>
                  إلغاء
                </button>
                <button
                  type="button"
                  className="adminPrimary"
                  disabled={!selected.length}
                  onClick={applySelection}
                >
                  إدراج الصور المحددة
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
