"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2, X } from "lucide-react";
import type { AdminProduct } from "@/lib/domain";
import type { ProductColor, ProductVariant } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { ProductMediaField } from "@/components/admin/AdminMediaClient";

const emptyProduct = (): AdminProduct => ({
  id: "", slug: "", name: "", subtitle: "", description: "", price: 0, category: "T-Shirts", collection: "Essentials",
  status: "DRAFT", colors: [{ name: "Charcoal", value: "#111111" }], sizes: ["M", "L", "XL"], variants: [],
  images: [], spinFrames: [], featured: false, isNew: true,
  material: "", fit: "", care: "", createdAt: "", updatedAt: ""
});

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function skuPart(value: string) { return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "X"; }

export function AdminProductsClient({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const visible = useMemo(() => products.filter((product) => `${product.name} ${product.variants.map(v=>v.sku).join(" ")}`.toLowerCase().includes(search.toLowerCase())), [products, search]);

  async function save(product: AdminProduct) {
    setBusy(true); setMessage("");
    const isNew = !product.id;
    const response = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${product.id}`, {
      method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(product)
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(data.error || "Unable to save product.");
    setProducts((current) => isNew ? [data.product, ...current] : current.map((item) => item.id === data.product.id ? data.product : item));
    setEditing(null);
  }

  async function remove(product: AdminProduct) {
    if (!confirm(`Remove ${product.name}? Existing ordered products will be archived instead of deleted.`)) return;
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || "Unable to remove product.");
    setProducts((current) => data.archived ? current.map((item) => item.id === product.id ? { ...item, status: "ARCHIVED" } : item) : current.filter((item) => item.id !== product.id));
  }

  return <>
    <div className="adminPageHeading"><div><p>Catalogue</p><h1>Products</h1></div><button className="adminPrimary" onClick={() => setEditing(emptyProduct())}><Plus size={15}/> Add product</button></div>
    {message && <div className="adminAlert">{message}</div>}
    <section className="adminPanel noPad">
      <div className="adminToolbar"><label className="adminSearch"><Search size={15}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search product or SKU..." /></label><span>{visible.length} products</span></div>
      <div className="adminTableWrap"><table className="adminTable productAdminTable"><thead><tr><th>Product</th><th>Category</th><th>Variants</th><th>Stock</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>{visible.map((p)=>{const stock=p.variants.reduce((s,v)=>s+v.stock,0); return <tr key={p.id}><td><div className="productCell"><div className="productThumb" style={{backgroundImage:`url(${p.images[0]})`}}/><div><strong>{p.name}</strong><small>{p.collection}</small></div></div></td><td>{p.category}</td><td>{p.variants.length}</td><td>{stock}</td><td>{formatPrice(p.price)}</td><td><span className={`adminStatus ${p.status === "PUBLISHED" ? "delivered" : p.status === "ARCHIVED" ? "cancelled" : ""}`}>{p.status}</span></td><td><div className="tableActions"><button className="iconAdminButton" onClick={()=>setEditing(p)} aria-label="Edit"><Edit3 size={15}/></button><button className="iconAdminButton danger" onClick={()=>remove(p)} aria-label="Remove"><Trash2 size={15}/></button></div></td></tr>})}</tbody></table></div>
    </section>
    {editing && <ProductEditor initial={editing} busy={busy} onClose={()=>setEditing(null)} onSave={save} />}
  </>;
}

function ProductEditor({ initial, busy, onClose, onSave }: { initial: AdminProduct; busy: boolean; onClose:()=>void; onSave:(p:AdminProduct)=>void }) {
  const [form, setForm] = useState(initial);
  const [colorsText, setColorsText] = useState(initial.colors.map(c=>`${c.name}|${c.value}`).join("\n"));
  const [sizesText, setSizesText] = useState(initial.sizes.join(", "));

  function rebuildVariants() {
    const colors: ProductColor[] = colorsText.split("\n").map(v=>v.trim()).filter(Boolean).map(line=>{const [name,value] = line.split("|"); return { name: name.trim(), value: (value || "#111111").trim() };});
    const sizes = sizesText.split(",").map(v=>v.trim()).filter(Boolean);
    const current = new Map(form.variants.map(v=>[`${v.color}::${v.size}`,v]));
    const prefix = skuPart(form.name.replace("A²", ""));
    const variants: ProductVariant[] = colors.flatMap(color => sizes.map(size => current.get(`${color.name}::${size}`) || ({ id:"", sku:`A2-${prefix}-${skuPart(color.name)}-${skuPart(size)}`, color: color.name, size, stock: 0, lowStockAt: 4, active: true })));
    setForm({...form, colors, sizes, variants});
  }
  function variantChange(index:number, patch:Partial<ProductVariant>) { setForm({...form, variants: form.variants.map((v,i)=>i===index?{...v,...patch}:v)}); }
  function submit(e:FormEvent) {
    e.preventDefault();
    const images = form.images.filter(Boolean);
    const spinFrames = form.spinFrames.filter(Boolean);
    onSave({...form, slug: form.slug || slugify(form.name), images, spinFrames: spinFrames.length ? spinFrames : images});
  }

  return <div className="adminModalBackdrop"><section className="adminModal productEditorModal">
    <div className="adminModalHead"><div><p>CATALOGUE</p><h2>{form.id ? "Edit product" : "New product"}</h2></div><button onClick={onClose}><X/></button></div>
    <form onSubmit={submit} className="adminEditorForm">
      <div className="adminFormGrid"><label>Product name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:form.id?form.slug:slugify(e.target.value)})}/></label><label>Slug<input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label></div>
      <div className="adminFormGrid"><label>Base price<input required type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})}/></label><label>Compare-at price<input type="number" min="0" value={form.compareAtPrice ?? ""} onChange={e=>setForm({...form,compareAtPrice:e.target.value?Number(e.target.value):undefined})}/></label></div>
      <div className="adminFormGrid"><label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Collection<input value={form.collection} onChange={e=>setForm({...form,collection:e.target.value})}/></label></div>
      <div className="adminFormGrid"><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as AdminProduct["status"]})}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label><div className="adminChecks"><label><input type="checkbox" checked={Boolean(form.featured)} onChange={e=>setForm({...form,featured:e.target.checked})}/> Featured</label><label><input type="checkbox" checked={Boolean(form.isNew)} onChange={e=>setForm({...form,isNew:e.target.checked})}/> New drop</label></div></div>
      <label>Subtitle<input value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})}/></label>
      <label>Description<textarea rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <div className="adminFormGrid three"><label>Material<input value={form.material} onChange={e=>setForm({...form,material:e.target.value})}/></label><label>Fit<input value={form.fit} onChange={e=>setForm({...form,fit:e.target.value})}/></label><label>Care<input value={form.care} onChange={e=>setForm({...form,care:e.target.value})}/></label></div>
      <div className="editorSection"><div className="editorSectionHead"><div><strong>Variants</strong><span>One color per line as Name|#HEX, sizes separated by commas.</span></div><button type="button" onClick={rebuildVariants}>Generate matrix</button></div><div className="adminFormGrid"><label>Colors<textarea rows={4} value={colorsText} onChange={e=>setColorsText(e.target.value)}/></label><label>Sizes<input value={sizesText} onChange={e=>setSizesText(e.target.value)}/></label></div>
        <div className="variantEditorTable"><div className="variantEditorHeader"><span>Color</span><span>Size</span><span>SKU</span><span>Stock</span></div>{form.variants.map((v,i)=><div className="variantEditorRow" key={`${v.color}-${v.size}-${i}`}><span>{v.color}</span><span>{v.size}</span><input value={v.sku} onChange={e=>variantChange(i,{sku:e.target.value})}/><input type="number" min="0" value={v.stock} onChange={e=>variantChange(i,{stock:Number(e.target.value)})}/></div>)}</div>
      </div>
      <div className="editorSection mediaEditorSection"><ProductMediaField label="Product images" hint="Upload or select the ordered gallery. The first image is the catalogue cover." value={form.images} onChange={(images)=>setForm({...form,images})} folder="products"/><ProductMediaField label="360° frames" hint="Select 24–36 ordered frames for the touch/drag rotation viewer." value={form.spinFrames} onChange={(spinFrames)=>setForm({...form,spinFrames})} folder="spin"/></div>
      <div className="adminModalActions"><button type="button" onClick={onClose}>Cancel</button><button className="adminPrimary" disabled={busy}>{busy?"Saving…":"Save product"}</button></div>
    </form>
  </section></div>;
}
