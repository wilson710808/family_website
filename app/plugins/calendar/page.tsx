'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users, Trash2, Edit } from 'lucide-react';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';
import LargeInput from '@/components/LargeInput';
import LargeTextarea from '@/components/LargeTextarea';
import { isEnabled, EVENT_TYPES, type EventType } from '@/plugins/event-calendar';

interface Event {
  id: number;
  family_id: number;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  start_at: string;
  end_at: string | null;
  is_all_day: number;
  created_by_name?: string;
}

interface User {
  id: number;
  name: string;
  avatar: string;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function CalendarPageContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // 新事件表单
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventType: 'general' as EventType,
    location: '',
    startAt: '',
    endAt: '',
    isAllDay: false,
  });
  const [saving, setSaving] = useState(false);

  // 获取用户
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' });
        }
      })
      .catch(() => {
        setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' });
      });
  }, []);

  // 加载事件
  useEffect(() => {
    if (!familyId) return;
    loadEvents();
  }, [familyId, currentDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const res = await fetch(`/api/plugins/calendar?familyId=${familyId}&start=${startDate}&end=${endDate}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('加载事件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取月份天数
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // 获取月份第一天是周几
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 获取某天的事件
  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.start_at.startsWith(dateStr));
  };

  // 渲染日历
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // 空白格
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    // 日期格
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      days.push(
        <div
          key={day}
          onClick={() => {
            setSelectedDate(dateStr);
            setNewEvent(prev => ({ ...prev, startAt: dateStr }));
          }}
          className={`h-24 p-2 border border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
            isToday ? 'bg-blue-100' : 'bg-white'
          }`}
        >
          <div className={`text-lg font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
                className={`text-xs px-2 py-1 rounded truncate ${
                  EVENT_TYPES.find(t => t.value === event.event_type)?.color === 'pink' ? 'bg-pink-100 text-pink-700' :
                  EVENT_TYPES.find(t => t.value === event.event_type)?.color === 'green' ? 'bg-green-100 text-green-700' :
                  EVENT_TYPES.find(t => t.value === event.event_type)?.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                  EVENT_TYPES.find(t => t.value === event.event_type)?.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 2} 更多</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // 添加事件
  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !familyId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/plugins/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: Number(familyId),
          title: newEvent.title,
          description: newEvent.description,
          eventType: newEvent.eventType,
          location: newEvent.location,
          startAt: newEvent.startAt + (newEvent.isAllDay ? '' : 'T09:00:00'),
          endAt: newEvent.endAt + (newEvent.isAllDay ? '' : 'T18:00:00'),
          isAllDay: newEvent.isAllDay,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setNewEvent({
          title: '',
          description: '',
          eventType: 'general',
          location: '',
          startAt: '',
          endAt: '',
          isAllDay: false,
        });
        loadEvents();
      }
    } catch (error) {
      console.error('添加事件失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 删除事件
  const handleDeleteEvent = async (id: number) => {
    if (!confirm('確定要刪除這個事件嗎？')) return;

    try {
      await fetch(`/api/plugins/calendar?id=${id}`, { method: 'DELETE' });
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error('删除事件失败:', error);
    }
  };

  // 上/下月
  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  if (!familyId) {
    return (
      <Layout user={user || { id: 0, name: '', avatar: '' }}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Calendar className="h-24 w-24 text-blue-300 mx-auto mb-4" />
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Calendar className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📅 家族日曆</h1>
                <p className="text-blue-100 mt-1">記錄家族的重要時刻</p>
              </div>
            </div>
            <ElderFriendlyButton variant="primary" onClick={() => setShowAddForm(true)}>
              <Plus className="h-5 w-5 mr-2" />
              添加事件
            </ElderFriendlyButton>
          </div>
        </div>

        {/* 日历导航 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentDate.getFullYear()}年 {MONTHS[currentDate.getMonth()]}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 日历主体 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* 星期标题 */}
          <div className="grid grid-cols-7 bg-gray-100">
            {WEEKDAYS.map(day => (
              <div key={day} className="py-3 text-center font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>
          {/* 日期 */}
          <div className="grid grid-cols-7">
            {loading ? (
              <div className="col-span-7 py-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              renderCalendar()
            )}
          </div>
        </div>

        {/* 即将到来的事件 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">即將到來</h3>
          {events.filter(e => new Date(e.start_at) >= new Date()).length === 0 ? (
            <p className="text-gray-500 text-center py-4">本月暫無即將到來的事件</p>
          ) : (
            <div className="space-y-3">
              {events
                .filter(e => new Date(e.start_at) >= new Date())
                .slice(0, 5)
                .map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">
                        {EVENT_TYPES.find(t => t.value === event.event_type)?.icon || '📅'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(event.start_at).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 添加事件弹窗 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">添加事件</h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">事件標題</label>
                  <LargeInput
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="例如：小明生日派對"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">事件類型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EVENT_TYPES.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setNewEvent(prev => ({ ...prev, eventType: type.value as EventType }))}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          newEvent.eventType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{type.icon}</span>
                        <span className="block text-sm mt-1">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">開始日期</label>
                  <input
                    type="date"
                    value={newEvent.startAt}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, startAt: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">地點（選填）</label>
                  <LargeInput
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="例如：家裡"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">備註（選填）</label>
                  <LargeTextarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="其他備註..."
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
                  onClick={handleAddEvent}
                  disabled={!newEvent.title.trim() || saving}
                  className="flex-1"
                >
                  {saving ? '保存中...' : '保存'}
                </ElderFriendlyButton>
              </div>
            </div>
          </div>
        )}

        {/* 事件详情弹窗 */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">
                    {EVENT_TYPES.find(t => t.value === selectedEvent.event_type)?.icon || '📅'}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h3>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-3" />
                  <span>{new Date(selectedEvent.start_at).toLocaleString('zh-TW')}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedEvent.description}</p>
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  創建者：{selectedEvent.created_by_name || '未知'}
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <ElderFriendlyButton variant="secondary" onClick={() => setSelectedEvent(null)} className="flex-1">
                  關閉
                </ElderFriendlyButton>
                <ElderFriendlyButton
                  variant="danger"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="flex-1"
                >
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

export default function CalendarPage() {
  return <CalendarPageContent />;
}
