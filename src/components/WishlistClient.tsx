"use client";
import Link from "next/link";
import { ProductGrid } from "./ProductGrid";
import { useStore } from "./StoreProvider";
import type { Product } from "@/lib/types";
export function WishlistClient({products}:{products:Product[]}){const{wishlist}=useStore();const wished=products.filter(item=>wishlist.includes(item.id));return <div className="pageShell shopPage"><header className="pageHero compactHero"><p className="eyebrow">SAVED FOR LATER</p><h1>Wishlist</h1><p>{wished.length} saved pieces.</p></header>{wished.length?<ProductGrid products={wished}/>:<div className="emptyState"><h2>Your wishlist is quiet.</h2><p>Save pieces you want to come back to.</p><Link className="primaryButton" href="/shop">Explore the drop</Link></div>}</div>}
