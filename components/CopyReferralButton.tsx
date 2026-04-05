'use client';

import { Copy } from 'lucide-react';

interface CopyReferralButtonProps {
  code: string;
}

export default function CopyReferralButton({ code }: CopyReferralButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      title="复制推荐码"
    >
      <Copy className="h-6 w-6" />
    </button>
  );
}
