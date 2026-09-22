import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { SiteChrome } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "A² — Two Minds. One Vision.",
  description: "A² premium streetwear. Two minds. One vision."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><StoreProvider><SiteChrome>{children}</SiteChrome></StoreProvider></body></html>;
}
