'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Edit2, Gift, Bell } from 'lucide-react';
import Link from 'next/link';

interface Reminder {
  id: number;
  user_id: number;
  family_id: number;
  reminder_type: 'birthday' | 'anniversary' | 'custom';
  title: string;
  birth_date: string;
  year: number | null;
  is_enabled: number;
}

interface Settings {
  remind_days_before: number;
  notify_on_birthday_day: number;
  is_enabled: number;
}

export default function BirthdayReminderPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<Settings>({
    remind_days_before: 1,
    notify_on_birthday_day: 1,
    is_enabled: 1
  });
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // 获取url参数
  const [familyId, setFamilyId] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Number(params.get('familyId')) || 1;
    }
    return 1;
  });

  const [newReminder, setNewReminder] = useState({
    reminder_type: 'birthday' as const,
    title: '',
    birth_date: '',
    year: ''
  });

  useEffect(() => {
    if (familyId) {
      fetchData();
    }
  }, [familyId]);

  async function fetchData() {
    try {
      const [reminderRes, settingsRes] = await Promise.all([
        fetch(`/api/plugins/birthday/reminders?familyId=${familyId}&upcoming=false`),
        fetch(`/api/plugins/birthday/settings?familyId=${familyId}`)
      ]);

      if (reminderRes.status === 404) {
        setEnabled(false);
        setLoading(false);
        return;
      }

      const remindersData = await reminderRes.json();
      const settingsData = await settingsRes.json();

      if (remindersData.success) {
        setReminders(remindersData.reminders);
      }
      if (settingsData.success) {
        setSettings(settingsData.settings);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddReminder(e: React.FormEvent) {
    e.preventDefault();
    
    const body = {
      family_id: familyId,
      reminder_type: newReminder.reminder_type,
      title: newReminder.title,
      birth_date: newReminder.birth_date,
      year: newReminder.year ? parseInt(newReminder.year) : null
    };

    const res = await fetch('/api/plugins/birthday/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.success) {
      setShowAddForm(false);
      setNewReminder({ reminder_type: 'birthday', title: '', birth_date: '', year: '' });
      fetchData();
    }
  }

  async function handleDeleteReminder(id: number) {
    if (!confirm('确定要删除这条提醒吗？')) return;
    
    const res = await fetch(`/api/plugins/birthday/reminders?id=${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      fetchData();
    }
  }

  async function handleSaveSettings() {
    const res = await fetch('/api/plugins/birthday/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        familyId,
        ...settings
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('设置保存成功！');
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'birthday': return '生日';
      case 'anniversary': return '纪念日';
      case 'custom': return '自定义';
      default: return type;
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'birthday': return 'bg-pink-100 text-pink-700';
      case 'anniversary': return 'bg-blue-100 text-blue-700';
      case 'custom': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100';
    }
  }

  function formatDate(dateStr: string) {
    if (dateStr.length === 10) {
      // YYYY-MM-DD
      const [y, m, d] = dateStr.split('-');
      return `${y}年${parseInt(m)}月${parseInt(d)}日`;
    } else {
      // MM-DD
      const [m, d] = dateStr.split('-');
      return `${parseInt(m)}月${parseInt(d)}日`;
    }
  }

  if (!enabled) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <Bell className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">生日提醒插件未启用</h2>
          <p className="text-yellow-600">该插件已被禁用，请在环境变量中设置 PLUGIN_BIRTHDAY_REMINDER=true 启用。</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-500" />
            生日与纪念日提醒
          </h1>
          <p className="text-gray-500 mt-1">插件式设计，可随时启用/禁用</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          添加提醒
        </button>
      </div>

      {/* 添加表单 */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">添加新提醒</h2>
          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">提醒类型</label>
              <select
                value={newReminder.reminder_type}
                onChange={e => setNewReminder({...newReminder, reminder_type: e.target.value as any})}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="birthday">生日</option>
                <option value="anniversary">结婚纪念日</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                placeholder={newReminder.reminder_type === 'birthday' ? "张三的生日" : "结婚纪念日"}
                value={newReminder.title}
                onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input
                type={newReminder.reminder_type === 'birthday' && newReminder.year ? "date" : "text"}
                placeholder="MM-DD (如 01-15) 或 YYYY-MM-DD"
                value={newReminder.birth_date}
                onChange={e => setNewReminder({...newReminder, birth_date: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                每年提醒只需要 MM-DD 格式（如 05-20），带年份请使用 YYYY-MM-DD
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年份 (可选)</label>
              <input
                type="number"
                placeholder="出生年份，用于计算年龄"
                value={newReminder.year}
                onChange={e => setNewReminder({...newReminder, year: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                添加
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 设置 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          提醒设置
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              提前几天提醒
            </label>
            <select
              value={settings.remind_days_before}
              onChange={e => setSettings({...settings, remind_days_before: parseInt(e.target.value)})}
              className="border rounded-lg px-3 py-2"
            >
              <option value={0}>不提前，当天提醒</option>
              <option value={1}>提前 1 天</option>
              <option value={3}>提前 3 天</option>
              <option value={7}>提前 7 天</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.notify_on_birthday_day === 1}
              onChange={e => setSettings({...settings, notify_on_birthday_day: e.target.checked ? 1 : 0})}
              id="notify_today"
            />
            <label htmlFor="notify_today" className="text-sm font-medium text-gray-700">
              生日当天也提醒
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.is_enabled === 1}
              onChange={e => setSettings({...settings, is_enabled: e.target.checked ? 1 : 0})}
              id="enable_plugin"
            />
            <label htmlFor="enable_plugin" className="text-sm font-medium text-gray-700">
              启用提醒通知
            </label>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveSettings}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>

      {/* 提醒列表 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">
          提醒列表 ({reminders.length})
        </h2>

        {reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>还没有添加任何提醒</p>
            <p className="text-sm">点击上方 "添加提醒" 开始使用吧</p>
          </div>
        ) : (
          <div className="divide-y">
            {reminders.map(reminder => (
              <div key={reminder.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(reminder.reminder_type)}`}>
                      {getTypeLabel(reminder.reminder_type)}
                    </span>
                    <span className="font-medium">{reminder.title}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(reminder.birth_date)}
                    {reminder.year && ` · ${new Date().getFullYear() - reminder.year} 岁`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: 插件提示 */}
      <div className="mt-6 text-center text-sm text-gray-400">
        🎁 生日提醒插件 · 可插拔设计 · 设置环境变量即可禁用
      </div>
    </div>
  );
}
