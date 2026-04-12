'use client';

import { useState } from 'react';
import { UserPlus, Check, X, User } from 'lucide-react';

interface TreeMember {
  id: number;
  family_id: number;
  name: string;
  gender: 'male' | 'female';
  birth_year: number | null;
  death_year: number | null;
  relationship: string | null;
  bio: string | null;
  avatar: string | null;
  user_id: number | null;
  is_registered: number;
}

interface User {
  id: number;
  name: string;
  avatar: string;
}

interface TreeMemberBindUserProps {
  member: TreeMember;
  familyId: number;
  currentUser: User | null;
  onBindingChange: () => void;
}

export default function TreeMemberBindUser({
  member,
  familyId,
  currentUser,
  onBindingChange,
}: TreeMemberBindUserProps) {
  const [showBindModal, setShowBindModal] = useState(false);
  const [binding, setBinding] = useState(false);

  const isCurrentUser = currentUser && member.user_id === currentUser.id;

  const handleBind = async () => {
    if (!currentUser) return;

    setBinding(true);
    try {
      const res = await fetch('/api/plugins/tree/bind-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          userId: currentUser.id,
          familyId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onBindingChange();
        setShowBindModal(false);
      } else {
        alert(data.error || '绑定失败');
      }
    } catch (error) {
      console.error('绑定失败:', error);
      alert('绑定失败，请重试');
    } finally {
      setBinding(false);
    }
  };

  const handleUnbind = async () => {
    if (!confirm('確定要解除綁定嗎？')) return;

    setBinding(true);
    try {
      const res = await fetch(`/api/plugins/tree/bind-user?memberId=${member.id}&familyId=${familyId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        onBindingChange();
      } else {
        alert(data.error || '解绑失败');
      }
    } catch (error) {
      console.error('解绑失败:', error);
      alert('解绑失败，请重试');
    } finally {
      setBinding(false);
    }
  };

  return (
    <>
      {/* 绑定状态显示 */}
      <div className="flex items-center gap-2">
        {member.is_registered === 1 && member.user_id ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
            <Check className="w-3 h-3" />
            <span>已綁定用戶</span>
          </div>
        ) : (
          <button
            onClick={() => setShowBindModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full text-xs transition-colors"
          >
            <UserPlus className="w-3 h-3" />
            <span>綁定賬號</span>
          </button>
        )}

        {/* 如果是当前用户绑定的，显示解绑按钮 */}
        {isCurrentUser && (
          <button
            onClick={handleUnbind}
            disabled={binding}
            className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-full text-xs transition-colors"
          >
            <X className="w-3 h-3" />
            <span>解綁</span>
          </button>
        )}
      </div>

      {/* 绑定弹窗 */}
      {showBindModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">綁定用戶賬號</h3>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                    alt={member.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">
                      {member.relationship || '未設置關係'}
                    </p>
                  </div>
                </div>
              </div>

              {currentUser ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-2">將綁定到您的賬號：</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <p className="font-medium text-blue-900">{currentUser.name}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-yellow-700">請先登錄後再進行綁定</p>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>綁定後，您在家族聊天室中的頭像將顯示在家族樹中。</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBindModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBind}
                disabled={binding || !currentUser}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {binding ? '綁定中...' : '確認綁定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
