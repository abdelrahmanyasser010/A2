import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning product descriptions...");

  const smuvnDescAr = `خليك مميز بإطلالة تجمع بين الكاجوال والشياكة مع سويت شيرت SMUVN Worldwide بتصميم عصري Oversized وياقة بولو أوف وايت بخطوط سوداء أنيقة.

القطعة بتتميز بتطريز أبيض بارز على الصدر، وأكمام واسعة بتديك الراحة والستايل في نفس الوقت. مثالي للخروجات واللبس اليومي في الشتاء.

تفاصيل القطعة:
• اللون: أسود مع ياقة بولو كلاسيكية بلون أوف وايت
• الخامة: قماش ميلتون سويت شيرت قطني ناعم ومبطن
• القصة: واسعة مريحة (Oversized Fit) مع أكتاف ساقطة
• التفاصيل: تطريز بارز عالي الكثافة (3D Chain Embroidery) لشعار SMUVN Worldwide
• المقاسات المتاحة: M و L`;

  const smuvnDescEn = `Elevate your streetwear rotation with the SMUVN Worldwide Classic Polo Sweatshirt in Black. Cut in a modern oversized silhouette with dropped shoulders, it features a contrasting off-white polo collar with sporty black tipping and intricate 3D chain embroidery on the chest. Crafted from heavyweight fleece for all-day comfort and warmth.

Product Highlights:
• Color: Solid Black with Contrast Off-White Polo Collar
• Fabric: Premium Heavyweight Cotton-Blend Fleece
• Cut & Fit: Modern Oversized Fit with Dropped Shoulders
• Details: High-density 3D chain stitched SMUVN Worldwide chest embroidery
• Available Sizes: M and L`;

  const angelBoyDescAr = `ستايل شتوي مميز يجمع بين الراحة والشياكة 🔥

سويت شيرت **Angel Boy** بتصميم Oversized عصري، وتطريز أنيق على الصدر والظهر، مع ياقة دائرية وأكمام واسعة بجيب كانغرو أمامي عملي بيديك لوك كاجوال ستريت وير فريد.

تصميم سهل التنسيق مع الجينز أو الكارجو، ومناسب للخروجات واللبس اليومي في الشتاء.

تفاصيل القطعة:
• الموديل: Angel Boy (موديل تركي مستورد)
• الخامة: قماش ميلتون سويت شيرت تركي مستورد ناعم ومبطن
• القصة: واسعة مريحة (Oversized Fit) مع أكتاف ساقطة وأكمام مريحة
• الجيب: جيب كانغرو أمامي عملي وأنيق
• التفاصيل: تطريز مونوغرام AB على الصدر، وتطريز بارز لشعار Angel Boy على الظهر
• الألوان المتاحة: أسود – نبيتي (Burgundy) – رمادي (Grey)
• المقاسات المتاحة: M – L – XL – XXL`;

  const angelBoyDescEn = `A standout winter streetwear essential blending premium comfort with effortless style.

The Angel Boy Oversized Sweatshirt features an authentic oversized silhouette with dropped shoulders, ribbed crew neckline, a front kangaroo pouch pocket, and distinct 3D chain-stitched embroidery on both the chest and back yoke.

Product Highlights:
• Model: Angel Boy (Imported Turkish Edition)
• Fabric: Heavyweight Turkish Cotton-Blend Fleece
• Silhouette: Modern Oversized Fit with Dropped Shoulders
• Functional Design: Front Kangaroo Pouch Pocket & Ribbed Cuffs
• Embroidery: Dual front chest monogram & statement back "Angel Boy" script
• Available Colors: Black, Burgundy, Grey Heather
• Available Sizes: M, L, XL, XXL`;

  // 1. Update in Prisma
  const updatedSmuvn = await prisma.product.updateMany({
    where: { slug: "smuvn-classic-polo-sweatshirt-black" },
    data: {
      description: smuvnDescAr,
      descriptionEn: smuvnDescEn
    }
  });
  console.log("Updated SMUVN in Prisma:", updatedSmuvn.count);

  const updatedAngel = await prisma.product.updateMany({
    where: { slug: "angel-boy-oversized-sweatshirt" },
    data: {
      description: angelBoyDescAr,
      descriptionEn: angelBoyDescEn
    }
  });
  console.log("Updated Angel Boy in Prisma:", updatedAngel.count);

  // 2. Update store.json
  const storePath = path.join(process.cwd(), "data", "store.json");
  const storeRaw = await fs.readFile(storePath, "utf-8");
  const store = JSON.parse(storeRaw);

  for (const p of store.products) {
    if (p.slug === "smuvn-classic-polo-sweatshirt-black") {
      p.description = smuvnDescAr;
      p.descriptionEn = smuvnDescEn;
    }
    if (p.slug === "angel-boy-oversized-sweatshirt") {
      p.description = angelBoyDescAr;
      p.descriptionEn = angelBoyDescEn;
    }
  }

  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf-8");
  console.log("Updated store.json successfully!");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
