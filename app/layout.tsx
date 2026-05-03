import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FetchBasePathPatch from "@/components/FetchBasePathPatch";
import I18nProviderClient from "./I18nProviderClient";
import { cookies } from "next/headers";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 从 cookie 读取语言，保证服务端和客户端初始值一致
  const cookieStore = await cookies();
  const savedLang = cookieStore.get('language')?.value;
  const initialLang = (savedLang === 'zh-CN' || savedLang === 'zh-TW') ? savedLang : 'zh-TW';

  return (
    <html lang={initialLang === 'zh-CN' ? 'zh-CN' : 'zh-TW'}>
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <FetchBasePathPatch /><I18nProviderClient initialLang={initialLang}>
          {children}
        </I18nProviderClient>
      </body>
    </html>
  );
}
