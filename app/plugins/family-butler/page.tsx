'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Bot, Calendar, Bell, FileText, Sparkles, Clock, CheckCircle } from 'lucide-react';

interface Reminder {
  id: number;
  family_id: number;
  content: string;
  remind_date: string;
  reminded: number;
  creator_name: string;
}

interface Announcement {
  id: number;
  family_id: number;
  title: string;
  content: string;
  event_date: string;
  notify_days_before: number;
  notified_early: number;
  notified_today: number;
  creator_name: string;
}

interface Summary {
  id: number;
  year: number;
  summary_content: string;
  key_topics: string;
  created_at: string;
}

function FamilyButlerContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'reminders' | 'announcements' | 'summaries'>('reminders');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReminder, setNewReminder] = useState({ content: '', date: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    eventDate: '',
    notifyDaysBefore: 3,
  });

  // 获取当前用户
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      });
  }, []);

  // 加载数据
  useEffect(() => {
    if (!familyId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'reminders') {
          const res = await fetch(`/api/plugins/family-butler/reminders?familyId=${familyId}`);
          const data = await res.json();
          if (data.success) {
            setReminders(data.reminders);
          }
        } else if (activeTab === 'announcements') {
          const res = await fetch(`/api/plugins/family-butler/announcements?familyId=${familyId}`);
          const data = await res.json();
          if (data.success) {
            setAnnouncements(data.announcements);
          }
        } else if (activeTab === 'summaries') {
          const res = await fetch(`/api/plugins/family-butler/summaries?familyId=${familyId}`);
          const data = await res.json();
          if (data.success) {
            setSummaries(data.summaries);
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [familyId, activeTab]);

  // 创建提醒
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !user || !newReminder.content || !newReminder.date) return;

    try {
      const res = await fetch('/api/plugins/family-butler/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: Number(familyId),
          userId: user.id,
          userName: user.name,
          content: newReminder.content,
          remindDate: newReminder.date,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 刷新列表
        setNewReminder({ content: '', date: '' });
        // 重新加载
        const res2 = await fetch(`/api/plugins/family-butler/reminders?familyId=${familyId}`);
        const data2 = await res2.json();
        if (data2.success) {
          setReminders(data2.reminders);
        }
      }
    } catch (error) {
      console.error('创建提醒失败:', error);
    }
  };

  // 创建公告
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !user || !newAnnouncement.title || !newAnnouncement.eventDate) return;

    try {
      const res = await fetch('/api/plugins/family-butler/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: Number(familyId),
          userId: user.id,
          userName: user.name,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          eventDate: newAnnouncement.eventDate,
          notifyDaysBefore: newAnnouncement.notifyDaysBefore,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 重置表单
        setNewAnnouncement({
          title: '',
          content: '',
          eventDate: '',
          notifyDaysBefore: 3,
        });
        // 重新加载
        const res2 = await fetch(`/api/plugins/family-butler/announcements?familyId=${familyId}`);
        const data2 = await res2.json();
        if (data2.success) {
          setAnnouncements(data2.announcements);
        }
      }
    } catch (error) {
      console.error('创建公告失败:', error);
    }
  };

  // 生成年度总结
  const handleGenerateAnnualSummary = async () => {
    if (!familyId) return;
    const currentYear = new Date().getFullYear();

    try {
      const res = await fetch('/api/plugins/family-butler/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: Number(familyId),
          year: currentYear,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 刷新列表
        const res2 = await fetch(`/api/plugins/family-butler/summaries?familyId=${familyId}`);
        const data2 = await res2.json();
        if (data2.success) {
          setSummaries(data2.summaries);
        }
      } else {
        alert(data.error || '生成失败');
      }
    } catch (error) {
      console.error('生成年度总结失败:', error);
      alert('生成失败，请查看控制台');
    }
  };

  if (!familyId) {
    return (
      <Layout user={user || { id: 0, name: '', avatar: '' }}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Bot className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">请选择家族</h2>
            <p className="text-gray-500 mb-6">请从家族页面进入家族管家</p>
            <a
              href="/families"
              className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
            >
              前往家族页面
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout user={{ id: 0, name: '', avatar: '' }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-xl text-gray-500 ml-4">加载中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">家族管家</h1>
              <p className="text-blue-100">您的智能私人家族助理，讓家庭生活更美好</p>
            </div>
          </div>
        </div>

        {/* 功能介绍 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">智能提醒</h3>
            </div>
            <p className="text-sm text-gray-600">自動識別聊天中的待辦事項，準時發送提醒</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">公告預約</h3>
            </div>
            <p className="text-sm text-gray-600">提前三天提醒，當天再次通知，不錯過重要活動</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900">情緒引導</h3>
            </div>
            <p className="text-sm text-gray-600">自動檢測負面情緒和爭吵，主動調和氣氛</p>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'reminders'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              待辦提醒
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'announcements'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              活動公告
            </button>
            <button
              onClick={() => setActiveTab('summaries')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'summaries'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              年度總結
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-6">
            {activeTab === 'reminders' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">添加新提醒</h2>
                <form onSubmit={handleCreateReminder} className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">提醒內容</label>
                      <input
                        type="text"
                        value={newReminder.content}
                        onChange={(e) => setNewReminder({ ...newReminder, content: e.target.value })}
                        placeholder="需要提醒什麼事情？"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">提醒日期</label>
                      <input
                        type="date"
                        value={newReminder.date}
                        onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!newReminder.content || !newReminder.date}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 font-medium"
                  >
                    添加提醒
                  </button>
                </form>

                <h2 className="text-xl font-bold text-gray-900 mb-4">即將到來的提醒</h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : reminders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">沒有待辦提醒，輕輕鬆松～</div>
                ) : (
                  <div className="space-y-3">
                    {reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 text-sm">{reminder.remind_date}</span>
                            {reminder.reminded === 0 ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">等待提醒</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">已提醒</span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">{reminder.content}</p>
                          <p className="text-sm text-gray-500">由 {reminder.creator_name} 添加</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'announcements' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">發布新活動公告</h2>
                <form onSubmit={handleCreateAnnouncement} className="mb-6 space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">活動標題</label>
                        <input
                          type="text"
                          value={newAnnouncement.title}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                          placeholder="活動名稱"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">活動日期</label>
                        <input
                          type="date"
                          value={newAnnouncement.eventDate}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, eventDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">活動內容</label>
                      <textarea
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        placeholder="活動詳細說明"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">提前幾天通知</label>
                      <input
                        type="number"
                        value={newAnnouncement.notifyDaysBefore}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, notifyDaysBefore: parseInt(e.target.value) })}
                        min={0}
                        max={30}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <p className="text-sm text-gray-500 mt-1">管家會在活動前 N 天預先提醒，活動當天再提醒一次</p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!newAnnouncement.title || !newAnnouncement.eventDate}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 font-medium"
                  >
                    發布公告
                  </button>
                </form>

                <h2 className="text-xl font-bold text-gray-900 mb-4">即將到來的活動</h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">沒有即將到來的活動</div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
                          <div className="flex flex-col items-end space-y-1">
                            <span className="text-sm text-gray-600">{announcement.event_date}</span>
                            <div className="flex space-x-1">
                              {announcement.notified_early === 0 ? (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">提前未通知</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">提前已通知</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{announcement.content}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>由 {announcement.creator_name} 發布</span>
                          <span>提前 {announcement.notify_days_before} 天提醒</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'summaries' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">年度聊天總結</h2>
                  <button
                    onClick={handleGenerateAnnualSummary}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm"
                  >
                    生成今年度總結
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : summaries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                    <p>還沒有年度總結，點擊上方按鈕生成</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {summaries.map((summary) => {
                      let keyTopics: string[] = [];
                      try {
                        keyTopics = JSON.parse(summary.key_topics || '[]');
                      } catch {
                        keyTopics = [];
                      }

                      return (
                        <div
                          key={summary.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">
                              {summary.year} 年度家族聊天總結
                            </h3>
                            <p className="text-sm text-gray-500">
                              生成時間：{new Date(summary.created_at).toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <div className="p-4">
                            {keyTopics.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">關鍵主題：</h4>
                                <div className="flex flex-wrap gap-2">
                                  {keyTopics.map((topic, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                    >
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                              {summary.summary_content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 特性说明 */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">💡 管家特色功能</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
              <span><strong>自動任務提醒：</strong>聊天中提到「某天要做某事」，管家會自動識別並在當天提醒大家</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
              <span><strong>情緒偵測調解：</strong>自動發現成員爭吵或負面情緒，主動發言緩和氣氛</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
              <span><strong>生日節日祝福：</strong>成員生日自動祝賀，重大節日自動拜年祝福</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
              <span><strong>年度回顧總結：</strong>年底自動彙整全年聊天內容，生成溫暖的年度回顧</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
              <span><strong>快速響應：</strong>使用 NVIDIA Llama 3.1 API，響應快速流暢</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export default function FamilyButlerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">加载中...</p>
    </div>}>
      <FamilyButlerContent />
    </Suspense>
  );
}
