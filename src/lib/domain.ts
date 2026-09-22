import type { Product } from "./types";

export type AdminProduct = Product & {
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export type OrderItemRecord = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  image: string;
  sku: string;
  color: string;
  size: string;
  baseUnitPrice: number;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: { firstName: string; lastName: string; phone: string; email: string };
  shipping: { governorate: string; city: string; street: string; notes?: string };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "COD" | "CARD";
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  couponCode?: string;
  notes?: string;
  items: OrderItemRecord[];
  statusEvents: { status: OrderStatus; note?: string; createdAt: string }[];
  inventoryRestocked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerRecord = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryMovementRecord = {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  delta: number;
  reason: string;
  reference?: string;
  createdAt: string;
};

export type DiscountScope = "ORDER" | "PRODUCT" | "COLLECTION";
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type DiscountRecord = {
  id: string;
  name: string;
  code?: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  targetIds: string[];
  minSubtotal?: number;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettings = {
  currency: "EGP";
  flatShippingRate: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  cardEnabled: boolean;
  lowStockThreshold: number;
  supportPhone: string;
  supportEmail: string;
  governorateRates?: Record<string, number>;
};

export type StoreMeta = {
  demoData: boolean;
  seedName?: string;
  seededAt?: string;
  note?: string;
};

export type StoreData = {
  version: number;
  meta?: StoreMeta;
  products: AdminProduct[];
  orders: OrderRecord[];
  customers: CustomerRecord[];
  discounts: DiscountRecord[];
  inventoryMovements: InventoryMovementRecord[];
  settings: StoreSettings;
};

export type CheckoutQuote = {
  subtotal: number;
  automaticDiscount: number;
  couponDiscount: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  couponCode?: string;
  couponMessage?: string;
};
