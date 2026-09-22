import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
if (process.env.MEDIA_PUBLIC_URL) {
  try {
    const url = new URL(process.env.MEDIA_PUBLIC_URL);
    remotePatterns.push({ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname, port: url.port, pathname: `${url.pathname.replace(/\/$/, "")}/**` });
  } catch {
    // Invalid MEDIA_PUBLIC_URL is surfaced by the media API; keep Next config bootable.
  }
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns
  }
};

export default nextConfig;
