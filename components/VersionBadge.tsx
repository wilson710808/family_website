/**
 * 版本信息顯示組件
 * 在頁面底部顯示當前版本號
 */
'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  buildTime: string;
  commit: string;
}

export default function VersionBadge() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVersionInfo(data.data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch version:', err);
      });
  }, []);

  if (!versionInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-16 right-4 text-xs text-gray-400 opacity-60 hover:opacity-100 transition-opacity z-50">
      <span className="bg-gray-800/50 px-2 py-1 rounded">
        v{versionInfo.version} ({versionInfo.commit})
      </span>
    </div>
  );
}
