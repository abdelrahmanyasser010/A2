import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try {
  await prisma.$transaction(async (tx) => {
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
    await tx.storeSettings.upsert({ where: { id: "default" }, create: { id: "default", demoData: false }, update: { demoData: false, seedName: null, seededAt: null, note: null } });
  });
  console.log("PostgreSQL commerce data cleared. Store settings were retained/reset and media files were left untouched.");
} finally {
  await prisma.$disconnect();
}
