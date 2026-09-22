"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Product } from "@/lib/types";
import { ProductGrid } from "./ProductGrid";
import { useStore } from "./StoreProvider";

const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function ShopClient({ products, initialCategory = "" }: { products: Product[]; initialCategory?: string }) {
  const { t, language } = useStore();
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((item) => item.category)))], [products]);
  const sizes = useMemo(() => Array.from(new Set(products.flatMap((item) => item.sizes))), [products]);
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => product.colors.forEach((color) => map.set(color.name, color.value)));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [products]);

  const initial = categories.find((item) => slug(item) === slug(initialCategory)) || "All";
  const [filterOpen, setFilterOpen] = useState(false);
  const [category, setCategory] = useState(initial);
  const [sort, setSort] = useState("featured");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const toggle = (value: string, current: string[], setter: (next: string[]) => void) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const activeFilterCount = selectedSizes.length + selectedColors.length + Number(inStockOnly) + Number(category !== "All");

  const visible = useMemo(() => {
    let next = products.filter((product) => {
      if (category !== "All" && product.category !== category) return false;
      const available = product.variants.filter((variant) => variant.active !== false && variant.stock > 0);
      if (inStockOnly && available.length === 0) return false;
      if (selectedSizes.length || selectedColors.length) {
        const matchingCombination = available.some((variant) =>
          (!selectedSizes.length || selectedSizes.includes(variant.size)) &&
          (!selectedColors.length || selectedColors.includes(variant.color))
        );
        if (!matchingCombination) return false;
      }
      return true;
    });

    next = [...next];
    if (sort === "price-low") next.sort((a, b) => a.price - b.price);
    if (sort === "price-high") next.sort((a, b) => b.price - a.price);
    if (sort === "new") next.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    if (sort === "featured") next.sort((a, b) => Number(b.featured) - Number(a.featured));
    return next;
  }, [products, category, sort, selectedSizes, selectedColors, inStockOnly]);

  function clearFilters() {
    setCategory("All");
    setSelectedSizes([]);
    setSelectedColors([]);
    setInStockOnly(false);
  }

  const categoryLabel = (item: string) => {
    if (item === "All") return t("allCategory");
    if (language === "ar") {
      if (item.toLowerCase() === "t-shirts") return "تيشيرتات";
      if (item.toLowerCase() === "hoodies") return "هوديز";
      if (item.toLowerCase() === "pants") return "بناطيل";
    }
    return item;
  };

  return (
    <>
      <header className="pageHero compactHero">
        <p className="eyebrow">{t("shopHeroEyebrow")}</p>
        <h1>{t("shopHeroTitle")}</h1>
        <p>{t("shopHeroDesc")}</p>
      </header>

      <div className="shopToolbar">
        <div className="categoryPills">
          {categories.map((item) => (
            <button
              key={item}
              className={item === category ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {categoryLabel(item)}
            </button>
          ))}
        </div>
        <div className="shopTools">
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
            <option value="featured">{t("filterFeatured")}</option>
            <option value="new">{t("filterNewest")}</option>
            <option value="price-low">{t("filterPriceLow")}</option>
            <option value="price-high">{t("filterPriceHigh")}</option>
          </select>
          <button className="filterButton" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal size={17} /> {t("filtersBtn")} {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
          </button>
        </div>
      </div>

      <div className="shopResultLine">
        <span>{t("piecesCount", { count: String(visible.length) })}</span>
        {activeFilterCount > 0 && <button onClick={clearFilters}>{t("clearFilters")}</button>}
      </div>
      <ProductGrid products={visible} />
      {visible.length === 0 && (
        <div className="emptyShopState">
          <p>{t("noMatches")}</p>
          <button className="ghostButton" onClick={clearFilters}>
            {t("resetFilters")}
          </button>
        </div>
      )}

      <div className={`filterSheetBackdrop ${filterOpen ? "open" : ""}`} onClick={() => setFilterOpen(false)} />
      <aside className={`filterSheet ${filterOpen ? "open" : ""}`} aria-hidden={!filterOpen}>
        <div className="sheetHandle" />
        <div className="sheetHeading">
          <strong>{t("filtersBtn")}</strong>
          <button onClick={() => setFilterOpen(false)} aria-label="Close filters">
            <X size={20} />
          </button>
        </div>
        <div className="filterGroup">
          <span>{t("filterCategory")}</span>
          <div className="filterChoiceGrid">
            {categories.map((item) => (
              <button
                key={item}
                className={item === category ? "active" : ""}
                onClick={() => setCategory(item)}
              >
                {categoryLabel(item)}
              </button>
            ))}
          </div>
        </div>
        <div className="filterGroup">
          <span>{t("filterSize")}</span>
          <div className="filterChoiceGrid compact">
            {sizes.map((size) => (
              <button
                key={size}
                className={selectedSizes.includes(size) ? "active" : ""}
                onClick={() => toggle(size, selectedSizes, setSelectedSizes)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        <div className="filterGroup">
          <span>{t("filterColor")}</span>
          <div className="filterColorList">
            {colors.map((color) => (
              <button
                key={color.name}
                className={selectedColors.includes(color.name) ? "active" : ""}
                onClick={() => toggle(color.name, selectedColors, setSelectedColors)}
              >
                <i style={{ background: color.value }} />
                <span>{color.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="filterGroup compactGroup">
          <label className="filterInlineCheck">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span>{t("inStockOnly")}</span>
          </label>
        </div>
        <div className="filterSheetActions">
          <button className="filterReset" onClick={clearFilters}>
            {t("resetFilters")}
          </button>
          <button className="primaryButton" onClick={() => setFilterOpen(false)}>
            {t("showProductsBtn", { count: String(visible.length) })}
          </button>
        </div>
      </aside>
    </>
  );
}
