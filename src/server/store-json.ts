import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  AdminProduct,
  CheckoutQuote,
  DiscountRecord,
  OrderRecord,
  OrderStatus,
  StoreData
} from "@/lib/domain";
import type { Product } from "@/lib/types";
import { normalizeGovKey, getDefaultGovRates } from "@/lib/governorates";

const STORE_PATH = process.env.A2_DATA_FILE || path.join(process.cwd(), "data", "store.json");
let writeQueue: Promise<void> = Promise.resolve();

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 14)}`;

async function ensureStoreFile() {
  try {
    await fs.access(STORE_PATH);
  } catch {
    throw new Error(`A² store data file is missing at ${STORE_PATH}. Restore data/store.json or set A2_DATA_FILE.`);
  }
}

export async function readStore(): Promise<StoreData> {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(raw) as StoreData;
}

export async function getStoreMeta() {
  const store = await readStore();
  return clone(store.meta || { demoData: false });
}

export async function mutateStore<T>(mutator: (draft: StoreData) => T | Promise<T>): Promise<T> {
  let result!: T;
  let thrown: unknown;

  writeQueue = writeQueue.then(async () => {
    try {
      const current = await readStore();
      const draft = clone(current);
      result = await mutator(draft);
      const tempPath = `${STORE_PATH}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(draft, null, 2), "utf8");
      await fs.rename(tempPath, STORE_PATH);
    } catch (error) {
      thrown = error;
    }
  });

  await writeQueue;
  if (thrown) throw thrown;
  return result;
}

function dateActive(discount: DiscountRecord, at = new Date()) {
  if (!discount.active) return false;
  if (discount.startsAt && new Date(discount.startsAt) > at) return false;
  if (discount.endsAt && new Date(discount.endsAt) < at) return false;
  if (discount.usageLimit != null && discount.usageCount >= discount.usageLimit) return false;
  return true;
}

function discountAmount(value: number, type: DiscountRecord["type"], base: number) {
  if (type === "PERCENTAGE") return Math.min(base, Math.round(base * (value / 100)));
  return Math.min(base, value);
}

function autoDiscountForProduct(product: AdminProduct, discounts: DiscountRecord[]) {
  const candidates = discounts.filter((discount) => {
    if (discount.code || !dateActive(discount)) return false;
    if (discount.scope === "ORDER") return false;
    if (discount.scope === "PRODUCT") return discount.targetIds.includes(product.id);
    return discount.targetIds.includes(product.collection);
  });

  let best = 0;
  for (const discount of candidates) best = Math.max(best, discountAmount(discount.value, discount.type, product.price));
  return best;
}

export async function getStorefrontProducts(): Promise<Product[]> {
  const store = await readStore();
  return store.products
    .filter((product) => product.status === "PUBLISHED")
    .map((product) => {
      const automatic = autoDiscountForProduct(product, store.discounts);
      if (!automatic) return clone(product);
      return {
        ...clone(product),
        compareAtPrice: product.price,
        price: Math.max(0, product.price - automatic)
      };
    });
}

export async function getStorefrontProduct(slug: string) {
  const products = await getStorefrontProducts();
  return products.find((product) => product.slug === slug);
}

export async function getAdminProducts() {
  const store = await readStore();
  return clone(store.products);
}

export async function createProduct(input: Partial<AdminProduct>) {
  return mutateStore((store) => {
    if (!input.name?.trim()) throw new Error("Product name is required.");
    if (!input.slug?.trim()) throw new Error("Product slug is required.");
    if (store.products.some((item) => item.slug === input.slug)) throw new Error("Slug already exists.");

    const stamp = nowIso();
    const product: AdminProduct = {
      id: id("prd"),
      slug: input.slug.trim(),
      name: input.name.trim(),
      subtitle: input.subtitle?.trim() || "",
      description: input.description?.trim() || "",
      price: Number(input.price || 0),
      compareAtPrice: input.compareAtPrice ? Number(input.compareAtPrice) : undefined,
      category: input.category?.trim() || "Uncategorized",
      collection: input.collection?.trim() || "General",
      status: input.status || "DRAFT",
      colors: input.colors || [],
      sizes: input.sizes || [],
      variants: (input.variants || []).map((variant) => ({
        ...variant,
        id: variant.id || id("var"),
        stock: Math.max(0, Number(variant.stock || 0)),
        lowStockAt: Number(variant.lowStockAt ?? store.settings.lowStockThreshold),
        active: variant.active !== false
      })),
      images: input.images?.length ? input.images : ["/media/demo/full-outfit.webp"],
      spinFrames: input.spinFrames?.length ? input.spinFrames : (input.images?.length ? input.images : ["/media/demo/full-outfit.webp"]),
      featured: Boolean(input.featured),
      isNew: Boolean(input.isNew),
      material: input.material?.trim() || "",
      fit: input.fit?.trim() || "",
      care: input.care?.trim() || "",
      createdAt: stamp,
      updatedAt: stamp
    };

    const skus = new Set<string>();
    for (const variant of product.variants) {
      if (!variant.sku) throw new Error("Every variant needs a SKU.");
      if (skus.has(variant.sku) || store.products.some((p) => p.variants.some((v) => v.sku === variant.sku))) {
        throw new Error(`Duplicate SKU: ${variant.sku}`);
      }
      skus.add(variant.sku);
    }

    store.products.unshift(product);
    return clone(product);
  });
}

export async function updateProduct(productId: string, input: Partial<AdminProduct>) {
  return mutateStore((store) => {
    const index = store.products.findIndex((item) => item.id === productId);
    if (index < 0) throw new Error("Product not found.");
    const current = store.products[index];
    if (input.slug && store.products.some((item) => item.id !== productId && item.slug === input.slug)) throw new Error("Slug already exists.");

    const next: AdminProduct = {
      ...current,
      ...input,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: nowIso(),
      price: input.price != null ? Number(input.price) : current.price,
      compareAtPrice: input.compareAtPrice ? Number(input.compareAtPrice) : input.compareAtPrice === undefined ? current.compareAtPrice : undefined,
      variants: input.variants
        ? input.variants.map((variant) => ({
            ...variant,
            id: variant.id || id("var"),
            stock: Math.max(0, Number(variant.stock || 0)),
            lowStockAt: Number(variant.lowStockAt ?? store.settings.lowStockThreshold),
            active: variant.active !== false
          }))
        : current.variants
    };

    const allOtherSkus = new Set(store.products.filter((p) => p.id !== productId).flatMap((p) => p.variants.map((v) => v.sku)));
    const ownSkus = new Set<string>();
    for (const variant of next.variants) {
      if (!variant.sku) throw new Error("Every variant needs a SKU.");
      if (ownSkus.has(variant.sku) || allOtherSkus.has(variant.sku)) throw new Error(`Duplicate SKU: ${variant.sku}`);
      ownSkus.add(variant.sku);
    }

    store.products[index] = next;
    return clone(next);
  });
}

export async function deleteProduct(productId: string) {
  return mutateStore((store) => {
    const hasOrders = store.orders.some((order) => order.items.some((item) => item.productId === productId));
    if (hasOrders) {
      const product = store.products.find((item) => item.id === productId);
      if (!product) throw new Error("Product not found.");
      product.status = "ARCHIVED";
      product.updatedAt = nowIso();
      return { archived: true };
    }
    store.products = store.products.filter((item) => item.id !== productId);
    return { archived: false };
  });
}

export async function getOrders() {
  const store = await readStore();
  return clone([...store.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function getOrderByNumber(orderNumber: string) {
  const store = await readStore();
  return clone(store.orders.find((item) => item.orderNumber.toUpperCase() === orderNumber.toUpperCase()));
}

const restockStatuses: OrderStatus[] = ["CANCELLED", "RETURNED"];
const fulfilmentStatuses: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "RETURN_REQUESTED"];

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  return mutateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("Order not found.");
    const previous = order.status;
    order.status = status;
    order.updatedAt = nowIso();
    order.statusEvents.push({ status, note, createdAt: order.updatedAt });

    if (restockStatuses.includes(status) && !order.inventoryRestocked) {
      for (const item of order.items) {
        const product = store.products.find((p) => p.id === item.productId);
        const variant = product?.variants.find((v) => v.id === item.variantId || v.sku === item.sku);
        if (!product || !variant) continue;
        variant.stock += item.quantity;
        store.inventoryMovements.unshift({
          id: id("mov"),
          productId: product.id,
          variantId: variant.id,
          sku: variant.sku,
          delta: item.quantity,
          reason: status === "CANCELLED" ? "Order cancellation" : "Returned stock",
          reference: order.orderNumber,
          createdAt: order.updatedAt
        });
      }
      order.inventoryRestocked = true;
    }

    if (fulfilmentStatuses.includes(status) && restockStatuses.includes(previous) && order.inventoryRestocked) {
      throw new Error("A restocked order cannot move back to fulfilment automatically. Adjust inventory manually first.");
    }

    return clone(order);
  });
}

export async function adjustInventory(payload: { sku: string; delta: number; reason: string; reference?: string }) {
  return mutateStore((store) => {
    for (const product of store.products) {
      const variant = product.variants.find((item) => item.sku === payload.sku);
      if (!variant) continue;
      const nextStock = variant.stock + Number(payload.delta);
      if (nextStock < 0) throw new Error("Adjustment would make stock negative.");
      variant.stock = nextStock;
      product.updatedAt = nowIso();
      const movement = {
        id: id("mov"), productId: product.id, variantId: variant.id, sku: variant.sku,
        delta: Number(payload.delta), reason: payload.reason || "Manual adjustment", reference: payload.reference,
        createdAt: nowIso()
      };
      store.inventoryMovements.unshift(movement);
      return clone({ productId: product.id, productName: product.name, variant, movement });
    }
    throw new Error("SKU not found.");
  });
}

export async function getInventory() {
  const store = await readStore();
  return {
    rows: store.products.flatMap((product) => product.variants.map((variant) => ({ ...variant, productId: product.id, product: product.name }))),
    movements: clone(store.inventoryMovements.slice(0, 100)),
    threshold: store.settings.lowStockThreshold
  };
}

export async function getDiscounts() {
  const store = await readStore();
  return clone(store.discounts);
}

export async function createDiscount(input: Partial<DiscountRecord>) {
  return mutateStore((store) => {
    if (!input.name?.trim()) throw new Error("Discount name is required.");
    if (input.code && store.discounts.some((item) => item.code?.toUpperCase() === input.code?.toUpperCase())) throw new Error("Coupon code already exists.");
    const stamp = nowIso();
    const discount: DiscountRecord = {
      id: id("disc"), name: input.name.trim(), code: input.code?.trim().toUpperCase() || undefined,
      type: input.type || "PERCENTAGE", value: Number(input.value || 0), scope: input.scope || "ORDER",
      targetIds: input.targetIds || [], minSubtotal: input.minSubtotal ? Number(input.minSubtotal) : undefined,
      startsAt: input.startsAt || undefined, endsAt: input.endsAt || undefined,
      usageLimit: input.usageLimit ? Number(input.usageLimit) : undefined, usageCount: 0,
      active: input.active !== false, createdAt: stamp, updatedAt: stamp
    };
    if (discount.value <= 0) throw new Error("Discount value must be greater than zero.");
    store.discounts.unshift(discount);
    return clone(discount);
  });
}

export async function updateDiscount(discountId: string, input: Partial<DiscountRecord>) {
  return mutateStore((store) => {
    const item = store.discounts.find((discount) => discount.id === discountId);
    if (!item) throw new Error("Discount not found.");
    if (input.code && store.discounts.some((discount) => discount.id !== discountId && discount.code?.toUpperCase() === input.code?.toUpperCase())) throw new Error("Coupon code already exists.");
    Object.assign(item, input, { code: input.code?.trim().toUpperCase() || input.code, updatedAt: nowIso() });
    return clone(item);
  });
}

export async function deleteDiscount(discountId: string) {
  return mutateStore((store) => {
    store.discounts = store.discounts.filter((item) => item.id !== discountId);
    return { ok: true };
  });
}

export async function getCustomers() {
  const store = await readStore();
  return clone(store.customers.map((customer) => {
    const orders = store.orders.filter((order) => order.customerId === customer.id);
    return {
      ...customer,
      orderCount: orders.length,
      totalSpent: orders.filter((order) => !["CANCELLED", "REFUNDED"].includes(order.status)).reduce((sum, order) => sum + order.grandTotal, 0),
      lastOrderAt: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt
    };
  }));
}

export async function getSettings() {
  const store = await readStore();
  return clone(store.settings);
}

export async function updateSettings(input: Partial<StoreData["settings"]>) {
  return mutateStore((store) => {
    store.settings = { ...store.settings, ...input };
    return clone(store.settings);
  });
}

type CartInput = { sku: string; quantity: number };

function calculateQuoteFromStore(
  store: StoreData,
  cart: CartInput[],
  couponCode?: string,
  governorate?: string
): CheckoutQuote & { pricedItems: Array<{ product: AdminProduct; variant: AdminProduct["variants"][number]; quantity: number; baseUnitPrice: number; unitPrice: number }> } {
  if (!cart.length) throw new Error("Your bag is empty.");
  const pricedItems = cart.map((line) => {
    const product = store.products.find((p) => p.status === "PUBLISHED" && p.variants.some((v) => v.sku === line.sku));
    const variant = product?.variants.find((v) => v.sku === line.sku);
    if (!product || !variant || variant.active === false) throw new Error(`Item ${line.sku} is no longer available.`);
    const quantity = Math.max(1, Math.floor(Number(line.quantity || 1)));
    if (variant.stock < quantity) throw new Error(`${product.name} (${variant.color}/${variant.size}) only has ${variant.stock} left.`);
    const automatic = autoDiscountForProduct(product, store.discounts);
    return { product, variant, quantity, baseUnitPrice: product.price, unitPrice: Math.max(0, product.price - automatic) };
  });

  const baseSubtotal = pricedItems.reduce((sum, item) => sum + item.baseUnitPrice * item.quantity, 0);
  const saleSubtotal = pricedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const automaticDiscount = baseSubtotal - saleSubtotal;

  let couponDiscount = 0;
  let couponMessage: string | undefined;
  let acceptedCode: string | undefined;
  if (couponCode?.trim()) {
    const code = couponCode.trim().toUpperCase();
    const coupon = store.discounts.find((discount) => discount.code?.toUpperCase() === code);
    if (!coupon) couponMessage = "Coupon not found.";
    else if (!dateActive(coupon)) couponMessage = "This coupon is inactive or expired.";
    else if (coupon.minSubtotal && saleSubtotal < coupon.minSubtotal) couponMessage = `Minimum spend is ${coupon.minSubtotal} EGP.`;
    else {
      let eligible = saleSubtotal;
      if (coupon.scope === "PRODUCT") eligible = pricedItems.filter((item) => coupon.targetIds.includes(item.product.id)).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      if (coupon.scope === "COLLECTION") eligible = pricedItems.filter((item) => coupon.targetIds.includes(item.product.collection)).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      if (eligible <= 0) couponMessage = "Coupon does not apply to these items.";
      else {
        couponDiscount = discountAmount(coupon.value, coupon.type, eligible);
        acceptedCode = coupon.code;
        couponMessage = "Coupon applied.";
      }
    }
  }

  const merchandiseAfterDiscount = Math.max(0, saleSubtotal - couponDiscount);
  
  let baseShippingRate = store.settings.flatShippingRate;
  if (governorate?.trim()) {
    const normalized = normalizeGovKey(governorate);
    const govRates = store.settings.governorateRates || getDefaultGovRates();
    if (govRates && govRates[normalized] != null) {
      baseShippingRate = Number(govRates[normalized]);
    } else if (govRates && govRates[governorate.trim()] != null) {
      baseShippingRate = Number(govRates[governorate.trim()]);
    }
  }

  const shippingTotal = merchandiseAfterDiscount >= store.settings.freeShippingThreshold ? 0 : baseShippingRate;
  return {
    subtotal: baseSubtotal,
    automaticDiscount,
    couponDiscount,
    discountTotal: automaticDiscount + couponDiscount,
    shippingTotal,
    grandTotal: merchandiseAfterDiscount + shippingTotal,
    couponCode: acceptedCode,
    couponMessage,
    pricedItems
  };
}

export async function quoteCheckout(cart: CartInput[], couponCode?: string, governorate?: string): Promise<CheckoutQuote> {
  const store = await readStore();
  const { pricedItems: _pricedItems, ...quote } = calculateQuoteFromStore(store, cart, couponCode, governorate);
  return quote;
}

export async function createOrder(input: {
  cart: CartInput[];
  couponCode?: string;
  customer: { firstName: string; lastName: string; phone: string; email: string };
  shipping: { governorate: string; city: string; street: string; notes?: string };
  paymentMethod: "COD" | "CARD";
  notes?: string;
}) {
  return mutateStore((store) => {
    if (!input.customer.phone?.trim()) throw new Error("Phone is required.");
    if (!input.customer.firstName?.trim()) throw new Error("First name is required.");
    if (!input.shipping.governorate?.trim() || !input.shipping.city?.trim() || !input.shipping.street?.trim()) throw new Error("Complete delivery address is required.");
    if (input.paymentMethod === "CARD" && !store.settings.cardEnabled) throw new Error("Online card payment is not enabled yet.");
    if (input.paymentMethod === "COD" && !store.settings.codEnabled) throw new Error("Cash on delivery is not available.");

    const quote = calculateQuoteFromStore(store, input.cart, input.couponCode, input.shipping.governorate);
    const stamp = nowIso();
    let customer = store.customers.find((item) => item.phone === input.customer.phone || (input.customer.email && item.email === input.customer.email));
    if (!customer) {
      customer = { id: id("cus"), ...input.customer, createdAt: stamp, updatedAt: stamp };
      store.customers.unshift(customer);
    } else {
      Object.assign(customer, input.customer, { updatedAt: stamp });
    }

    const highest = store.orders.reduce((max, order) => Math.max(max, Number(order.orderNumber.split("-").at(-1)) || 0), 1048);
    const orderNumber = `A2-${highest + 1}`;
    const order: OrderRecord = {
      id: id("ord"), orderNumber, customerId: customer.id, customer: clone(input.customer), shipping: clone(input.shipping),
      status: "NEW", paymentStatus: input.paymentMethod === "COD" ? "PENDING" : "AUTHORIZED", paymentMethod: input.paymentMethod,
      subtotal: quote.subtotal, discountTotal: quote.discountTotal, shippingTotal: quote.shippingTotal, grandTotal: quote.grandTotal,
      couponCode: quote.couponCode, notes: input.notes, inventoryRestocked: false, createdAt: stamp, updatedAt: stamp,
      items: quote.pricedItems.map((item) => ({
        id: id("oi"), productId: item.product.id, variantId: item.variant.id, productName: item.product.name,
        image: item.product.images[0] || "/media/demo/full-outfit.webp", sku: item.variant.sku, color: item.variant.color, size: item.variant.size,
        baseUnitPrice: item.baseUnitPrice, unitPrice: item.unitPrice, quantity: item.quantity, lineTotal: item.unitPrice * item.quantity
      })),
      statusEvents: [{ status: "NEW", note: "Order placed", createdAt: stamp }]
    };

    for (const item of quote.pricedItems) {
      item.variant.stock -= item.quantity;
      store.inventoryMovements.unshift({
        id: id("mov"), productId: item.product.id, variantId: item.variant.id, sku: item.variant.sku,
        delta: -item.quantity, reason: "Customer order", reference: orderNumber, createdAt: stamp
      });
    }

    if (quote.couponCode) {
      const coupon = store.discounts.find((discount) => discount.code === quote.couponCode);
      if (coupon) coupon.usageCount += 1;
    }

    store.orders.unshift(order);
    return clone(order);
  });
}

export async function requestReturn(orderNumber: string, phone: string, reason: string) {
  return mutateStore((store) => {
    const order = store.orders.find((item) => item.orderNumber.toUpperCase() === orderNumber.toUpperCase() && item.customer.phone === phone);
    if (!order) throw new Error("Order not found.");
    if (order.status !== "DELIVERED") throw new Error("Return requests are available after delivery.");
    order.status = "RETURN_REQUESTED";
    order.updatedAt = nowIso();
    order.statusEvents.push({ status: "RETURN_REQUESTED", note: reason || "Customer requested a return", createdAt: order.updatedAt });
    return clone(order);
  });
}

export async function getDashboardMetrics() {
  const store = await readStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = store.orders.filter((order) => order.createdAt.startsWith(today));
  const paidLike = store.orders.filter((order) => !["CANCELLED", "REFUNDED"].includes(order.status));
  const revenue = paidLike.reduce((sum, order) => sum + order.grandTotal, 0);
  const todayRevenue = todayOrders.filter((order) => !["CANCELLED", "REFUNDED"].includes(order.status)).reduce((sum, order) => sum + order.grandTotal, 0);
  const variants = store.products.flatMap((product) => product.variants);
  const topProducts = store.products.map((product) => {
    const qty = store.orders.flatMap((order) => order.items).filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
    return { id: product.id, name: product.name, category: product.category, qty, revenue: store.orders.flatMap((order) => order.items).filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.lineTotal, 0) };
  }).sort((a, b) => b.qty - a.qty);
  return {
    todayRevenue, todayOrders: todayOrders.length, newOrders: store.orders.filter((order) => order.status === "NEW").length,
    unitsInStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
    lowStock: variants.filter((variant) => variant.stock <= (variant.lowStockAt ?? store.settings.lowStockThreshold)).length,
    revenue, orderCount: store.orders.length, customerCount: store.customers.length,
    recentOrders: clone(store.orders.slice(0, 6)), topProducts: clone(topProducts.slice(0, 5))
  };
}
