"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartItem, Product } from "@/lib/types";
import { Language, translations, TranslationKey } from "@/lib/i18n";

const CART_KEY = "a2-cart-v1";
const WISHLIST_KEY = "a2-wishlist-v1";
const LANG_KEY = "a2-lang-v1";

type AddOptions = { color: string; size: string; quantity?: number };

type StoreContextValue = {
  cart: CartItem[];
  wishlist: string[];
  cartCount: number;
  cartTotal: number;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  addToCart: (product: Product, options: AddOptions) => boolean;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [language, setLanguageState] = useState<Language>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_KEY);
      const storedWishlist = localStorage.getItem(WISHLIST_KEY);
      const storedLang = localStorage.getItem(LANG_KEY) as Language | null;
      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
      
      let initialLang: Language = "en";
      if (storedLang === "en" || storedLang === "ar") {
        initialLang = storedLang;
      } else if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar")) {
        initialLang = "ar";
      }
      setLanguageState(initialLang);
      document.documentElement.lang = initialLang;
      document.documentElement.dir = initialLang === "ar" ? "rtl" : "ltr";
    } catch {
      // Corrupt local state should never block the shopping experience.
    }
    setHydrated(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    } catch {}
  };

  const toggleLanguage = () => {
    const nextLang = language === "ar" ? "en" : "ar";
    setLanguage(nextLang);
  };

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    let text: string = translations[language]?.[key] ?? translations.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
      }
    }
    return text;
  };

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  const addToCart = (product: Product, options: AddOptions) => {
    const variant = product.variants.find(
      (item) => item.color === options.color && item.size === options.size
    );
    if (!variant || variant.active === false || variant.stock < 1) return false;

    const key = `${product.id}:${variant.id}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) =>
          item.key === key
            ? { ...item, quantity: Math.min(item.quantity + (options.quantity ?? 1), variant.stock) }
            : item
        );
      }
      return [
        ...current,
        {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price: product.price,
          color: options.color,
          size: options.size,
          sku: variant.sku,
          quantity: options.quantity ?? 1,
          variantId: variant.id,
          maxStock: variant.stock
        }
      ];
    });
    return true;
  };

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      wishlist,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      cartTotal: cart.reduce((sum, item) => sum + item.quantity * item.price, 0),
      language,
      setLanguage,
      toggleLanguage,
      t,
      addToCart,
      removeFromCart: (key) => setCart((current) => current.filter((item) => item.key !== key)),
      updateQuantity: (key, quantity) =>
        setCart((current) =>
          current.map((item) =>
            item.key === key
              ? { ...item, quantity: Math.min(item.maxStock ?? 99, Math.max(1, quantity)) }
              : item
          )
        ),
      clearCart: () => setCart([]),
      toggleWishlist: (productId) =>
        setWishlist((current) =>
          current.includes(productId)
            ? current.filter((id) => id !== productId)
            : [...current, productId]
        ),
      isWishlisted: (productId) => wishlist.includes(productId)
    }),
    [cart, wishlist, language]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
