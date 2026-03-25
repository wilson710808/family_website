'use client';

import { Trash2 } from 'lucide-react';

interface UserDeleteButtonProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export default function UserDeleteButton({ userId, userName, userEmail }: UserDeleteButtonProps) {
  function handleConfirm(e: React.FormEvent) {
    if (!confirm(`确定要删除用户 "${userName}" (${userEmail})？\n此操作不可撤销！`)) {
      e.preventDefault();
    }
  }

  return (
    <form
      method="post"
      action={`/api/admin/users/${userId}/delete`}
      onSubmit={handleConfirm}
    >
      <button
        type="submit"
        className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-base font-medium transition-colors"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        删除
      </button>
    </form>
  );
}
