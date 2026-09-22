import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { Reveal } from "@/components/Reveal";
import { getStorefrontProducts } from "@/server/store-db";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const products = await getStorefrontProducts();
  return <>
    <Hero />
    <section className="section sectionIntro"><Reveal><p className="eyebrow">DROP 01 / 2026</p><div className="splitHeading"><h2>Everyday forms.<br />Sharper attitude.</h2><p>Minimal pieces built around contrast: quiet fronts, expressive backs, heavyweight fabric and the A² brush mark.</p></div></Reveal></section>
    <section className="section productsSection"><div className="sectionHeading"><div><p className="eyebrow">SHOP / FEATURED</p><h2>Current drop</h2></div><Link href="/shop" className="textLink">View all <ArrowUpRight size={16}/></Link></div><ProductGrid products={products.filter(item=>item.featured)} /></section>
    <section className="editorialBand" id="story"><div className="editorialImage"><Image src="/media/brand-identity.webp" alt="A² brand identity" fill sizes="100vw" /></div><div className="editorialCopy"><p className="eyebrow">A STORY OF TWO MINDS</p><h2>Same roots.<br />Higher standards.</h2><p>A² is built as a modern clothing system rather than a collection of isolated pieces. The palette, typography, packaging and garments all share one visual language.</p><Link className="ghostButton" href="/shop">Explore the identity <ArrowUpRight size={17}/></Link></div></section>
    <section className="section categorySection"><p className="eyebrow">EXPLORE</p><div className="categoryLinks"><Link href="/shop?category=t-shirts"><span>01</span><strong>T-Shirts</strong><ArrowUpRight/></Link><Link href="/shop?category=hoodies"><span>02</span><strong>Hoodies</strong><ArrowUpRight/></Link><Link href="/shop?category=pants"><span>03</span><strong>Pants</strong><ArrowUpRight/></Link></div></section>
    <section className="marquee" aria-label="Brand slogan"><div>TWO MINDS. ONE VISION. — A² MEN&apos;S WEAR — TWO MINDS. ONE VISION. — A² MEN&apos;S WEAR —</div></section>
  </>;
}
