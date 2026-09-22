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
  subtitle: string;
  description: string;
  price: number;
  compareAtPrice?: number;
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

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  color: string;
  size: string;
  sku: string;
  quantity: number;
  variantId?: string;
  maxStock?: number;
};
