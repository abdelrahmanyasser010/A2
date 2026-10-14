import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating Angel Boy spinFrames...");

  const angelBoySpinFrames = [
    "/uploads/products/angel-boy-sweatshirt/angel-boy-black-1.jpg",
    "/uploads/products/angel-boy-sweatshirt/angel-boy-black-2.jpg",
    "/uploads/products/angel-boy-sweatshirt/angel-boy-black-3.jpg",
    "/uploads/products/angel-boy-sweatshirt/angel-boy-black-4.jpg"
  ];

  // In Prisma, spinFrames are stored in ProductImage with isSpinFrame = true
  const product = await prisma.product.findUnique({
    where: { slug: "angel-boy-oversized-sweatshirt" },
    include: { images: true }
  });

  if (product) {
    // Delete existing spin frame images
    await prisma.productImage.deleteMany({
      where: {
        productId: product.id,
        isSpin: true
      }
    });

    // Create new spin frames
    for (let i = 0; i < angelBoySpinFrames.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: angelBoySpinFrames[i],
          sortOrder: i,
          isSpin: true,
          spinFrame: i
        }
      });
    }
    console.log("Updated Angel Boy spin frames in Prisma!");
  }

  // Update in store.json
  const storePath = path.join(process.cwd(), "data", "store.json");
  const raw = await fs.readFile(storePath, "utf-8");
  const store = JSON.parse(raw);

  for (const p of store.products) {
    if (p.slug === "angel-boy-oversized-sweatshirt") {
      p.spinFrames = angelBoySpinFrames;
    }
  }

  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf-8");
  console.log("Updated Angel Boy spin frames in store.json!");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
