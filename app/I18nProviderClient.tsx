'use client';

import { I18nProvider } from "@/lib/i18n";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function I18nProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {/* 语言切换固定在右上角 */}
      <div className="fixed top-2 right-2 z-50">
        <LanguageSwitch />
      </div>
      {children}
    </I18nProvider>
  );
}
