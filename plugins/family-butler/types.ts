/**
 * 家族管家插件 - 類型定義
 */

// 聊天記憶記錄
export interface ChatMemory {
  id: number;
  family_id: number;
  message_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
  is_summarized: number;
}

// 計劃提醒
export interface ScheduledReminder {
  id: number;
  family_id: number;
  created_by: number;
  creator_name: string;
  content: string;
  remind_date: string; // YYYY-MM-DD
  remind_time: string | null; // HH:MM 可選
  reminded: number; // 0 未提醒 1 已提醒
  created_at: string;
}

// 增強公告
export interface ButlerAnnouncement {
  id: number;
  family_id: number;
  user_id: number;
  creator_name: string;
  title: string;
  content: string;
  event_date: string; // YYYY-MM-DD
  event_time: string | null;
  notify_days_before: number; // 提前幾天通知
  notified_early: number; // 是否已經提前通知
  notified_today: number; // 是否已經當天通知
  created_at: string;
}

// 年度總結
export interface AnnualSummary {
  id: number;
  family_id: number;
  year: number;
  summary_content: string;
  key_topics: string | null; // JSON 字符串
  created_at: string;
}

// AI 回覆請求
export interface AIReplyRequest {
  familyId: number;
  userId: number;
  userName: string;
  message: string;
  recentMessages: Array<{
    userName: string;
    content: string;
    isNegative?: boolean;
  }>;
  context: {
    hasBirthdayToday: boolean;
    birthdayPerson?: string;
    isHoliday: boolean;
    holidayName?: string;
    upcomingEvents: ButlerAnnouncement[];
    upcomingReminders: ScheduledReminder[];
  };
}

// AI 檢測任務回應
export interface TaskDetectionResult {
  hasTask: boolean;
  taskContent?: string;
  taskDate?: string; // YYYY-MM-DD
  taskTime?: string; // HH:MM
  confidence: number;
}

// 情緒檢測結果
export interface SentimentDetectionResult {
  hasConflict: boolean;
  hasNegativeEmotion: boolean;
  conflictLevel: number; // 0-1
  negativeUserList: number[]; // 有負面情緒的用戶ID
  suggestedIntervention: string; // 建議的調解回覆
}

// 配置接口
export interface ButlerConfig {
  nvidiaApiKey: string;
  modelName: string;
  enabled: boolean;
  enableSentimentDetection: boolean;
  enableAutoTaskDetection: boolean;
  enableBirthdayGreeting: boolean;
  enableHolidayGreeting: boolean;
}

// 會話上下文
export interface SessionContext {
  id: number;
  family_id: number;
  session_id: string;
  user_id: number;
  user_name: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// 用戶偏好
export interface UserPreference {
  id: number;
  family_id: number;
  user_id: number;
  preference_key: string;
  preference_value: string;
  updated_at: string;
}
