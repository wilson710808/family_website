/**
 * 家族管家 - 核心 AI 邏輯
 * 上下文理解 + 家族記憶 + 智能回覆
 */

import type Database from 'better-sqlite3';
import { PERSONA, CONTEXT_TEMPLATE } from './prompts';
// @ts-ignore
import config from './config.json';

// ============ 配置 ============

const AI_CONFIG = {
  baseUrl: process.env.BUTLER_BASE_URL || config.ai.baseUrl,
  apiKey: process.env.BUTLER_API_KEY || '',
  model: process.env.BUTLER_MODEL || config.ai.model,
  maxTokens: config.ai.maxTokens,
  temperature: config.ai.temperature,
  timeout: config.ai.timeout,
  contextMessages: config.ai.contextMessages,
};

// ============ 觸發檢測 ============

export type TriggerType = 'mention' | 'greeting' | 'question' | 'thanks' | 'emotion' | 'conflict' | 'none';

export function detectTrigger(content: string): TriggerType {
  const text = content.trim();
  const lower = text.toLowerCase();

  // 最高優先級：衝突檢測
  const conflictWords = ['滾', '閉嘴', '去死', '白癡', '智障', '腦殘', '廢物', '垃圾', '不要臉', '混蛋'];
  if (conflictWords.some(w => lower.includes(w))) return 'conflict';

  // 感謝（優先於 mention，避免「謝謝管家」觸發 mention）
  if (config.triggers.thanks.some(t => lower.includes(t))) return 'thanks';

  // @管家 / 直接叫管家
  if (config.triggers.mention.some(t => text.includes(t))) return 'mention';

  // 問候
  if (config.triggers.greeting.some(t => text.includes(t))) return 'greeting';

  // 問題
  if (config.triggers.question.some(t => text.includes(t))) return 'question';

  // 情緒表達
  if (config.triggers.emotion.some(t => text.includes(t))) return 'emotion';

  return 'none';
}

// ============ 上下文構建 ============

interface ChatMessage {
  id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

export function buildContext(messages: ChatMessage[]): string {
  const recent = messages.slice(-AI_CONFIG.contextMessages);
  return recent.map(m => `${m.user_name}: ${m.content}`).join('\n');
}

// ============ 家族記憶 ============

export function getFamilyMemories(db: any, familyId: number): string {
  const memories = db.prepare(`
    SELECT category, content FROM plugin_butler_memories
    WHERE family_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(familyId) as { category: string; content: string }[];

  if (memories.length === 0) return '（暫無記憶，我還在認識這個家族）';

  return memories.map(m => `- [${m.category}] ${m.content}`).join('\n');
}

export function saveMemory(db: any, familyId: number, category: string, content: string, userId: number): void {
  db.prepare(`
    INSERT INTO plugin_butler_memories (family_id, category, content, created_by)
    VALUES (?, ?, ?, ?)
  `).run(familyId, category, content, userId);
}

// ============ AI 回覆生成 ============

interface GenerateReplyParams {
  db: any;
  familyId: number;
  messages: ChatMessage[];
  userMessage: string;
  userName: string;
  triggerType: TriggerType;
  userId: number;
}

export async function generateReply(params: GenerateReplyParams): Promise<string | null> {
  const { db, familyId, messages, userMessage, userName, triggerType, userId } = params;

  if (!AI_CONFIG.apiKey) {
    console.warn('[Butler] API Key 未配置，跳過 AI 回覆');
    return null;
  }

  // 衝突場景：固定回覆，不走 AI
  if (triggerType === 'conflict') {
    const conflictReplies = [
      '🌟 大家先冷靜一下～我們都是一家人，有什麼問題可以好好說 💕\n深呼吸，我們一起想想怎麼解決吧！',
      '🤗 家和萬事興！大家都退一步，海闊天空～\n有什麼不開心的，我們一起聊聊？',
      '💝 停停停！大家都是最親的人，不要說氣話～\n冷靜一下，我們來想想怎麼解決這個問題好嗎？',
    ];
    return conflictReplies[Math.floor(Math.random() * conflictReplies.length)];
  }

  try {
    const context = buildContext(messages);
    const memories = getFamilyMemories(db, familyId);

    const userPrompt = CONTEXT_TEMPLATE
      .replace('{context}', context)
      .replace('{memories}', memories)
      .replace('{userName}', userName)
      .replace('{userMessage}', userMessage);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

    const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: PERSONA },
          { role: 'user', content: userPrompt },
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Butler] API 錯誤: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply || reply === '[SKIP]' || reply.includes('[SKIP]')) {
      return null;
    }

    // 記錄回覆
    saveReply(db, familyId, messages[messages.length - 1]?.id || 0, reply, triggerType);

    return reply;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[Butler] AI 請求超時');
    } else {
      console.error('[Butler] AI 請求失敗:', error.message);
    }
    return null;
  }
}

// ============ 回覆記錄 ============

function saveReply(db: any, familyId: number, messageId: number, content: string, triggerType: string): void {
  try {
    db.prepare(`
      INSERT INTO plugin_butler_replies (family_id, message_id, content, trigger_type)
      VALUES (?, ?, ?, ?)
    `).run(familyId, messageId, content, triggerType);
  } catch (error) {
    console.error('[Butler] 保存回覆記錄失敗:', error);
  }
}
