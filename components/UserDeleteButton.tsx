'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface UserDeleteButtonProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export default function UserDeleteButton({ userId, userName, userEmail }: UserDeleteButtonProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = confirm(`确定要删除用户 "${userName}" (${userEmail})？\n此操作不可撤销！`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || '删除成功');
        window.location.reload();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg text-base font-medium transition-colors"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      {deleting ? '删除中...' : '删除'}
    </button>
  );
}
