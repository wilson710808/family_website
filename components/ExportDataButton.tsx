'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ExportDataButtonProps {
  familyId: number;
  familyName: string;
}

export default function ExportDataButton({ familyId, familyName }: ExportDataButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch(`/api/families/${familyId}/export`);
      
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || '导出失败');
        return;
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${familyName}_导出_${new Date().toISOString().split('T')[0]}.json`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }

      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          导出中...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          导出数据
        </>
      )}
    </button>
  );
}
