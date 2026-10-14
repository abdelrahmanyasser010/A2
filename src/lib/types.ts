export type ProductColor = {
  name: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
  lowStockAt?: number;
  active?: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  subtitle: string;
  subtitleEn?: string;
  description: string;
  descriptionEn?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  category: string;
  collection: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  colors: ProductColor[];
  sizes: string[];
  variants: ProductVariant[];
  images: string[];
  spinFrames: string[];
  featured?: boolean;
  isNew?: boolean;
  material: string;
  fit: string;
  care: string;
};

export function getLocalizedProductName(product: { name: string; nameEn?: string }, language: string): string {
  if (language === "en" && product.nameEn?.trim()) return product.nameEn.trim();
  return product.name;
}

export function getLocalizedProductSubtitle(product: { subtitle?: string; subtitleEn?: string }, language: string): string {
  if (language === "en" && product.subtitleEn?.trim()) return product.subtitleEn.trim();
  return product.subtitle || "";
}

export function getLocalizedProductDescription(product: { description?: string; descriptionEn?: string }, language: string): string {
  if (language === "en" && product.descriptionEn?.trim()) return product.descriptionEn.trim();
  return product.description || "";
}

export function getLocalizedCategory(category: string, language: string): string {
  if (language === "ar") {
    const map: Record<string, string> = {
      "t-shirts": "تيشيرتات",
      "hoodies": "هوديز وسويت شيرت",
      "sweatshirts": "سويت شيرت",
      "pants": "بناطيل وبانتس",
      "jackets": "جاكيتات",
      "accessories": "إكسسوارات"
    };
    return map[category.toLowerCase()] || category;
  }
  return category;
}

export function getLocalizedCollection(collection: string, language: string): string {
  if (language === "ar") {
    const map: Record<string, string> = {
      "essentials": "الأساسيات",
      "new drop": "دروب جديد",
      "summer 2026": "كولكشن الصيف",
      "winter 2026": "كولكشن الشتاء",
      "signature": "إصدار خاص"
    };
    return map[collection.toLowerCase()] || collection;
  }
  return collection;
}

export function getLocalizedColorName(color: string, language: string): string {
  const arToEn: Record<string, string> = {
    "أسود": "Black",
    "أبيض": "White",
    "بيج": "Beige",
    "رمادي": "Grey",
    "زيتي": "Olive",
    "كحلي": "Navy",
    "بني": "Brown",
    "بوردو": "Burgundy",
    "نبيتي": "Burgundy",
    "أخضر": "Green",
    "كافيه": "Cafe"
  };
  const enToAr: Record<string, string> = {
    "black": "أسود",
    "white": "أبيض",
    "beige": "بيج",
    "grey": "رمادي",
    "gray": "رمادي",
    "olive": "زيتي",
    "navy": "كحلي",
    "brown": "بني",
    "burgundy": "نبيتي",
    "bordeaux": "نبيتي",
    "green": "أخضر",
    "cafe": "كافيه"
  };
  if (language === "en") {
    return arToEn[color] || color;
  } else {
    return enToAr[color.toLowerCase()] || color;
  }
}

export function getLocalizedSize(size: string, language: string): string {
  if (language === "ar") {
    if (size.toLowerCase() === "oversized") return "أوفر سايز";
    if (size.toLowerCase() === "free size") return "مقاس موحد";
  }
  return size;
}

export function getImagesForColor(product: Product, colorName: string): string[] {
  if (!colorName || !product.images || !product.images.length) {
    return product.images || [];
  }

  // If product only has 1 color, all images belong to that single color
  if (product.colors && product.colors.length <= 1) {
    return product.images;
  }

  const enColor = getLocalizedColorName(colorName, "en").toLowerCase();
  const arColor = colorName.toLowerCase();

  const keywords = [enColor, arColor];
  if (enColor === "burgundy" || enColor === "bordeaux") {
    keywords.push("burgundy", "bordeaux", "نبيتي", "بوردو");
  } else if (enColor === "grey" || enColor === "gray") {
    keywords.push("grey", "gray", "رمادي");
  } else if (enColor === "black") {
    keywords.push("black", "أسود", "اسود");
  } else if (enColor === "white") {
    keywords.push("white", "أبيض", "ابيض");
  } else if (enColor === "olive") {
    keywords.push("olive", "زيتي");
  } else if (enColor === "navy") {
    keywords.push("navy", "كحلي");
  } else if (enColor === "beige") {
    keywords.push("beige", "بيج");
  } else if (enColor === "brown") {
    keywords.push("brown", "بني");
  }

  const filtered = product.images.filter((url) => {
    const lower = url.toLowerCase();
    return keywords.some((kw) => lower.includes(kw));
  });

  return filtered.length > 0 ? filtered : product.images;
}

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  nameEn?: string;
  image: string;
  price: number;
  color: string;
  size: string;
  sku: string;
  quantity: number;
  variantId?: string;
  maxStock?: number;
};
