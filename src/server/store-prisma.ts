import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type {
  AdminProduct,
  CheckoutQuote,
  DiscountRecord,
  OrderRecord,
  OrderStatus,
  StoreData,
  StoreSettings
} from "@/lib/domain";
import type { Product } from "@/lib/types";

type Db = typeof prisma | Prisma.TransactionClient;
type CartInput = { sku: string; quantity: number };

const money = (value: Prisma.Decimal | number | string | null | undefined) => Number(value ?? 0);
const now = () => new Date();
const iso = (value: Date | string | null | undefined) => value ? new Date(value).toISOString() : undefined;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const productInclude = {
  category: true,
  collections: { include: { collection: true }, orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: [{ colorName: "asc" as const }, { size: "asc" as const }] },
  images: { orderBy: [{ isSpin: "asc" as const }, { sortOrder: "asc" as const }] }
};

const discountInclude = {
  products: true,
  collections: { include: { collection: true } }
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

async function settingsOf(db: Db = prisma) {
  return db.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" }
  });
}

function mapSettings(row: Awaited<ReturnType<typeof settingsOf>>): StoreSettings {
  return {
    currency: "EGP",
    flatShippingRate: money(row.flatShippingRate),
    freeShippingThreshold: money(row.freeShippingThreshold),
    codEnabled: row.codEnabled,
    cardEnabled: row.cardEnabled,
    lowStockThreshold: row.lowStockThreshold,
    supportPhone: row.supportPhone || "",
    supportEmail: row.supportEmail || ""
  };
}

function mapProduct(row: any): AdminProduct {
  const regularImages = row.images.filter((image: any) => !image.isSpin).sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((image: any) => image.url);
  const spinFrames = row.images.filter((image: any) => image.isSpin).sort((a: any, b: any) => (a.spinFrame ?? a.sortOrder) - (b.spinFrame ?? b.sortOrder)).map((image: any) => image.url);
  const variants = row.variants.map((variant: any) => ({
    id: variant.id,
    sku: variant.sku,
    color: variant.colorName,
    size: variant.size,
    stock: variant.stockOnHand,
    lowStockAt: variant.lowStockAt,
    active: variant.active
  }));
  const colors = Array.from(new Map(row.variants.map((variant: any) => [variant.colorName, { name: variant.colorName, value: variant.colorHex || "#111111" }])).values()) as Array<{name:string;value:string}>;
  const sizes = Array.from(new Set(row.variants.map((variant: any) => variant.size))) as string[];
  const collection = row.collections[0]?.collection?.name || "General";
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle || "",
    description: row.description || "",
    price: money(row.basePrice),
    compareAtPrice: row.compareAtPrice == null ? undefined : money(row.compareAtPrice),
    category: row.category?.name || "Uncategorized",
    collection,
    status: row.status,
    colors,
    sizes,
    variants,
    images: regularImages.length ? regularImages : ["/media/demo/full-outfit.webp"],
    spinFrames: spinFrames.length ? spinFrames : (regularImages.length ? regularImages : ["/media/demo/full-outfit.webp"]),
    featured: row.featured,
    isNew: row.isNew,
    material: row.material || "",
    fit: row.fit || "",
    care: row.care || "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapDiscount(row: any): DiscountRecord {
  const targetIds = row.scope === "PRODUCT"
    ? row.products.map((entry: any) => entry.productId)
    : row.scope === "COLLECTION"
      ? row.collections.map((entry: any) => entry.collection.name)
      : [];
  return {
    id: row.id,
    name: row.name,
    code: row.code || undefined,
    type: row.type,
    scope: row.scope,
    value: money(row.value),
    targetIds,
    minSubtotal: row.minSubtotal == null ? undefined : money(row.minSubtotal),
    startsAt: iso(row.startsAt),
    endsAt: iso(row.endsAt),
    usageLimit: row.usageLimit ?? undefined,
    usageCount: row.usageCount,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapOrder(row: any): OrderRecord {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerId: row.customerId || "",
    customer: {
      firstName: row.customerFirstName,
      lastName: row.customerLastName,
      phone: row.customerPhone,
      email: row.customerEmail || ""
    },
    shipping: {
      governorate: row.shipping.governorate,
      city: row.shipping.city,
      street: row.shipping.street,
      notes: row.shipping.notes || undefined
    },
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod === "CARD" ? "CARD" : "COD",
    subtotal: money(row.subtotal),
    discountTotal: money(row.discountTotal),
    shippingTotal: money(row.shippingTotal),
    grandTotal: money(row.grandTotal),
    couponCode: row.couponCode || undefined,
    notes: row.notes || undefined,
    items: row.items.map((item: any) => ({
      id: item.id,
      productId: item.productId || "",
      variantId: item.variantId || "",
      productName: item.productName,
      image: item.image,
      sku: item.sku,
      color: item.color,
      size: item.size,
      baseUnitPrice: money(item.baseUnitPrice),
      unitPrice: money(item.unitPrice),
      quantity: item.quantity,
      lineTotal: money(item.lineTotal)
    })),
    statusEvents: row.statusEvents.map((event: any) => ({
      status: event.status,
      note: event.note || undefined,
      createdAt: event.createdAt.toISOString()
    })),
    inventoryRestocked: row.inventoryRestocked,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function activeDiscount(row: any, at = new Date()) {
  if (!row.active) return false;
  if (row.startsAt && row.startsAt > at) return false;
  if (row.endsAt && row.endsAt < at) return false;
  if (row.usageLimit != null && row.usageCount >= row.usageLimit) return false;
  return true;
}

function discountAmount(value: number, type: "PERCENTAGE" | "FIXED_AMOUNT", base: number) {
  if (type === "PERCENTAGE") return Math.min(base, Math.round(base * (value / 100)));
  return Math.min(base, value);
}

function automaticDiscount(product: AdminProduct, discountRows: any[]) {
  let best = 0;
  for (const row of discountRows) {
    if (row.code || !activeDiscount(row) || row.scope === "ORDER") continue;
    const applies = row.scope === "PRODUCT"
      ? row.products.some((entry: any) => entry.productId === product.id)
      : row.collections.some((entry: any) => entry.collection.name === product.collection);
    if (!applies) continue;
    best = Math.max(best, discountAmount(money(row.value), row.type, product.price));
  }
  return best;
}

async function categoryAndCollection(db: Db, categoryName: string, collectionName: string) {
  const category = await db.category.upsert({
    where: { name: categoryName || "Uncategorized" },
    update: {},
    create: { name: categoryName || "Uncategorized", slug: `${slugify(categoryName || "uncategorized")}-${Math.random().toString(36).slice(2,7)}` }
  });
  const collection = await db.collection.upsert({
    where: { name: collectionName || "General" },
    update: { active: true },
    create: { name: collectionName || "General", slug: `${slugify(collectionName || "general")}-${Math.random().toString(36).slice(2,7)}` }
  });
  return { category, collection };
}

function imageCreateData(product: Partial<AdminProduct>) {
  const regular = (product.images || []).map((url, index) => ({
    url,
    storageKey: storageKeyFromUrl(url),
    alt: product.name || "A² product",
    sortOrder: index,
    isSpin: false
  }));
  const spin = (product.spinFrames || []).map((url, index) => ({
    url,
    storageKey: storageKeyFromUrl(url),
    alt: `${product.name || "A² product"} 360 frame ${index + 1}`,
    sortOrder: index,
    isSpin: true,
    spinFrame: index
  }));
  return [...regular, ...spin];
}

function storageKeyFromUrl(url: string) {
  if (url.startsWith("/uploads/")) return url.slice("/uploads/".length);
  const base = process.env.MEDIA_PUBLIC_URL?.replace(/\/$/, "");
  return base && url.startsWith(`${base}/`) ? url.slice(base.length + 1) : undefined;
}

export async function getStoreMeta() {
  const settings = await settingsOf();
  return {
    demoData: settings.demoData,
    seedName: settings.seedName || undefined,
    seededAt: iso(settings.seededAt),
    note: settings.note || undefined
  };
}

export async function getStorefrontProducts(): Promise<Product[]> {
  const [rows, discounts] = await Promise.all([
    prisma.product.findMany({ where: { status: "PUBLISHED" }, include: productInclude, orderBy: { createdAt: "desc" } }),
    prisma.discount.findMany({ include: discountInclude })
  ]);
  return rows.map((row) => {
    const product = mapProduct(row);
    const amount = automaticDiscount(product, discounts);
    if (!amount) return product;
    return { ...product, compareAtPrice: product.price, price: Math.max(0, product.price - amount) };
  });
}

export async function getStorefrontProduct(slug: string) {
  const products = await getStorefrontProducts();
  return products.find((product) => product.slug === slug);
}

export async function getAdminProducts() {
  const rows = await prisma.product.findMany({ include: productInclude, orderBy: { createdAt: "desc" } });
  return rows.map(mapProduct);
}

function normalizeVariants(input: Partial<AdminProduct>, defaultLowStock: number) {
  return (input.variants || []).map((variant) => ({
    id: variant.id || undefined,
    sku: variant.sku.trim(),
    colorName: variant.color.trim(),
    colorHex: input.colors?.find((color) => color.name === variant.color)?.value || "#111111",
    size: variant.size.trim(),
    stockOnHand: Math.max(0, Math.floor(Number(variant.stock || 0))),
    lowStockAt: Math.max(0, Math.floor(Number(variant.lowStockAt ?? defaultLowStock))),
    active: variant.active !== false
  }));
}

export async function createProduct(input: Partial<AdminProduct>) {
  if (!input.name?.trim()) throw new Error("Product name is required.");
  if (!input.slug?.trim()) throw new Error("Product slug is required.");
  const settings = await settingsOf();
  const variants = normalizeVariants(input, settings.lowStockThreshold);
  if (!variants.length) throw new Error("At least one product variant is required.");
  if (new Set(variants.map((variant) => variant.sku)).size !== variants.length) throw new Error("Every variant needs a unique SKU.");

  const row = await prisma.$transaction(async (tx) => {
    const { category, collection } = await categoryAndCollection(tx, input.category || "Uncategorized", input.collection || "General");
    return tx.product.create({
      data: {
        slug: input.slug!.trim(),
        name: input.name!.trim(),
        subtitle: input.subtitle?.trim() || "",
        description: input.description?.trim() || "",
        basePrice: new Prisma.Decimal(Number(input.price || 0)),
        compareAtPrice: input.compareAtPrice == null ? null : new Prisma.Decimal(Number(input.compareAtPrice)),
        status: input.status || "DRAFT",
        material: input.material?.trim() || "",
        fit: input.fit?.trim() || "",
        care: input.care?.trim() || "",
        featured: Boolean(input.featured),
        isNew: Boolean(input.isNew),
        categoryId: category.id,
        collections: { create: [{ collectionId: collection.id, sortOrder: 0 }] },
        variants: { create: variants.map(({ id: _id, ...variant }) => variant) },
        images: { create: imageCreateData(input) }
      },
      include: productInclude
    });
  });
  return mapProduct(row);
}

export async function updateProduct(productId: string, input: Partial<AdminProduct>) {
  const row = await prisma.$transaction(async (tx) => {
    const current = await tx.product.findUnique({ where: { id: productId }, include: { variants: { include: { _count: { select: { orderItems: true, movements: true } } } } } });
    if (!current) throw new Error("Product not found.");
    const settings = await settingsOf(tx);
    const { category, collection } = await categoryAndCollection(tx, input.category || "Uncategorized", input.collection || "General");
    const incoming = input.variants ? normalizeVariants(input, settings.lowStockThreshold) : null;

    if (incoming) {
      const used = new Set<string>();
      for (const variant of incoming) {
        if (!variant.sku) throw new Error("Every variant needs a SKU.");
        if (used.has(variant.sku)) throw new Error(`Duplicate SKU: ${variant.sku}`);
        used.add(variant.sku);
        const existing = current.variants.find((item) => (variant.id && item.id === variant.id) || item.sku === variant.sku);
        if (existing) {
          await tx.productVariant.update({
            where: { id: existing.id },
            data: {
              sku: variant.sku,
              colorName: variant.colorName,
              colorHex: variant.colorHex,
              size: variant.size,
              stockOnHand: variant.stockOnHand,
              lowStockAt: variant.lowStockAt,
              active: variant.active
            }
          });
        } else {
          await tx.productVariant.create({ data: { productId, ...variant, id: undefined } });
        }
      }
      const incomingIds = new Set(incoming.map((variant) => variant.id).filter(Boolean));
      const incomingSkus = new Set(incoming.map((variant) => variant.sku));
      for (const existing of current.variants) {
        if (incomingIds.has(existing.id) || incomingSkus.has(existing.sku)) continue;
        if (existing._count.orderItems || existing._count.movements) {
          await tx.productVariant.update({ where: { id: existing.id }, data: { active: false } });
        } else {
          await tx.productVariant.delete({ where: { id: existing.id } });
        }
      }
    }

    if (input.images || input.spinFrames) {
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productImage.createMany({ data: imageCreateData(input).map((image) => ({ productId, ...image })) });
    }

    await tx.productCollection.deleteMany({ where: { productId } });
    await tx.productCollection.create({ data: { productId, collectionId: collection.id, sortOrder: 0 } });

    return tx.product.update({
      where: { id: productId },
      data: {
        slug: input.slug,
        name: input.name,
        subtitle: input.subtitle,
        description: input.description,
        basePrice: input.price == null ? undefined : new Prisma.Decimal(Number(input.price)),
        compareAtPrice: input.compareAtPrice === undefined ? undefined : input.compareAtPrice == null ? null : new Prisma.Decimal(Number(input.compareAtPrice)),
        status: input.status,
        material: input.material,
        fit: input.fit,
        care: input.care,
        featured: input.featured,
        isNew: input.isNew,
        categoryId: category.id
      },
      include: productInclude
    });
  });
  return mapProduct(row);
}

export async function deleteProduct(productId: string) {
  const [orderCount, movementCount] = await Promise.all([
    prisma.orderItem.count({ where: { productId } }),
    prisma.inventoryMovement.count({ where: { variant: { productId } } })
  ]);
  if (orderCount || movementCount) {
    await prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED" } });
    return { archived: true };
  }
  await prisma.product.delete({ where: { id: productId } });
  return { archived: false };
}

const orderInclude = {
  shipping: true,
  items: true,
  statusEvents: { orderBy: { createdAt: "asc" as const } }
};

export async function getOrders() {
  const rows = await prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: "desc" } });
  return rows.map(mapOrder);
}

export async function getOrderByNumber(orderNumber: string) {
  const row = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() }, include: orderInclude });
  return row ? mapOrder(row) : undefined;
}

const restockStatuses: OrderStatus[] = ["CANCELLED", "RETURNED"];
const fulfilmentStatuses: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "RETURN_REQUESTED"];

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  const row = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { ...orderInclude, items: true } });
    if (!order) throw new Error("Order not found.");
    if (fulfilmentStatuses.includes(status) && restockStatuses.includes(order.status as OrderStatus) && order.inventoryRestocked) {
      throw new Error("A restocked order cannot move back to fulfilment automatically. Adjust inventory manually first.");
    }
    if (restockStatuses.includes(status) && !order.inventoryRestocked) {
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stockOnHand: { increment: item.quantity } } });
        await tx.inventoryMovement.create({ data: { variantId: item.variantId, delta: item.quantity, reason: status === "CANCELLED" ? "Order cancellation" : "Returned stock", reference: order.orderNumber } });
      }
    }
    return tx.order.update({
      where: { id: orderId },
      data: {
        status,
        inventoryRestocked: restockStatuses.includes(status) ? true : order.inventoryRestocked,
        statusEvents: { create: { status, note: note || null } }
      },
      include: orderInclude
    });
  });
  return mapOrder(row);
}

export async function adjustInventory(payload: { sku: string; delta: number; reason: string; reference?: string }) {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({ where: { sku: payload.sku }, include: { product: true } });
    if (!variant) throw new Error("SKU not found.");
    const nextStock = variant.stockOnHand + Number(payload.delta);
    if (nextStock < 0) throw new Error("Adjustment would make stock negative.");
    const updated = await tx.productVariant.update({ where: { id: variant.id }, data: { stockOnHand: nextStock } });
    const movement = await tx.inventoryMovement.create({ data: { variantId: variant.id, delta: Number(payload.delta), reason: payload.reason || "Manual adjustment", reference: payload.reference } });
    return clone({
      productId: variant.productId,
      productName: variant.product.name,
      variant: { id: updated.id, sku: updated.sku, color: updated.colorName, size: updated.size, stock: updated.stockOnHand, lowStockAt: updated.lowStockAt, active: updated.active },
      movement: { id: movement.id, productId: variant.productId, variantId: variant.id, sku: variant.sku, delta: movement.delta, reason: movement.reason, reference: movement.reference || undefined, createdAt: movement.createdAt.toISOString() }
    });
  });
}

export async function getInventory() {
  const [rows, movements, settings] = await Promise.all([
    prisma.productVariant.findMany({ include: { product: true }, orderBy: { sku: "asc" } }),
    prisma.inventoryMovement.findMany({ include: { variant: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    settingsOf()
  ]);
  return {
    rows: rows.sort((a, b) => a.product.name.localeCompare(b.product.name) || a.sku.localeCompare(b.sku)).map((variant) => ({ id: variant.id, sku: variant.sku, color: variant.colorName, size: variant.size, stock: variant.stockOnHand, lowStockAt: variant.lowStockAt, active: variant.active, productId: variant.productId, product: variant.product.name })),
    movements: movements.map((movement) => ({ id: movement.id, productId: movement.variant.productId, variantId: movement.variantId, sku: movement.variant.sku, delta: movement.delta, reason: movement.reason, reference: movement.reference || undefined, createdAt: movement.createdAt.toISOString() })),
    threshold: settings.lowStockThreshold
  };
}

export async function getDiscounts() {
  const rows = await prisma.discount.findMany({ include: discountInclude, orderBy: { createdAt: "desc" } });
  return rows.map(mapDiscount);
}

async function discountTargetData(db: Db, input: Partial<DiscountRecord>) {
  const productTargets = input.scope === "PRODUCT" ? (input.targetIds || []) : [];
  const collectionNames = input.scope === "COLLECTION" ? (input.targetIds || []) : [];
  const collections: string[] = [];
  for (const name of collectionNames) {
    const collection = await db.collection.upsert({ where: { name }, update: {}, create: { name, slug: `${slugify(name)}-${Math.random().toString(36).slice(2,7)}` } });
    collections.push(collection.id);
  }
  return { productTargets, collections };
}

export async function createDiscount(input: Partial<DiscountRecord>) {
  if (!input.name?.trim()) throw new Error("Discount name is required.");
  if (Number(input.value || 0) <= 0) throw new Error("Discount value must be greater than zero.");
  const row = await prisma.$transaction(async (tx) => {
    const targets = await discountTargetData(tx, input);
    return tx.discount.create({
      data: {
        name: input.name!.trim(),
        code: input.code?.trim().toUpperCase() || null,
        type: input.type || "PERCENTAGE",
        scope: input.scope || "ORDER",
        value: new Prisma.Decimal(Number(input.value || 0)),
        minSubtotal: input.minSubtotal == null ? null : new Prisma.Decimal(Number(input.minSubtotal)),
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        usageLimit: input.usageLimit == null ? null : Number(input.usageLimit),
        usageCount: Number(input.usageCount || 0),
        active: input.active !== false,
        products: { create: targets.productTargets.map((productId) => ({ productId })) },
        collections: { create: targets.collections.map((collectionId) => ({ collectionId })) }
      },
      include: discountInclude
    });
  });
  return mapDiscount(row);
}

export async function updateDiscount(discountId: string, input: Partial<DiscountRecord>) {
  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.discount.findUnique({ where: { id: discountId }, include: discountInclude });
    if (!existing) throw new Error("Discount not found.");
    let targets: { productTargets: string[]; collections: string[] } | null = null;
    if (input.scope || input.targetIds) {
      const current = mapDiscount(existing);
      targets = await discountTargetData(tx, {
        scope: input.scope ?? current.scope,
        targetIds: input.targetIds ?? current.targetIds
      });
    }
    if (targets) {
      await tx.discountProduct.deleteMany({ where: { discountId } });
      await tx.discountCollection.deleteMany({ where: { discountId } });
      if (targets.productTargets.length) await tx.discountProduct.createMany({ data: targets.productTargets.map((productId) => ({ discountId, productId })) });
      if (targets.collections.length) await tx.discountCollection.createMany({ data: targets.collections.map((collectionId) => ({ discountId, collectionId })) });
    }
    return tx.discount.update({
      where: { id: discountId },
      data: {
        name: input.name,
        code: input.code === undefined ? undefined : input.code?.trim().toUpperCase() || null,
        type: input.type,
        scope: input.scope,
        value: input.value == null ? undefined : new Prisma.Decimal(Number(input.value)),
        minSubtotal: input.minSubtotal === undefined ? undefined : input.minSubtotal == null ? null : new Prisma.Decimal(Number(input.minSubtotal)),
        startsAt: input.startsAt === undefined ? undefined : input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt === undefined ? undefined : input.endsAt ? new Date(input.endsAt) : null,
        usageLimit: input.usageLimit === undefined ? undefined : input.usageLimit ?? null,
        active: input.active
      },
      include: discountInclude
    });
  });
  return mapDiscount(row);
}

export async function deleteDiscount(discountId: string) {
  await prisma.discount.delete({ where: { id: discountId } });
  return { ok: true };
}

export async function getCustomers() {
  const rows = await prisma.customer.findMany({
    include: { orders: { select: { grandTotal: true, status: true, createdAt: true } } },
    orderBy: { createdAt: "desc" }
  });
  return rows.map((customer) => {
    const orders = customer.orders;
    return {
      id: customer.id,
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      phone: customer.phone,
      email: customer.email || "",
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      orderCount: orders.length,
      totalSpent: orders.filter((order) => !["CANCELLED", "REFUNDED"].includes(order.status)).reduce((sum, order) => sum + money(order.grandTotal), 0),
      lastOrderAt: orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt.toISOString()
    };
  });
}

export async function getSettings() {
  return mapSettings(await settingsOf());
}

export async function updateSettings(input: Partial<StoreData["settings"]>) {
  const row = await prisma.storeSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      currency: "EGP",
      flatShippingRate: new Prisma.Decimal(Number(input.flatShippingRate ?? 90)),
      freeShippingThreshold: new Prisma.Decimal(Number(input.freeShippingThreshold ?? 2500)),
      codEnabled: input.codEnabled ?? true,
      cardEnabled: input.cardEnabled ?? false,
      lowStockThreshold: Number(input.lowStockThreshold ?? 4),
      supportPhone: input.supportPhone || "",
      supportEmail: input.supportEmail || ""
    },
    update: {
      flatShippingRate: input.flatShippingRate == null ? undefined : new Prisma.Decimal(Number(input.flatShippingRate)),
      freeShippingThreshold: input.freeShippingThreshold == null ? undefined : new Prisma.Decimal(Number(input.freeShippingThreshold)),
      codEnabled: input.codEnabled,
      cardEnabled: input.cardEnabled,
      lowStockThreshold: input.lowStockThreshold,
      supportPhone: input.supportPhone,
      supportEmail: input.supportEmail
    }
  });
  return mapSettings(row);
}

async function pricingContext(db: Db, cart: CartInput[]) {
  const skus = cart.map((line) => line.sku);
  const [variantRows, discounts, settings] = await Promise.all([
    db.productVariant.findMany({ where: { sku: { in: skus } }, include: { product: { include: productInclude } } }),
    db.discount.findMany({ include: discountInclude }),
    settingsOf(db)
  ]);
  const productsById = new Map<string, AdminProduct>();
  for (const row of variantRows) if (!productsById.has(row.productId)) productsById.set(row.productId, mapProduct(row.product));
  return { variantRows, discounts, settings, productsById };
}

async function calculateQuote(db: Db, cart: CartInput[], couponCode?: string, _governorate?: string) {
  if (!cart.length) throw new Error("Your bag is empty.");
  const context = await pricingContext(db, cart);
  const variantBySku = new Map(context.variantRows.map((variant) => [variant.sku, variant]));
  const pricedItems = cart.map((line) => {
    const variant = variantBySku.get(line.sku);
    const product = variant ? context.productsById.get(variant.productId) : undefined;
    if (!variant || !product || product.status !== "PUBLISHED" || !variant.active) throw new Error(`Item ${line.sku} is no longer available.`);
    const quantity = Math.max(1, Math.floor(Number(line.quantity || 1)));
    if (variant.stockOnHand < quantity) throw new Error(`${product.name} (${variant.colorName}/${variant.size}) only has ${variant.stockOnHand} left.`);
    const automatic = automaticDiscount(product, context.discounts);
    return { product, variant, quantity, baseUnitPrice: product.price, unitPrice: Math.max(0, product.price - automatic) };
  });
  const baseSubtotal = pricedItems.reduce((sum, item) => sum + item.baseUnitPrice * item.quantity, 0);
  const saleSubtotal = pricedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const automaticDiscountTotal = baseSubtotal - saleSubtotal;
  let couponDiscount = 0;
  let couponMessage: string | undefined;
  let acceptedCode: string | undefined;
  if (couponCode?.trim()) {
    const code = couponCode.trim().toUpperCase();
    const coupon = context.discounts.find((discount) => discount.code?.toUpperCase() === code);
    if (!coupon) couponMessage = "Coupon not found.";
    else if (!activeDiscount(coupon)) couponMessage = "This coupon is inactive or expired.";
    else if (coupon.minSubtotal && saleSubtotal < money(coupon.minSubtotal)) couponMessage = `Minimum spend is ${money(coupon.minSubtotal)} EGP.`;
    else {
      let eligible = saleSubtotal;
      if (coupon.scope === "PRODUCT") {
        const productIds = new Set(coupon.products.map((entry: any) => entry.productId));
        eligible = pricedItems.filter((item) => productIds.has(item.product.id)).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      }
      if (coupon.scope === "COLLECTION") {
        const names = new Set(coupon.collections.map((entry: any) => entry.collection.name));
        eligible = pricedItems.filter((item) => names.has(item.product.collection)).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      }
      if (eligible <= 0) couponMessage = "Coupon does not apply to these items.";
      else {
        couponDiscount = discountAmount(money(coupon.value), coupon.type, eligible);
        acceptedCode = coupon.code || undefined;
        couponMessage = "Coupon applied.";
      }
    }
  }
  const merchandiseAfterDiscount = Math.max(0, saleSubtotal - couponDiscount);
  const shippingTotal = merchandiseAfterDiscount >= money(context.settings.freeShippingThreshold) ? 0 : money(context.settings.flatShippingRate);
  return {
    quote: {
      subtotal: baseSubtotal,
      automaticDiscount: automaticDiscountTotal,
      couponDiscount,
      discountTotal: automaticDiscountTotal + couponDiscount,
      shippingTotal,
      grandTotal: merchandiseAfterDiscount + shippingTotal,
      couponCode: acceptedCode,
      couponMessage
    } satisfies CheckoutQuote,
    pricedItems,
    settings: context.settings
  };
}

export async function quoteCheckout(cart: CartInput[], couponCode?: string, governorate?: string): Promise<CheckoutQuote> {
  const { quote } = await calculateQuote(prisma, cart, couponCode, governorate);
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
  if (!input.customer.phone?.trim()) throw new Error("Phone is required.");
  if (!input.customer.firstName?.trim()) throw new Error("First name is required.");
  if (!input.shipping.governorate?.trim() || !input.shipping.city?.trim() || !input.shipping.street?.trim()) throw new Error("Complete delivery address is required.");

  const row = await prisma.$transaction(async (tx) => {
    const { quote, pricedItems, settings } = await calculateQuote(tx, input.cart, input.couponCode, input.shipping.governorate);
    if (input.paymentMethod === "CARD" && !settings.cardEnabled) throw new Error("Online card payment is not enabled yet.");
    if (input.paymentMethod === "COD" && !settings.codEnabled) throw new Error("Cash on delivery is not available.");

    let customer = await tx.customer.findUnique({ where: { phone: input.customer.phone.trim() } });
    if (!customer) {
      customer = await tx.customer.create({ data: {
        phone: input.customer.phone.trim(),
        email: input.customer.email?.trim() || null,
        firstName: input.customer.firstName.trim(),
        lastName: input.customer.lastName.trim()
      } });
    } else {
      customer = await tx.customer.update({ where: { id: customer.id }, data: {
        email: input.customer.email?.trim() || customer.email,
        firstName: input.customer.firstName.trim(),
        lastName: input.customer.lastName.trim()
      } });
    }

    const shipping = await tx.address.create({ data: {
      customerId: customer.id,
      firstName: input.customer.firstName.trim(),
      lastName: input.customer.lastName.trim(),
      phone: input.customer.phone.trim(),
      governorate: input.shipping.governorate.trim(),
      city: input.shipping.city.trim(),
      street: input.shipping.street.trim(),
      notes: input.shipping.notes?.trim() || null
    } });

    await tx.counter.upsert({ where: { key: "order" }, update: {}, create: { key: "order", value: 1048 } });
    const counter = await tx.counter.update({ where: { key: "order" }, data: { value: { increment: 1 } } });
    const orderNumber = `A2-${counter.value}`;

    for (const item of pricedItems) {
      const changed = await tx.productVariant.updateMany({
        where: { id: item.variant.id, stockOnHand: { gte: item.quantity }, active: true },
        data: { stockOnHand: { decrement: item.quantity } }
      });
      if (changed.count !== 1) throw new Error(`${item.product.name} changed stock while you were checking out. Please review your bag.`);
    }

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        shippingId: shipping.id,
        customerFirstName: input.customer.firstName.trim(),
        customerLastName: input.customer.lastName.trim(),
        customerPhone: input.customer.phone.trim(),
        customerEmail: input.customer.email?.trim() || null,
        status: "NEW",
        paymentStatus: input.paymentMethod === "COD" ? "PENDING" : "AUTHORIZED",
        paymentMethod: input.paymentMethod,
        subtotal: new Prisma.Decimal(quote.subtotal),
        discountTotal: new Prisma.Decimal(quote.discountTotal),
        shippingTotal: new Prisma.Decimal(quote.shippingTotal),
        grandTotal: new Prisma.Decimal(quote.grandTotal),
        couponCode: quote.couponCode || null,
        notes: input.notes?.trim() || null,
        items: { create: pricedItems.map((item) => ({
          productId: item.product.id,
          variantId: item.variant.id,
          productName: item.product.name,
          image: item.product.images[0] || "/media/demo/full-outfit.webp",
          sku: item.variant.sku,
          color: item.variant.colorName,
          size: item.variant.size,
          baseUnitPrice: new Prisma.Decimal(item.baseUnitPrice),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          quantity: item.quantity,
          lineTotal: new Prisma.Decimal(item.unitPrice * item.quantity)
        })) },
        statusEvents: { create: { status: "NEW", note: "Order placed" } }
      }
    });

    for (const item of pricedItems) {
      await tx.inventoryMovement.create({ data: { variantId: item.variant.id, delta: -item.quantity, reason: "Customer order", reference: orderNumber } });
    }
    if (quote.couponCode) await tx.discount.updateMany({ where: { code: quote.couponCode }, data: { usageCount: { increment: 1 } } });
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return mapOrder(row);
}

export async function requestReturn(orderNumber: string, phone: string, reason: string) {
  const row = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { orderNumber: orderNumber.toUpperCase(), customerPhone: phone }, include: orderInclude });
    if (!order) throw new Error("Order not found.");
    if (order.status !== "DELIVERED") throw new Error("Return requests are available after delivery.");
    return tx.order.update({
      where: { id: order.id },
      data: { status: "RETURN_REQUESTED", statusEvents: { create: { status: "RETURN_REQUESTED", note: reason || "Customer requested a return" } } },
      include: orderInclude
    });
  });
  return mapOrder(row);
}

export async function getDashboardMetrics() {
  const [orders, customerCount, variants, products] = await Promise.all([
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } }),
    prisma.customer.count(),
    prisma.productVariant.findMany(),
    prisma.product.findMany({ include: { category: true } })
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((order) => order.createdAt.toISOString().startsWith(today));
  const paidLike = orders.filter((order) => !["CANCELLED", "REFUNDED"].includes(order.status));
  const revenue = paidLike.reduce((sum, order) => sum + money(order.grandTotal), 0);
  const todayRevenue = todayOrders.filter((order) => !["CANCELLED", "REFUNDED"].includes(order.status)).reduce((sum, order) => sum + money(order.grandTotal), 0);
  const qtyByProduct = new Map<string, { qty: number; revenue: number }>();
  for (const order of orders) for (const item of order.items) if (item.productId) {
    const current = qtyByProduct.get(item.productId) || { qty: 0, revenue: 0 };
    current.qty += item.quantity;
    current.revenue += money(item.lineTotal);
    qtyByProduct.set(item.productId, current);
  }
  const topProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category?.name || "Uncategorized",
    qty: qtyByProduct.get(product.id)?.qty || 0,
    revenue: qtyByProduct.get(product.id)?.revenue || 0
  })).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const recentRows = await prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: "desc" }, take: 6 });
  return {
    todayRevenue,
    todayOrders: todayOrders.length,
    newOrders: orders.filter((order) => order.status === "NEW").length,
    unitsInStock: variants.reduce((sum, variant) => sum + variant.stockOnHand, 0),
    lowStock: variants.filter((variant) => variant.stockOnHand <= variant.lowStockAt).length,
    revenue,
    orderCount: orders.length,
    customerCount,
    recentOrders: recentRows.map(mapOrder),
    topProducts
  };
}
