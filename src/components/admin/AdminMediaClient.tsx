"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clipboard, ImagePlus, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import type { MediaAsset } from "@/lib/media";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function fetchMedia() {
  const response = await fetch("/api/admin/media", { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to load media.");
  return data as { assets: MediaAsset[]; storage: "local" | "s3" };
}

async function uploadFiles(files: File[], folder = "catalogue") {
  const form = new FormData();
  form.set("folder", folder);
  files.forEach((file) => form.append("files", file));
  const response = await fetch("/api/admin/media", { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to upload images.");
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
      setMessage(error instanceof Error ? error.message : "Unable to load media.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

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
      setMessage(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload images.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(asset: MediaAsset) {
    if (!confirm(`Delete ${asset.name}? The system will block deletion if a product still uses this file.`)) return;
    const response = await fetch("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: asset.key }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || "Unable to delete media.");
    setAssets((current) => current.filter((item) => item.key !== asset.key));
  }

  async function copyUrl(asset: MediaAsset) {
    await navigator.clipboard.writeText(asset.url);
    setCopied(asset.key);
    window.setTimeout(() => setCopied(""), 1500);
  }

  return <>
    <div className="adminPageHeading">
      <div><p>Assets</p><h1>Media library</h1></div>
      <label className={`adminPrimary mediaUploadButton ${uploading ? "disabled" : ""}`}>
        <Upload size={15}/>{uploading ? "Uploading…" : "Upload images"}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={onUpload} disabled={uploading}/>
      </label>
    </div>

    <div className="mediaStatusLine">
      <span><strong>{storage === "s3" ? "Object storage" : "Local development storage"}</strong> · {assets.length} assets</span>
      <button onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button>
    </div>
    {storage === "local" && <div className="adminInfoBanner"><ImagePlus size={17}/><span>Uploads are persisted under <code>public/uploads/</code>. Switch <code>MEDIA_STORAGE=s3</code> before production deployment.</span></div>}
    {message && <div className="adminAlert">{message}</div>}

    <section className="adminPanel noPad">
      <div className="adminToolbar"><label className="adminSearch"><Search size={15}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search media…" /></label><span>{visible.length} shown</span></div>
      {loading ? <div className="adminEmptyState">Loading media…</div> : visible.length === 0 ? <div className="adminEmptyState">No images yet. Upload product photography or 360° frames.</div> : <div className="mediaLibraryGrid">
        {visible.map((asset) => <article className="mediaAssetCard" key={asset.key}>
          <div className="mediaAssetPreview" style={{ backgroundImage: `url(${asset.url})` }}/>
          <div className="mediaAssetMeta"><strong title={asset.name}>{asset.name}</strong><span>{formatBytes(asset.size)} · {asset.mimeType.replace("image/", "").toUpperCase()}</span></div>
          <div className="mediaAssetActions">
            <button onClick={()=>void copyUrl(asset)}>{copied === asset.key ? <Check size={14}/> : <Clipboard size={14}/>}<span>{copied === asset.key ? "Copied" : "Copy URL"}</span></button>
            <button className="danger" onClick={()=>void remove(asset)}><Trash2 size={14}/><span>Delete</span></button>
          </div>
        </article>)}
      </div>}
    </section>
  </>;
}

export function ProductMediaField({ label, hint, value, onChange, folder = "catalogue" }: { label: string; hint: string; value: string[]; onChange: (next: string[]) => void; folder?: string }) {
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
      setError(err instanceof Error ? err.message : "Unable to load media.");
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
      setError(err instanceof Error ? err.message : "Unable to upload images.");
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
    setSelected((current) => current.includes(url) ? current.filter((item) => item !== url) : [...current, url]);
  }

  function applySelection() {
    onChange([...value, ...selected.filter((url) => !value.includes(url))]);
    setOpen(false);
  }

  return <div className="productMediaField">
    <div className="productMediaFieldHead"><div><strong>{label}</strong><span>{hint}</span></div><div>
      <label className="smallAdminButton"><Upload size={13}/>{uploading ? "Uploading…" : "Upload"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={quickUpload} disabled={uploading}/></label>
      <button type="button" className="smallAdminButton" onClick={()=>void openLibrary()}><ImagePlus size={13}/> Browse library</button>
    </div></div>
    {error && <div className="fieldError">{error}</div>}
    {value.length === 0 ? <div className="mediaFieldEmpty">No media selected.</div> : <div className="selectedMediaRow">{value.map((url,index)=><div className="selectedMediaItem" key={`${url}-${index}`}><div style={{backgroundImage:`url(${url})`}}/><span>{index+1}</span><div className="selectedMediaControls"><button type="button" disabled={index===0} onClick={()=>move(index,-1)}>←</button><button type="button" disabled={index===value.length-1} onClick={()=>move(index,1)}>→</button><button type="button" onClick={()=>onChange(value.filter((_,i)=>i!==index))}>×</button></div></div>)}</div>}

    {open && <div className="adminModalBackdrop mediaPickerBackdrop"><section className="adminModal mediaPickerModal"><div className="adminModalHead"><div><p>MEDIA LIBRARY</p><h2>Select images</h2></div><button type="button" onClick={()=>setOpen(false)}>×</button></div>
      <div className="mediaPickerBody">{loading ? <div className="adminEmptyState">Loading…</div> : assets.length === 0 ? <div className="adminEmptyState">No media uploaded yet.</div> : <div className="mediaPickerGrid">{assets.map(asset=>{const active=selected.includes(asset.url);return <button type="button" key={asset.key} className={active?"selected":""} onClick={()=>toggle(asset.url)}><span className="mediaPickerThumb" style={{backgroundImage:`url(${asset.url})`}}/><span className="mediaPickerCheck">{active ? <Check size={14}/> : null}</span><small>{asset.name}</small></button>})}</div>}</div>
      <div className="mediaPickerFooter"><span>{selected.length} selected</span><div><button type="button" onClick={()=>setOpen(false)}>Cancel</button><button type="button" className="adminPrimary" disabled={!selected.length} onClick={applySelection}>Use selected</button></div></div>
    </section></div>}
  </div>;
}
