'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg transition-colors ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
    >
      {copied ? '已复制!' : '复制'}
    </button>
  );
}
