"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2, X, Check } from "lucide-react";
import type { AdminProduct } from "@/lib/domain";
import type { ProductColor, ProductVariant } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { ProductMediaField } from "@/components/admin/AdminMediaClient";

export const PRESET_COLORS: { name: string; value: string }[] = [
  { name: "أسود", value: "#111111" },
  { name: "أبيض", value: "#ffffff" },
  { name: "بيج", value: "#d9cbba" },
  { name: "رمادي", value: "#6b7280" },
  { name: "زيتي", value: "#444c38" },
  { name: "كحلي", value: "#1c2836" },
  { name: "بني", value: "#4e3629" },
  { name: "بوردو", value: "#5c1d24" },
  { name: "أخضر", value: "#1b4332" },
  { name: "كافيه", value: "#7f6351" }
];

export const PRESET_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "Oversized", "Free Size"];

export const PRESET_CATEGORIES = [
  { value: "T-Shirts", label: "تيشيرتات" },
  { value: "Hoodies", label: "هوديز وسويت شيرت" },
  { value: "Pants", label: "بناطيل وبانتس" },
  { value: "Jackets", label: "جاكيتات" },
  { value: "Accessories", label: "إكسسوارات" }
];

export const PRESET_COLLECTIONS = [
  { value: "Essentials", label: "الأساسيات" },
  { value: "New Drop", label: "دروب جديد" },
  { value: "Summer 2026", label: "كولكشن الصيف" },
  { value: "Winter 2026", label: "كولكشن الشتاء" },
  { value: "Signature", label: "إصدار خاص" }
];

export const PRESET_FITS = [
  "أوفر سايز (Oversized)",
  "عادي (Regular Fit)",
  "بوكسي فيت (Boxy Fit)",
  "سليم فيت (Slim Fit)"
];

export const PRESET_MATERIALS = [
  "قطن مصري 100% تقيل",
  "ميلتون قطن مبطن",
  "قطن مخلوط ليكرا",
  "جبردين قطن تقيل",
  "بوليستر رياضي معالج"
];

export const PRESET_CARE = [
  "غسيل بماء بارد 30° مئوية",
  "غسيل يدوي مقلوب وتجفيف في الظل",
  "تجنب الكي المباشر على الطباعة",
  "غسيل عادي وتجفيف طبيعي"
];

const emptyProduct = (): AdminProduct => {
  const defaultColors = [{ name: "أسود", value: "#111111" }];
  const defaultSizes = ["M", "L", "XL"];
  const defaultVariants: ProductVariant[] = defaultColors.flatMap((color) =>
    defaultSizes.map((size) => ({
      id: "",
      sku: `A2-NEW-BLK-${skuPart(size)}`,
      color: color.name,
      size,
      stock: 10,
      lowStockAt: 3,
      active: true
    }))
  );

  return {
    id: "",
    slug: "",
    name: "",
    nameEn: "",
    subtitle: "",
    subtitleEn: "",
    description: "",
    descriptionEn: "",
    price: 0,
    compareAtPrice: undefined,
    costPrice: undefined,
    category: "T-Shirts",
    collection: "Essentials",
    status: "PUBLISHED",
    colors: defaultColors,
    sizes: defaultSizes,
    variants: defaultVariants,
    images: [],
    spinFrames: [],
    featured: false,
    isNew: true,
    material: "قطن مصري 100% تقيل",
    fit: "أوفر سايز (Oversized)",
    care: "غسيل بماء بارد 30° مئوية",
    createdAt: "",
    updatedAt: ""
  };
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-|-$/g, "");
}

function skuPart(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5) || "X";
}

const statusMap: Record<string, string> = {
  PUBLISHED: "معروض للبيع",
  DRAFT: "مسودة",
  ARCHIVED: "مؤرشف"
};

export function AdminProductsClient({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const visible = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.variants.map((v) => v.sku).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [products, search]
  );

  async function save(product: AdminProduct) {
    setBusy(true);
    setMessage("");
    const isNew = !product.id;
    const response = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${product.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(data.error || "تعذر حفظ المنتج.");
    setProducts((current) =>
      isNew
        ? [data.product, ...current]
        : current.map((item) => (item.id === data.product.id ? data.product : item))
    );
    setEditing(null);
    setMessage(isNew ? "تمت إضافة المنتج بنجاح." : "تم تحديث بيانات المنتج بنجاح.");
  }

  async function remove(product: AdminProduct) {
    if (!confirm(`هل أنت متأكد من حذف المنتج (${product.name})؟ إذا كان مرتبطاً بطلبات سابقة ستتم أرشفته بدلاً من حذفه نهائياً.`))
      return;
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || "تعذر حذف المنتج.");
    setProducts((current) =>
      data.archived
        ? current.map((item) => (item.id === product.id ? { ...item, status: "ARCHIVED" } : item))
        : current.filter((item) => item.id !== product.id)
    );
    setMessage(data.archived ? "تمت أرشفة المنتج لوجود طلبات سابقة له." : "تم حذف المنتج بنجاح.");
  }

  return (
    <>
      <div className="adminPageHeading">
        <div>
          <p>إدارة الكتالوج والمخزون</p>
          <h1>المنتجات</h1>
        </div>
        <button className="adminPrimary" onClick={() => setEditing(emptyProduct())}>
          <Plus size={15} /> إضافة منتج جديد
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
              placeholder="ابحث باسم المنتج أو كود SKU..."
            />
          </label>
          <span>{visible.length} منتج مسجل</span>
        </div>

        <div className="adminTableWrap">
          <table className="adminTable productAdminTable">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>التصنيف</th>
                <th>المقاسات والألوان</th>
                <th>المخزون الكلي</th>
                <th>السعر</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                    لا توجد منتجات تطابق البحث.
                  </td>
                </tr>
              ) : (
                visible.map((p) => {
                  const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="productCell">
                          <div
                            className="productThumb"
                            style={{ backgroundImage: `url(${p.images[0] || "/media/demo/full-outfit.webp"})` }}
                          />
                          <div>
                            <strong>{p.name}</strong>
                            <small>{p.collection}</small>
                          </div>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>{p.variants.length} خيار</td>
                      <td>
                        <strong style={{ color: stock <= 4 ? "var(--warning)" : "inherit" }}>
                          {stock} قطعة
                        </strong>
                      </td>
                      <td>{formatPrice(p.price)}</td>
                      <td>
                        <span
                          className={`adminStatus ${
                            p.status === "PUBLISHED" ? "delivered" : p.status === "ARCHIVED" ? "cancelled" : ""
                          }`}
                        >
                          {statusMap[p.status] || p.status}
                        </span>
                      </td>
                      <td>
                        <div className="tableActions">
                          <button
                            className="iconAdminButton"
                            onClick={() => setEditing(p)}
                            title="تعديل المنتج"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="iconAdminButton danger"
                            onClick={() => remove(p)}
                            title="حذف أو أرشفة"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Products Cards View (No horizontal scrolling on phones) */}
        <div className="adminProductsMobileList">
          {visible.length === 0 ? (
            <div className="mobileEmptyState">لا توجد منتجات تطابق البحث.</div>
          ) : (
            visible.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <article key={p.id} className="mobileProductCard">
                  <div
                    className="mobileProductThumb"
                    style={{ backgroundImage: `url(${p.images[0] || "/media/demo/full-outfit.webp"})` }}
                  />
                  <div className="mobileProductInfo">
                    <div className="mobileProductTitleRow">
                      <strong>{p.name}</strong>
                      <span
                        className={`adminStatus ${
                          p.status === "PUBLISHED" ? "delivered" : p.status === "ARCHIVED" ? "cancelled" : ""
                        }`}
                      >
                        {statusMap[p.status] || p.status}
                      </span>
                    </div>
                    <div className="mobileProductMetaRow">
                      <span>{p.category} • {p.collection}</span>
                      <span>{p.variants.length} خيار</span>
                    </div>
                    <div className="mobileProductFooterRow">
                      <strong className="mobileProductPrice">{formatPrice(p.price)}</strong>
                      <span
                        className="mobileProductStock"
                        style={{ color: stock <= 4 ? "var(--warning)" : "inherit" }}
                      >
                        المخزون: <strong>{stock}</strong> قطعة
                      </span>
                    </div>
                  </div>
                  <div className="mobileProductActions">
                    <button
                      type="button"
                      className="iconAdminButton"
                      onClick={() => setEditing(p)}
                      title="تعديل المنتج"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      className="iconAdminButton danger"
                      onClick={() => remove(p)}
                      title="حذف أو أرشفة"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {editing && <ProductEditor initial={editing} busy={busy} onClose={() => setEditing(null)} onSave={save} />}
    </>
  );
}

function ProductEditor({
  initial,
  busy,
  onClose,
  onSave
}: {
  initial: AdminProduct;
  busy: boolean;
  onClose: () => void;
  onSave: (p: AdminProduct) => void;
}) {
  const [form, setForm] = useState(initial);
  const [bulkStock, setBulkStock] = useState<number>(10);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#3b82f6");
  const [showCustomColor, setShowCustomColor] = useState(false);

  function rebuildVariantsWith(colors: ProductColor[], sizes: string[]) {
    const current = new Map(form.variants.map((v) => [`${v.color}::${v.size}`, v]));
    const prefix = skuPart((form.name || "ITEM").replace("A²", ""));
    const variants: ProductVariant[] = colors.flatMap((color) =>
      sizes.map((size) => {
        const existing = current.get(`${color.name}::${size}`);
        if (existing) return existing;
        return {
          id: "",
          sku: `A2-${prefix}-${skuPart(color.name)}-${skuPart(size)}`,
          color: color.name,
          size,
          stock: bulkStock > 0 ? bulkStock : 10,
          lowStockAt: 3,
          active: true
        };
      })
    );
    setForm((prev) => ({ ...prev, colors, sizes, variants }));
  }

  function toggleColor(c: { name: string; value: string }) {
    const exists = form.colors.some((item) => item.name === c.name);
    let newColors: ProductColor[];
    if (exists) {
      if (form.colors.length <= 1) return; // Keep at least one color
      newColors = form.colors.filter((item) => item.name !== c.name);
    } else {
      newColors = [...form.colors, c];
    }
    rebuildVariantsWith(newColors, form.sizes);
  }

  function toggleSize(s: string) {
    const exists = form.sizes.includes(s);
    let newSizes: string[];
    if (exists) {
      if (form.sizes.length <= 1) return; // Keep at least one size
      newSizes = form.sizes.filter((item) => item !== s);
    } else {
      newSizes = [...form.sizes, s];
    }
    rebuildVariantsWith(form.colors, newSizes);
  }

  function setPresetSizes(sizes: string[]) {
    rebuildVariantsWith(form.colors, sizes);
  }

  function addCustomColor() {
    if (!customColorName.trim()) return;
    const newColor = { name: customColorName.trim(), value: customColorHex };
    if (!form.colors.some((c) => c.name === newColor.name)) {
      rebuildVariantsWith([...form.colors, newColor], form.sizes);
    }
    setCustomColorName("");
    setShowCustomColor(false);
  }

  function variantChange(index: number, patch: Partial<ProductVariant>) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v))
    }));
  }

  function applyBulkStock() {
    const qty = Math.max(0, bulkStock);
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({ ...v, stock: qty }))
    }));
  }

  const totalStock = form.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);

  function submit(e: FormEvent) {
    e.preventDefault();
    const images = form.images.filter(Boolean);
    const spinFrames = form.spinFrames.filter(Boolean);
    onSave({
      ...form,
      slug: form.slug || slugify(form.name),
      images,
      spinFrames: spinFrames.length ? spinFrames : images
    });
  }

  return (
    <div className="adminModalBackdrop">
      <section className="adminModal productEditorModal">
        <div className="adminModalHead">
          <div>
            <p>كتالوج المتجر</p>
            <h2>{form.id ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="adminEditorForm">
          {/* Basic Info: Arabic & English Names + Slug */}
          <div className="adminFormGrid">
            <label>
              اسم المنتج بالعربي *
              <input
                required
                value={form.name}
                placeholder="مثال: تيشيرت أوفر سايز أسود"
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: form.id ? form.slug : slugify(e.target.value)
                  })
                }
              />
            </label>
            <label>
              اسم المنتج بالإنجليزي (اختياري للترجمة)
              <input
                value={form.nameEn || ""}
                placeholder="مثال: Black Oversized T-Shirt"
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                dir="ltr"
              />
            </label>
          </div>

          <div className="adminFormGrid">
            <label>
              الرابط في المتجر (Slug) *
              <input
                required
                value={form.slug}
                placeholder="black-oversized-tshirt"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                dir="ltr"
              />
            </label>
          </div>

          {/* Pricing */}
          <div className="productPricingSection">
            <div className="adminFormGrid three">
              <label>
                سعر البيع (ج.م) *
                <input
                  required
                  type="number"
                  min="0"
                  value={form.price || ""}
                  placeholder="مثال: 650"
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </label>
              <label>
                السعر قبل الخصم (اختياري)
                <input
                  type="number"
                  min="0"
                  value={form.compareAtPrice ?? ""}
                  placeholder="مثال: 850"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      compareAtPrice: e.target.value ? Number(e.target.value) : undefined
                    })
                  }
                />
              </label>
              <label>
                سعر التكلفة (اختياري)
                <input
                  type="number"
                  min="0"
                  value={form.costPrice ?? ""}
                  placeholder="سعر الشراء من المصنع"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      costPrice: e.target.value ? Number(e.target.value) : undefined
                    })
                  }
                />
              </label>
            </div>

            {/* Live Profit Preview */}
            {form.price > 0 && form.costPrice && form.costPrice > 0 ? (
              <div className="adminProfitCard">
                <div>
                  <span>صافي ربحك في القطعة:</span>
                  <strong>{formatPrice(form.price - form.costPrice)}</strong>
                </div>
                <div>
                  <span>هامش الربح:</span>
                  <strong className="profitGreen">
                    {(((form.price - form.costPrice) / form.price) * 100).toFixed(1)}%
                  </strong>
                </div>
              </div>
            ) : null}
          </div>

          {/* Category & Collection */}
          <div className="adminFormGrid">
            <label>
              القسم *
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <div className="quickPresetPills">
                {PRESET_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`presetPill ${form.category === cat.value ? "active" : ""}`}
                    onClick={() => setForm({ ...form, category: cat.value })}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </label>

            <label>
              المجموعة *
              <select
                value={form.collection}
                onChange={(e) => setForm({ ...form, collection: e.target.value })}
              >
                {PRESET_COLLECTIONS.map((col) => (
                  <option key={col.value} value={col.value}>
                    {col.label}
                  </option>
                ))}
              </select>
              <div className="quickPresetPills">
                {PRESET_COLLECTIONS.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    className={`presetPill ${form.collection === col.value ? "active" : ""}`}
                    onClick={() => setForm({ ...form, collection: col.value })}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </label>
          </div>

          {/* Color Selection as Clickable Chips */}
          <div className="editorSection">
            <div className="editorSectionHead">
              <div>
                <strong>الألوان المتاحة</strong>
                <span className="sectionSelectedBadge">{form.colors.length} ألوان محددة</span>
              </div>
              <button
                type="button"
                className="addCustomColorBtn"
                onClick={() => setShowCustomColor(!showCustomColor)}
              >
                + إضافة لون مخصص
              </button>
            </div>

            {/* Custom Color Inline Form */}
            {showCustomColor && (
              <div className="customColorRow">
                <input
                  type="text"
                  placeholder="اسم اللون (مثال: بترولي)"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  className="customColorNameInput"
                />
                <input
                  type="color"
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  className="customColorPickerInput"
                  title="اختر درجة اللون"
                />
                <button type="button" onClick={addCustomColor} className="customColorSaveBtn">
                  إضافة
                </button>
                <button type="button" onClick={() => setShowCustomColor(false)} className="customColorCancelBtn">
                  إلغاء
                </button>
              </div>
            )}

            {/* Preset Color Chips */}
            <div className="colorChipsGrid">
              {PRESET_COLORS.map((c) => {
                const isSelected = form.colors.some((item) => item.name === c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleColor(c)}
                    className={`colorChipBtn ${isSelected ? "selected" : ""}`}
                  >
                    <span className="colorChipDot" style={{ backgroundColor: c.value }} />
                    <span className="colorChipName">{c.name}</span>
                    {isSelected && <Check size={13} className="colorCheckIcon" />}
                  </button>
                );
              })}
              {/* Custom colors */}
              {form.colors
                .filter((c) => !PRESET_COLORS.some((p) => p.name === c.name))
                .map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleColor(c)}
                    className="colorChipBtn selected"
                  >
                    <span className="colorChipDot" style={{ backgroundColor: c.value }} />
                    <span className="colorChipName">{c.name}</span>
                    <Check size={13} className="colorCheckIcon" />
                  </button>
                ))}
            </div>
          </div>

          {/* Size Selection as Clickable Chips */}
          <div className="editorSection">
            <div className="editorSectionHead">
              <div>
                <strong>المقاسات المتاحة</strong>
                <span className="sectionSelectedBadge">{form.sizes.length} مقاسات محددة</span>
              </div>
              <div className="sizePresetQuickBtns">
                <button
                  type="button"
                  onClick={() => setPresetSizes(["S", "M", "L", "XL", "2XL"])}
                  className="sizeQuickPreset"
                >
                  S إلى 2XL
                </button>
                <button
                  type="button"
                  onClick={() => setPresetSizes(["M", "L", "XL"])}
                  className="sizeQuickPreset"
                >
                  M, L, XL
                </button>
                <button
                  type="button"
                  onClick={() => setPresetSizes(["Oversized"])}
                  className="sizeQuickPreset"
                >
                  أوفر سايز موحد
                </button>
              </div>
            </div>

            <div className="sizeChipsGrid">
              {PRESET_SIZES.map((s) => {
                const isSelected = form.sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`sizeChipBtn ${isSelected ? "selected" : ""}`}
                  >
                    <span>{s}</span>
                    {isSelected && <Check size={12} className="sizeCheckIcon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock & Quantity Management */}
          <div className="editorSection stockSection">
            <div className="editorSectionHead">
              <div>
                <strong>إدارة الكمية والمخزون</strong>
                <span className="totalStockBadge">
                  إجمالي المخزون: <strong>{totalStock}</strong> قطعة
                </span>
              </div>
              <div className="bulkStockApplyBar">
                <span>تطبيق كمية موحدة:</span>
                <input
                  type="number"
                  min="0"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(Math.max(0, Number(e.target.value)))}
                  className="bulkStockNumberInput"
                />
                <button type="button" onClick={applyBulkStock} className="bulkStockApplyBtn">
                  تطبيق على الكل
                </button>
              </div>
            </div>

            <div className="variantStockTableCard">
              <div className="variantStockTableHeader">
                <span>اللون والمقاس</span>
                <span>كود SKU</span>
                <span>الكمية المتاحة</span>
                <span>الحالة</span>
              </div>
              <div className="variantStockTableBody">
                {form.variants.map((v, i) => (
                  <div className="variantStockTableRow" key={`${v.color}-${v.size}-${i}`}>
                    <div className="variantInfoCol">
                      <span
                        className="variantColorMiniDot"
                        style={{
                          backgroundColor:
                            form.colors.find((c) => c.name === v.color)?.value || "#111"
                        }}
                      />
                      <strong>{v.color}</strong>
                      <span className="variantSizeMiniTag">{v.size}</span>
                    </div>
                    <div className="variantSkuCol">
                      <input
                        value={v.sku}
                        onChange={(e) => variantChange(i, { sku: e.target.value })}
                        dir="ltr"
                        placeholder="SKU"
                      />
                    </div>
                    <div className="variantQtyCol">
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) =>
                          variantChange(i, { stock: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </div>
                    <div className="variantActiveCol">
                      <label>
                        <input
                          type="checkbox"
                          checked={v.active !== false}
                          onChange={(e) => variantChange(i, { active: e.target.checked })}
                        />
                        <span>متاح</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Specifications (Fits, Materials, Care) */}
          <div className="adminFormGrid three">
            <label>
              الخامة
              <select
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              >
                {PRESET_MATERIALS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label>
              القصة
              <select
                value={form.fit}
                onChange={(e) => setForm({ ...form, fit: e.target.value })}
              >
                {PRESET_FITS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label>
              تعليمات الغسيل
              <select
                value={form.care}
                onChange={(e) => setForm({ ...form, care: e.target.value })}
              >
                {PRESET_CARE.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Product Status & Badges */}
          <div className="adminFormGrid">
            <label>
              حالة المنتج
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AdminProduct["status"] })}
              >
                <option value="PUBLISHED">منشور بالمتجر (معروض للبيع)</option>
                <option value="DRAFT">مسودة (غير معروض)</option>
                <option value="ARCHIVED">مؤرشف (غير متاح)</option>
              </select>
            </label>

            <div className="adminChecks" style={{ marginTop: "24px" }}>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(form.featured)}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                منتج مميز في الرئيسية
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(form.isNew)}
                  onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                />
                علامة وصل حديثاً
              </label>
            </div>
          </div>

          {/* Subtitle & Description */}
          <div className="adminFormGrid">
            <label>
              العنوان الفرعي بالعربي (اختياري)
              <input
                value={form.subtitle}
                placeholder="مثال: قطن مصري فاخر / مظهر عصري واسع"
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </label>
            <label>
              العنوان الفرعي بالإنجليزي (اختياري للترجمة)
              <input
                value={form.subtitleEn || ""}
                placeholder="مثال: Premium Egyptian Cotton / Modern Fit"
                onChange={(e) => setForm({ ...form, subtitleEn: e.target.value })}
                dir="ltr"
              />
            </label>
          </div>

          <div className="adminFormGrid">
            <label>
              الوصف بالعربي (اختياري)
              <textarea
                rows={3}
                value={form.description}
                placeholder="اكتب وصفاً للمنتج يظهر للعملاء في صفحة الشراء..."
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label>
              الوصف بالإنجليزي (اختياري للترجمة)
              <textarea
                rows={3}
                value={form.descriptionEn || ""}
                placeholder="Product description in English for international customers..."
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                dir="ltr"
              />
            </label>
          </div>

          {/* Media Section */}
          <div className="editorSection mediaEditorSection">
            <ProductMediaField
              label="صور المنتج"
              value={form.images}
              onChange={(images) => setForm({ ...form, images })}
              folder="products"
            />
            <ProductMediaField
              label="إطارات العرض 360° التفاعلية"
              value={form.spinFrames}
              onChange={(spinFrames) => setForm({ ...form, spinFrames })}
              folder="spin"
            />
          </div>

          {/* Save / Cancel Actions */}
          <div className="adminModalActions">
            <button type="button" onClick={onClose}>
              إلغاء
            </button>
            <button className="adminPrimary" disabled={busy}>
              {busy ? "جاري الحفظ…" : "حفظ المنتج"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
