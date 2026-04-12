'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { TreePine, Plus, ChevronDown, ChevronRight, User, Users, Trash2, Edit, Heart, Eye, List } from 'lucide-react';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';
import FamilyTreeGraph from '@/components/FamilyTreeGraph';
import LargeInput from '@/components/LargeInput';
import LargeTextarea from '@/components/LargeTextarea';

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
  parent_ids: string | null;
  spouse_id: number | null;
  generation: number;
  children?: TreeMember[];
  spouse?: TreeMember;
}

interface User {
  id: number;
  name: string;
  avatar: string;
}

const GENERATIONS = ['祖父母', '父母', '自己', '子女', '孫子女', '曾孫子女'];

function FamilyTreePageContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<TreeMember[]>([]);
  const [tree, setTree] = useState<TreeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');
  const [selectedMember, setSelectedMember] = useState<TreeMember | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    birthYear: '',
    deathYear: '',
    relationship: '',
    bio: '',
    parentIds: [] as number[],
    spouseId: null as number | null,
    generation: 2,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser({ id: 1, name: '系統管理員', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' });
        }
      })
      .catch(() => {
        setUser({ id: 1, name: '系統管理員', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' });
      });
  }, []);

  useEffect(() => {
    if (!familyId) return;
    loadMembers();
  }, [familyId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plugins/tree?familyId=${familyId}&tree=true`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
        setTree(data.tree || []);
      }
    } catch (error) {
      console.error('加载家族树失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim() || !familyId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/plugins/tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: Number(familyId),
          name: newMember.name,
          gender: newMember.gender,
          birthYear: newMember.birthYear || null,
          deathYear: newMember.deathYear || null,
          relationship: newMember.relationship,
          bio: newMember.bio,
          parentIds: newMember.parentIds.length > 0 ? newMember.parentIds.join(',') : null,
          spouseId: newMember.spouseId,
          generation: newMember.generation,
        }),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewMember({
          name: '',
          gender: 'male',
          birthYear: '',
          deathYear: '',
          relationship: '',
          bio: '',
          parentIds: [],
          spouseId: null,
          generation: 2,
        });
        loadMembers();
      }
    } catch (error) {
      console.error('添加成员失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('確定要刪除這個成員嗎？')) return;
    try {
      await fetch(`/api/plugins/tree?id=${id}`, { method: 'DELETE' });
      setSelectedMember(null);
      loadMembers();
    } catch (error) {
      console.error('删除成员失败:', error);
    }
  };

  const renderMemberCard = (member: TreeMember, level: number = 0) => {
    const hasChildren = member.children && member.children.length > 0;
    const isExpanded = expanded.has(member.id);
    
    return (
      <div key={member.id} className="relative">
        <div
          onClick={() => setSelectedMember(member)}
          className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow border-2 ${
            selectedMember?.id === member.id ? 'border-blue-400' : 'border-transparent'
          }`}
        >
          <div className="flex items-center space-x-4">
            {/* 头像 */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              member.gender === 'female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            {/* 信息 */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                {member.spouse_id && <Heart className="h-4 w-4 text-red-500 fill-red-500" />}
              </div>
              <div className="text-sm text-gray-500">
                {member.birth_year && (
                  <span>{member.birth_year}{member.death_year ? ` - ${member.death_year}` : ''}</span>
                )}
                {member.relationship && <span className="ml-2">· {member.relationship}</span>}
              </div>
            </div>
            {/* 展开/折叠 */}
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(member.id);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </button>
            )}
          </div>
          {/* 配偶 */}
          {member.spouse && (
            <div className="mt-3 pl-4 border-l-2 border-pink-200">
              <div className="flex items-center space-x-3 text-gray-600">
                <span>{member.spouse.gender === 'female' ? '👰' : '🤵'}</span>
                <span>{member.spouse.name}</span>
              </div>
            </div>
          )}
        </div>
        {/* 子代 */}
        {hasChildren && isExpanded && (
          <div className="ml-8 mt-3 pl-4 border-l-2 border-blue-200 space-y-3">
            {member.children!.map(child => renderMemberCard(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!familyId) {
    return (
      <Layout user={user || { id: 0, name: '', avatar: '' }}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <TreePine className="h-24 w-24 text-green-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">請選擇家族</h2>
            <a href="/families" className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              前往家族頁面
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <TreePine className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">🌳 家族樹</h1>
                <p className="text-green-100 mt-1">記錄家族的血脈傳承</p>
              </div>
            </div>
            <ElderFriendlyButton variant="primary" onClick={() => setShowAddForm(true)}>
              <Plus className="h-5 w-5 mr-2" />
              添加成員
            </ElderFriendlyButton>
          </div>
        </div>

        {/* 家族成员 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">還沒有家族樹</h3>
            <p className="text-gray-500 mb-6">添加第一位家族成員開始建立家族樹</p>
            <ElderFriendlyButton variant="primary" onClick={() => setShowAddForm(true)}>
              <Plus className="h-5 w-5 mr-2" />
              添加第一位成員
            </ElderFriendlyButton>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 视图切换 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setViewMode('graph')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'graph' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Eye className="w-4 h-4" />
                圖形視圖
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
                列表視圖
              </button>
            </div>

            {/* 图形化视图 */}
            {viewMode === 'graph' && (
              <div className="bg-white rounded-xl shadow-sm h-[600px] overflow-hidden">
                <FamilyTreeGraph 
                  members={members} 
                  onMemberClick={(member: any) => setSelectedMember(member)}
                />
              </div>
            )}

            {/* 列表视图 */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {tree.map(member => renderMemberCard(member))}
              </div>
            )}
          </div>
        )}

        {/* 添加成员弹窗 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">添加家族成員</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">姓名</label>
                  <LargeInput
                    value={newMember.name}
                    onChange={(value: string) => setNewMember(prev => ({ ...prev, name: value }))}
                    placeholder="請輸入姓名"
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">性別</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNewMember(prev => ({ ...prev, gender: 'male' }))}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        newMember.gender === 'male' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <span className="text-2xl">👨</span>
                      <span className="block mt-1">男性</span>
                    </button>
                    <button
                      onClick={() => setNewMember(prev => ({ ...prev, gender: 'female' }))}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        newMember.gender === 'female' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
                      }`}
                    >
                      <span className="text-2xl">👩</span>
                      <span className="block mt-1">女性</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">出生年</label>
                    <input
                      type="number"
                      value={newMember.birthYear}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMember(prev => ({ ...prev, birthYear: e.target.value }))}
                      placeholder="例：1980"
                      className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">去世年</label>
                    <input
                      type="number"
                      value={newMember.deathYear}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMember(prev => ({ ...prev, deathYear: e.target.value }))}
                      placeholder="留空表示在世"
                      className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">在家族中的稱謂</label>
                  <select
                    value={newMember.relationship}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewMember(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                  >
                    <option value="">請選擇</option>
                    <option value="爺爺">爺爺</option>
                    <option value="奶奶">奶奶</option>
                    <option value="外公">外公</option>
                    <option value="外婆">外婆</option>
                    <option value="爸爸">爸爸</option>
                    <option value="媽媽">媽媽</option>
                    <option value="本人">本人</option>
                    <option value="配偶">配偶</option>
                    <option value="兒子">兒子</option>
                    <option value="女兒">女兒</option>
                    <option value="孫子">孫子</option>
                    <option value="孫女">孫女</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">世代</label>
                  <select
                    value={newMember.generation}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewMember(prev => ({ ...prev, generation: Number(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                  >
                    {GENERATIONS.map((gen, i) => (
                      <option key={i} value={i}>{gen}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">簡介（選填）</label>
                  <LargeTextarea
                    value={newMember.bio}
                    onChange={(value: string) => setNewMember(prev => ({ ...prev, bio: value }))}
                    placeholder="其他補充說明..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <ElderFriendlyButton variant="secondary" onClick={() => setShowAddForm(false)} className="flex-1">
                  取消
                </ElderFriendlyButton>
                <ElderFriendlyButton
                  variant="primary"
                  onClick={handleAddMember}
                  disabled={!newMember.name.trim() || saving}
                  className="flex-1"
                >
                  {saving ? '保存中...' : '保存'}
                </ElderFriendlyButton>
              </div>
            </div>
          </div>
        )}

        {/* 成员详情弹窗 */}
        {selectedMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    selectedMember.gender === 'female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h3>
                    <p className="text-gray-500">{selectedMember.relationship || '家族成員'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {selectedMember.birth_year && (
                  <div className="text-gray-700">
                    <span className="font-medium">出生年份：</span>
                    {selectedMember.birth_year}
                    {selectedMember.death_year && ` - ${selectedMember.death_year}`}
                    {!selectedMember.death_year && ' - 在世'}
                  </div>
                )}
                {selectedMember.bio && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedMember.bio}</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <ElderFriendlyButton variant="secondary" onClick={() => setSelectedMember(null)} className="flex-1">
                  關閉
                </ElderFriendlyButton>
                <ElderFriendlyButton variant="danger" onClick={() => handleDeleteMember(selectedMember.id)} className="flex-1">
                  <Trash2 className="h-5 w-5 mr-2" />
                  刪除
                </ElderFriendlyButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function FamilyTreePage() {
  return <FamilyTreePageContent />;
}
