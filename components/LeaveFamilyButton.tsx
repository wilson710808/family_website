'use client';

import { useState } from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';

interface LeaveFamilyButtonProps {
  familyId: number;
  familyName: string;
  isCreator: boolean;
  role: string;
  onLeft?: () => void;
}

export default function LeaveFamilyButton({ familyId, familyName, isCreator, role, onLeft }: LeaveFamilyButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (isCreator) {
    // 创建者不能退出，只能删除家族
    return null;
  }

  async function handleLeave() {
    if (!confirm(`确定要退出「${familyName}」吗？退出后需要重新申请加入。`)) {
      return;
    }

    setLeaving(true);
    try {
      const res = await fetch(`/api/families/${familyId}/leave`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message || '已成功退出家族');
        if (onLeft) {
          onLeft();
        } else {
          // 跳转到家族列表
          window.location.href = '/families';
        }
      } else {
        alert(data.error || '退出失败');
      }
    } catch (error) {
      console.error('退出家族失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setLeaving(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        退出家族
      </button>

      {/* 确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <h3 className="text-xl font-bold text-gray-900">确认退出家族？</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              你即将退出「<strong>{familyName}</strong>」，退出后：
            </p>
            
            <ul className="text-gray-600 mb-6 space-y-2">
              <li>• 你将无法查看家族内容</li>
              <li>• 你的贡献积分将保留在家族记录中</li>
              <li>• 如需重新加入，需要再次申请或被邀请</li>
              {role === 'admin' && (
                <li className="text-orange-600">• 你是管理员，退出后管理员权限将自动转让</li>
              )}
            </ul>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={leaving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {leaving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    退出中...
                  </>
                ) : (
                  '确认退出'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
