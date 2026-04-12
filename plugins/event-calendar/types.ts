/**
 * 事件日历插件 - 类型和常量（可安全用于客户端）
 */

export type EventType = 'general' | 'birthday' | 'anniversary' | 'meeting' | 'travel' | 'reminder';

export const EVENT_TYPES: { value: EventType; label: string; icon: string; color: string }[] = [
  { value: 'general', label: '一般事件', icon: '📅', color: 'blue' },
  { value: 'birthday', label: '生日', icon: '🎂', color: 'pink' },
  { value: 'anniversary', label: '紀念日', icon: '💑', color: 'red' },
  { value: 'meeting', label: '家庭會議', icon: '👥', color: 'green' },
  { value: 'travel', label: '旅行', icon: '✈️', color: 'purple' },
  { value: 'reminder', label: '提醒', icon: '⏰', color: 'orange' },
];

export interface CalendarEvent {
  id: number;
  family_id: number;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  start_at: string;
  end_at: string | null;
  is_all_day: number;
  is_recurring: number;
  recurrence_rule: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  participants?: EventParticipant[];
}

export interface EventParticipant {
  id: number;
  event_id: number;
  user_id: number;
  status: 'pending' | 'accepted' | 'declined';
  responded_at: string | null;
  user_name?: string;
}
