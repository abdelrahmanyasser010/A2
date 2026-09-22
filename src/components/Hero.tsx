"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDownRight } from "lucide-react";
import { useRef } from "react";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 90]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.06]);

  return (
    <section ref={ref} className="hero">
      <motion.div className="heroImage" style={{ y, scale }}>
        <Image src="/media/campaign-hero.webp" alt="A² new collection campaign" fill priority sizes="100vw" />
      </motion.div>
      <div className="heroShade" />
      <div className="heroContent">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }} className="eyebrow">
          A² / NEW DROP 01
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3, duration: .8 }}>
          BUILT BY<br /><em>DIFFERENT</em><br />MINDS.
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .65 }} className="heroActions">
          <Link className="primaryButton" href="/shop">Shop the drop <ArrowDownRight size={18} /></Link>
          <span>Two minds. One vision.</span>
        </motion.div>
      </div>
      <div className="heroSidecopy">CLEAN / BOLD / REAL</div>
    </section>
  );
}
