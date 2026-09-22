"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDownRight } from "lucide-react";
import { useRef } from "react";
import { useStore } from "./StoreProvider";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 90]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.06]);
  const { t } = useStore();

  return (
    <section ref={ref} className="hero">
      <motion.div className="heroImage" style={{ y, scale }}>
        <Image src="/media/campaign-hero.webp" alt="A² new collection campaign" fill priority sizes="100vw" />
      </motion.div>
      <div className="heroShade" />
      <div className="heroContent">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="eyebrow">
          {t("heroEyebrow")}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
          {t("heroTitle1")}<br /><em>{t("heroTitleEm")}</em><br />{t("heroTitle2")}
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="heroActions">
          <Link className="primaryButton" href="/shop">
            {t("heroAction")} <ArrowDownRight size={18} />
          </Link>
          <span>{t("heroSlogan")}</span>
        </motion.div>
      </div>
      <div className="heroSidecopy">{t("heroSidecopy")}</div>
    </section>
  );
}
