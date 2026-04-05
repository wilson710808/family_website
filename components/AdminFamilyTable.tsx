'use client';

interface FamilyWithMembers {
  id: number;
  name: string;
  description: string;
  avatar: string;
  creator_id: number;
  creator_name: string;
  created_at: string;
  member_count: number;
}

interface AdminFamilyTableProps {
  families: FamilyWithMembers[];
}

export default function AdminFamilyTable({ families }: AdminFamilyTableProps) {
  async function handleDelete(familyId: number, familyName: string) {
    if (!confirm(`确定要删除家族 "${familyName}"？\n此操作会删除家族所有数据，包括所有公告、留言、聊天记录，不可撤销！`)) {
      return;
    }
    try {
      const res = await fetch(`/api/families/${familyId}/delete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || '家族删除成功');
        window.location.reload();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败，请重试');
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">家族名称</th>
              <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">创建者</th>
              <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">成员数</th>
              <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">创建时间</th>
              <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">描述</th>
              <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {families.map(family => (
              <tr key={family.id} className="hover:bg-gray-50">
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    <img src={family.avatar} alt={family.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="text-xl font-semibold text-gray-900">{family.name}</p>
                      <p className="text-lg text-gray-500">ID: {family.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <p className="text-xl text-gray-900">{family.creator_name}</p>
                  <p className="text-lg text-gray-500">ID: {family.creator_id}</p>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {family.member_count} 人
                  </span>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <p className="text-lg text-gray-600">
                    {new Date(family.created_at).toLocaleString('zh-CN')}
                  </p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-lg text-gray-600 line-clamp-2">
                    {family.description || '暂无描述'}
                  </p>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(family.id, family.name)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-base font-medium transition-colors"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
