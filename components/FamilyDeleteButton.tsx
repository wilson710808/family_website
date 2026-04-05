'use client';

import { Trash2 } from 'lucide-react';

interface FamilyDeleteButtonProps {
  familyId: string;
}

export default function FamilyDeleteButton({ familyId }: FamilyDeleteButtonProps) {
  function handleConfirm(e: React.FormEvent) {
    if (!confirm('⚠️ 确定要删除这个家族吗？\n\n此操作不可撤销，所有相关数据（公告、留言、聊天记录等）都将被永久删除。')) {
      e.preventDefault();
    }
  }

  return (
    <form action={`/api/families/${familyId}/delete`} method="POST" onSubmit={handleConfirm}>
      <button 
        type="submit" 
        className="absolute top-4 right-4 bg-red-500/70 hover:bg-red-600/80 text-white p-2 rounded-lg backdrop-blur-sm transition-colors" 
        title="删除家族"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </form>
  );
}
