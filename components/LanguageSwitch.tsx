'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useI18n, Language } from '@/lib/i18n';
import ElderFriendlyButton from './ElderFriendlyButton';

export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    setShowDropdown(false);
    // 刷新页面以更新所有内容
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="bg-white shadow-lg rounded-full p-3 hover:bg-gray-100 transition-colors border border-gray-200"
        title={t('language')}
      >
        <Globe className="h-6 w-6 text-gray-700" />
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="p-2">
            <button
              onClick={() => changeLanguage('zh-CN')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xl font-medium transition-colors ${
                lang === 'zh-CN'
                  ? 'bg-family-100 text-family-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              🇨🇳 {t('simplified_chinese')}
            </button>
            <button
              onClick={() => changeLanguage('zh-TW')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xl font-medium transition-colors ${
                lang === 'zh-TW'
                  ? 'bg-family-100 text-family-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              🇹🇼 {t('traditional_chinese')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
