"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { Reveal } from "@/components/Reveal";
import { useStore } from "@/components/StoreProvider";
import type { Product } from "@/lib/types";

export function HomeClient({ products }: { products: Product[] }) {
  const { t, language } = useStore();
  const featured = products.filter((item) => item.featured);

  return (
    <>
      <Hero />
      <section className="section sectionIntro">
        <Reveal>
          <p className="eyebrow">{t("homeIntroEyebrow")}</p>
          <div className="splitHeading">
            <h2 style={{ whiteSpace: "pre-line" }}>{t("homeIntroTitle")}</h2>
            <p>{t("homeIntroDesc")}</p>
          </div>
        </Reveal>
      </section>

      <section className="section productsSection">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">{t("featuredEyebrow")}</p>
            <h2>{t("featuredTitle")}</h2>
          </div>
          <Link href="/shop" className="textLink">
            {t("viewAll")} <ArrowUpRight size={16} />
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      <section className="editorialBand" id="story">
        <div className="editorialImage">
          <Image src="/media/brand-identity.webp" alt="A² brand identity" fill sizes="100vw" />
        </div>
        <div className="editorialCopy">
          <p className="eyebrow">{t("storyEyebrow")}</p>
          <h2 style={{ whiteSpace: "pre-line" }}>{t("storyTitle")}</h2>
          <p>{t("storyDesc")}</p>
          <Link className="ghostButton" href="/shop">
            {t("exploreIdentity")} <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <section className="section categorySection">
        <p className="eyebrow">{t("exploreCategories")}</p>
        <div className="categoryLinks">
          <Link href="/shop?category=t-shirts">
            <span>01</span>
            <strong>{t("catTshirts")}</strong>
            <ArrowUpRight />
          </Link>
          <Link href="/shop?category=hoodies">
            <span>02</span>
            <strong>{t("catHoodies")}</strong>
            <ArrowUpRight />
          </Link>
          <Link href="/shop?category=pants">
            <span>03</span>
            <strong>{t("catPants")}</strong>
            <ArrowUpRight />
          </Link>
        </div>
      </section>

      <section className="marquee" aria-label="Brand slogan">
        <div>
          {t("marqueeSlogan")} {t("marqueeSlogan")}
        </div>
      </section>
    </>
  );
}
