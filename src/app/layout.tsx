import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { siteConfig } from "@/config/site.config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${siteConfig.product.name} | ${siteConfig.brand.name}`,
  description: siteConfig.brand.tagline,
};

export const viewport: Viewport = { themeColor: "#07060d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
