'use client';

import { useState, useEffect } from 'react';
import { Gift, Calendar, Heart } from 'lucide-react';
import { isEnabled, getUpcomingReminders } from '../../plugins/birthday-reminder';
import Link from 'next/link';

interface UpcomingReminder {
  id: number;
  user_id: number;
  family_id: number;
  reminder_type: 'birthday' | 'anniversary' | 'custom';
  title: string;
  birth_date: string;
  year: number | null;
  daysUntil: number;
  age: number | null;
}

interface BirthdayWidgetProps {
  familyId: number;
  maxItems?: number;
}

export default function BirthdayWidget({ familyId, maxItems = 5 }: BirthdayWidgetProps) {
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // 如果插件在服务端被禁用，就不加载了
    if (typeof window !== 'undefined') {
      // 检查插件是否启用（环境变量在服务端，这里通过API判断）
      fetchUpcoming();
    }
  }, [familyId]);

  async function fetchUpcoming() {
    try {
      const res = await fetch(`/api/plugins/birthday/upcoming?familyId=${familyId}&daysAhead=30`);
      const data = await res.json();
      
      if (!data.enabled) {
        setEnabled(false);
        setLoading(false);
        return;
      }

      if (data.success) {
        setReminders(data.reminders.slice(0, maxItems));
      }
    } catch (error) {
      console.error('[BirthdayWidget] Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!enabled || reminders.length === 0) {
    return null; // 插件禁用或者没有即将到来的提醒，不显示组件
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  function getDaysText(days: number) {
    if (days === 0) return '今天！';
    if (days === 1) return '明天';
    return `${days} 天后`;
  }

  function getTypeIcon(type: string) {
    if (type === 'birthday') return <Gift className="w-4 h-4 text-pink-500" />;
    if (type === 'anniversary') return <Heart className="w-4 h-4 text-red-500" />;
    return <Calendar className="w-4 h-4 text-gray-500" />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-500" />
          即将到来
        </h3>
        <Link 
          href={`/plugins/birthday?familyId=${familyId}`}
          className="text-sm text-blue-500 hover:underline"
        >
          管理 →
        </Link>
      </div>

      <div className="space-y-3">
        {reminders.map(reminder => (
          <div key={reminder.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTypeIcon(reminder.reminder_type)}
              <div>
                <div className="font-medium text-sm">{reminder.title}</div>
                <div className="text-xs text-gray-500">
                  {reminder.age !== null && reminder.reminder_type === 'birthday' 
                    ? `今年 ${reminder.age} 岁`
                    : reminder.age !== null && reminder.reminder_type === 'anniversary'
                    ? `第 ${reminder.age} 周年`
                    : ''
                  }
                </div>
              </div>
            </div>
            <span className={`text-sm ${reminder.daysUntil === 0 ? 'text-pink-600 font-bold' : 'text-gray-500'}`}>
              {getDaysText(reminder.daysUntil)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
