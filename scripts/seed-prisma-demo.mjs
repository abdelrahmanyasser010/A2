import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const seedPath = path.join(process.cwd(), "data", "demo-seed.json");
const seed = JSON.parse(await readFile(seedPath, "utf8"));
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
const date = (value) => value ? new Date(value) : undefined;

async function clear(tx) {
  await tx.inventoryMovement.deleteMany();
  await tx.orderStatusEvent.deleteMany();
  await tx.orderItem.deleteMany();
  await tx.order.deleteMany();
  await tx.address.deleteMany();
  await tx.discountProduct.deleteMany();
  await tx.discountCollection.deleteMany();
  await tx.discount.deleteMany();
  await tx.productImage.deleteMany();
  await tx.productCollection.deleteMany();
  await tx.productVariant.deleteMany();
  await tx.product.deleteMany();
  await tx.collection.deleteMany();
  await tx.category.deleteMany();
  await tx.customer.deleteMany();
  await tx.counter.deleteMany();
}

try {
  await prisma.$transaction(async (tx) => {
    await clear(tx);

    const categories = [...new Set(seed.products.map((product) => product.category || "Uncategorized"))];
    const collections = [...new Set(seed.products.map((product) => product.collection || "General"))];
    const categoryIds = new Map();
    const collectionIds = new Map();

    for (const name of categories) {
      const row = await tx.category.create({ data: { name, slug: slugify(name) } });
      categoryIds.set(name, row.id);
    }
    for (const name of collections) {
      const row = await tx.collection.create({ data: { name, slug: slugify(name), active: true } });
      collectionIds.set(name, row.id);
    }

    for (const product of seed.products) {
      await tx.product.create({
        data: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          subtitle: product.subtitle || "",
          description: product.description || "",
          basePrice: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          status: product.status || "DRAFT",
          material: product.material || "",
          fit: product.fit || "",
          care: product.care || "",
          featured: Boolean(product.featured),
          isNew: Boolean(product.isNew),
          categoryId: categoryIds.get(product.category),
          createdAt: date(product.createdAt),
          updatedAt: date(product.updatedAt),
          collections: { create: [{ collectionId: collectionIds.get(product.collection), sortOrder: 0 }] },
          variants: { create: product.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            colorName: variant.color,
            colorHex: product.colors.find((color) => color.name === variant.color)?.value || "#111111",
            size: variant.size,
            stockOnHand: variant.stock,
            lowStockAt: variant.lowStockAt ?? seed.settings.lowStockThreshold,
            active: variant.active !== false
          })) },
          images: { create: [
            ...product.images.map((url, index) => ({ url, alt: product.name, sortOrder: index, isSpin: false })),
            ...product.spinFrames.map((url, index) => ({ url, alt: `${product.name} 360 frame ${index + 1}`, sortOrder: index, isSpin: true, spinFrame: index }))
          ] }
        }
      });
    }

    for (const discount of seed.discounts) {
      const productTargets = discount.scope === "PRODUCT" ? discount.targetIds.filter((id) => seed.products.some((product) => product.id === id)) : [];
      const collectionTargets = discount.scope === "COLLECTION" ? discount.targetIds.map((name) => collectionIds.get(name)).filter(Boolean) : [];
      await tx.discount.create({ data: {
        id: discount.id,
        name: discount.name,
        code: discount.code || null,
        type: discount.type,
        scope: discount.scope,
        value: discount.value,
        minSubtotal: discount.minSubtotal ?? null,
        startsAt: date(discount.startsAt),
        endsAt: date(discount.endsAt),
        usageLimit: discount.usageLimit ?? null,
        usageCount: discount.usageCount || 0,
        active: discount.active !== false,
        createdAt: date(discount.createdAt),
        updatedAt: date(discount.updatedAt),
        products: { create: productTargets.map((productId) => ({ productId })) },
        collections: { create: collectionTargets.map((collectionId) => ({ collectionId })) }
      }});
    }

    for (const customer of seed.customers) {
      await tx.customer.create({ data: {
        id: customer.id,
        phone: customer.phone,
        email: customer.email || null,
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        createdAt: date(customer.createdAt),
        updatedAt: date(customer.updatedAt)
      }});
    }

    for (const order of [...seed.orders].reverse()) {
      const customerId = seed.customers.some((customer) => customer.id === order.customerId) ? order.customerId : null;
      const address = await tx.address.create({ data: {
        customerId,
        firstName: order.customer.firstName || "",
        lastName: order.customer.lastName || "",
        phone: order.customer.phone,
        governorate: order.shipping.governorate,
        city: order.shipping.city,
        street: order.shipping.street,
        notes: order.shipping.notes || null,
        createdAt: date(order.createdAt)
      }});
      await tx.order.create({ data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId,
        shippingId: address.id,
        customerFirstName: order.customer.firstName || "",
        customerLastName: order.customer.lastName || "",
        customerPhone: order.customer.phone,
        customerEmail: order.customer.email || null,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        shippingTotal: order.shippingTotal,
        grandTotal: order.grandTotal,
        couponCode: order.couponCode || null,
        notes: order.notes || null,
        inventoryRestocked: Boolean(order.inventoryRestocked),
        createdAt: date(order.createdAt),
        updatedAt: date(order.updatedAt),
        items: { create: order.items.map((item) => ({
          id: item.id,
          productId: seed.products.some((product) => product.id === item.productId) ? item.productId : null,
          variantId: seed.products.flatMap((product) => product.variants).some((variant) => variant.id === item.variantId) ? item.variantId : null,
          productName: item.productName,
          image: item.image,
          sku: item.sku,
          color: item.color,
          size: item.size,
          baseUnitPrice: item.baseUnitPrice,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal
        })) },
        statusEvents: { create: order.statusEvents.map((event) => ({ status: event.status, note: event.note || null, createdAt: date(event.createdAt) })) }
      }});
    }

    for (const movement of [...seed.inventoryMovements].reverse()) {
      const exists = seed.products.flatMap((product) => product.variants).some((variant) => variant.id === movement.variantId);
      if (!exists) continue;
      await tx.inventoryMovement.create({ data: {
        id: movement.id,
        variantId: movement.variantId,
        delta: movement.delta,
        reason: movement.reason,
        reference: movement.reference || null,
        createdAt: date(movement.createdAt)
      }});
    }

    const maxOrder = seed.orders.reduce((max, order) => Math.max(max, Number(String(order.orderNumber).split("-").at(-1)) || 0), 1048);
    await tx.counter.create({ data: { key: "order", value: maxOrder } });
    await tx.storeSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        currency: "EGP",
        flatShippingRate: seed.settings.flatShippingRate,
        freeShippingThreshold: seed.settings.freeShippingThreshold,
        codEnabled: seed.settings.codEnabled,
        cardEnabled: seed.settings.cardEnabled,
        lowStockThreshold: seed.settings.lowStockThreshold,
        supportPhone: seed.settings.supportPhone,
        supportEmail: seed.settings.supportEmail,
        demoData: true,
        seedName: seed.meta?.seedName || "A2 demo seed",
        seededAt: new Date(),
        note: seed.meta?.note || "Temporary development records"
      },
      update: {
        currency: "EGP",
        flatShippingRate: seed.settings.flatShippingRate,
        freeShippingThreshold: seed.settings.freeShippingThreshold,
        codEnabled: seed.settings.codEnabled,
        cardEnabled: seed.settings.cardEnabled,
        lowStockThreshold: seed.settings.lowStockThreshold,
        supportPhone: seed.settings.supportPhone,
        supportEmail: seed.settings.supportEmail,
        demoData: true,
        seedName: seed.meta?.seedName || "A2 demo seed",
        seededAt: new Date(),
        note: seed.meta?.note || "Temporary development records"
      }
    });
  }, { timeout: 60000 });
  console.log(`Seeded PostgreSQL with ${seed.products.length} products, ${seed.orders.length} orders and ${seed.customers.length} customers.`);
} finally {
  await prisma.$disconnect();
}
