'use client';

import { useState } from 'react';

interface CreateFamilyModalProps {
  onCreated?: () => void;
}

export default function CreateFamilyButtonAndModal({ onCreated }: CreateFamilyModalProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFamily, setNewFamily] = useState({
    name: '',
    description: '',
    avatar: '',
  });

  const openCreateModal = () => {
    setNewFamily({ name: '', description: '', avatar: '' });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/families/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newFamily,
          avatar: newFamily.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(newFamily.name)}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        closeCreateModal();
        window.location.reload();
        if (onCreated) onCreated();
      } else {
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Create family failed:', error);
      alert('创建失败，请重试');
    }
  };

  return (
    <>
      <button
        onClick={openCreateModal}
        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xl font-semibold transition-colors"
      >
        + 新增家族
      </button>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">新增家族</h3>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-xl font-medium text-gray-700 mb-2">家族名称</label>
                <input
                  type="text"
                  value={newFamily.name}
                  onChange={(e) => setNewFamily({...newFamily, name: e.target.value})}
                  className="w-full px-4 py-3 text-xl border border-gray-300 rounded-xl focus:ring-2 focus:ring-family-500 focus:border-transparent"
                  placeholder="请输入家族名称"
                  required
                />
              </div>
              <div>
                <label className="block text-xl font-medium text-gray-700 mb-2">家族描述</label>
                <textarea
                  value={newFamily.description}
                  onChange={(e) => setNewFamily({...newFamily, description: e.target.value})}
                  className="w-full px-4 py-3 text-xl border border-gray-300 rounded-xl focus:ring-2 focus:ring-family-500 focus:border-transparent h-24"
                  placeholder="介绍一下这个家族..."
                />
              </div>
              <div>
                <label className="block text-xl font-medium text-gray-700 mb-2">头像 URL</label>
                <input
                  type="text"
                  value={newFamily.avatar}
                  onChange={(e) => setNewFamily({...newFamily, avatar: e.target.value})}
                  className="w-full px-4 py-3 text-xl border border-gray-300 rounded-xl focus:ring-2 focus:ring-family-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xl font-semibold transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xl font-semibold transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
