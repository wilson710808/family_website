import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import I18nProviderClient from "./I18nProviderClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "🏠 家族中心",
  description: "属于我们家族的专属空间",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <I18nProviderClient>
          {children}
        </I18nProviderClient>
      </body>
    </html>
  );
}
