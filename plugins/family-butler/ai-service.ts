/**
 * 家族管家 - AI 服務
 * 使用 NVIDIA API Llama 3.1 提供快速響應
 * 支持會話上下文記憶 + 每日摘要 + 成員畫像
 */

import type { AIReplyRequest, TaskDetectionResult, SentimentDetectionResult } from './types';

const NVIDIA_API_URL = process.env.OPENAI_BASE_URL 
  ? `${process.env.OPENAI_BASE_URL}/chat/completions` 
  : 'https://integrate.api.nvidia.com/v1/chat/completions';

const DEFAULT_MODEL = process.env.FAMILY_BUTLER_MODEL || process.env.OPENAI_MODEL || 'meta/llama-3.1-8b-instruct';

function getApiKey(): string {
  return process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || '';
}

function repairJson(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e1) {
    let fixed = cleaned;
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
    
    try {
      JSON.parse(fixed);
      return fixed;
    } catch (e2) {
      fixed = fixed.replace(/,\s*$/, '');
      try {
        JSON.parse(fixed);
        return fixed;
      } catch (e3) {
        console.warn('[FamilyButler] JSON 解析完全失敗，使用啟發式回退');
        return '{}';
      }
    }
  }
}

async function callNVIDIAWithHistory(
  systemPrompt: string,
  messages: Array<{role: string; content: string}>,
  temperature: number = 0.7
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NVIDIA_API_KEY 未配置');

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature,
      max_tokens: 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API 調用失敗: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callNVIDIA(prompt: string, temperature: number = 0.7): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NVIDIA_API_KEY 未配置');

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API 調用失敗: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export interface ExtendedAIReplyRequest extends AIReplyRequest {
  sessionHistory?: Array<{role: 'user' | 'assistant'; content: string}>;
  userPreferences?: Record<string, string>;
  familyProfile?: {
    recentSummaries?: string[];
    memberProfiles?: Array<{
      user_name: string;
      personality_traits?: string[];
      concerns?: string[];
      achievements?: string[];
    }>;
  };
}

export async function generateButlerReply(request: ExtendedAIReplyRequest): Promise<string> {
  const { message, recentMessages, context, sessionHistory, userPreferences, familyProfile } = request;

  let systemPrompt = `你是一個溫暖貼心正向樂觀的家族聊天室管家，你必須嚴格遵守：

1. 永遠只用中文繁體回答
2. 永遠保持積極正向樂觀開朗的態度，絕對不可以說負面、批評、辱罵的話
3. 永遠只給予鼓勵、支持、建設性的正面建議，讓家人感覺溫暖舒適
4. 回應要真誠有內容，不要浮於表面客套：
   - 如果長輩分享人生經驗，要表達尊重受益，並提煉出值得學習的觀點
   - 如果晚輩請教問題，要給出具體可行、符合年齡的建議，語氣親切不教條
   - 如果成員分享生活點滴，要給予共鳴，回應內容要貼近對方的生活情境
   - 如果討論家庭議題，要促進和諧，提出平衡包容的觀點
5. 回應長度適中，大約 2-5 句話，不要太過簡短也不要太冗長
6. 根據完整聊天上下文繼續對話，瞭解話題脈絡和發言者的年齡情境再回答
7. 當家族成員分享話題後，你要主動接話給予鼓勵，延伸話題讓對話可以繼續
8. 保持友善親和的語氣，像一個貼心有智慧的管家，讓家族氣氛更溫馨有凝聚力
9. 記住用戶的偏好和習慣，個性化回應
10. 以家族成員的成就為榮，給予真誠的肯定和祝福

當前上下文信息：
`;

  if (context.hasBirthdayToday && context.birthdayPerson) {
    systemPrompt += `- 今天是 ${context.birthdayPerson} 的生日，請記得祝賀\n`;
  }
  if (context.isHoliday && context.holidayName) {
    systemPrompt += `- 今天是${context.holidayName}，祝大家節日快樂\n`;
  }
  if (context.upcomingEvents.length > 0) {
    systemPrompt += `- 即將到來的活動：${context.upcomingEvents.map(e => e.title + '(' + e.event_date + ')').join(', ')}\n`;
  }
  if (context.upcomingReminders.length > 0) {
    systemPrompt += `- 即將到來的提醒：${context.upcomingReminders.map(r => r.content + '(' + r.remind_date + ')').join(', ')}\n`;
  }

  // 添加家庭畫像信息
  if (familyProfile) {
    if (familyProfile.recentSummaries && familyProfile.recentSummaries.length > 0) {
      systemPrompt += `\n最近的聊天主題摘要：\n${familyProfile.recentSummaries.slice(-3).join('\n')}\n`;
    }
    if (familyProfile.memberProfiles && familyProfile.memberProfiles.length > 0) {
      systemPrompt += `\n家庭成員特性：\n`;
      familyProfile.memberProfiles.forEach(p => {
        systemPrompt += `- ${p.user_name}：`;
        if (p.personality_traits?.length) systemPrompt += `性格${p.personality_traits.join('、')}`;
        if (p.concerns?.length) systemPrompt += `，近期關注${p.concerns.join('、')}`;
        if (p.achievements?.length) systemPrompt += `，成就${p.achievements.join('、')}`;
        systemPrompt += '\n';
      });
    }
  }

  if (userPreferences && Object.keys(userPreferences).length > 0) {
    systemPrompt += `\n用戶偏好：\n`;
    for (const [key, value] of Object.entries(userPreferences)) {
      systemPrompt += `- ${key}: ${value}\n`;
    }
  }

  systemPrompt += `\n最近的聊天記錄：\n`;
  recentMessages.slice(-15).forEach(msg => {
    systemPrompt += `${msg.userName}: ${msg.content}\n`;
  });

  systemPrompt += `\n用戶最新發言：${message}\n\n請根據以上完整的聊天上下文，理解話題脈絡和發言者的情境，給出一個有共鳴、有溫度、能延續對話的回覆：`;

  try {
    const messages: Array<{role: string; content: string}> = [];
    
    if (sessionHistory && sessionHistory.length > 0) {
      sessionHistory.slice(-10).forEach(msg => {
        messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
      });
    }
    messages.push({ role: 'user', content: message });

    const reply = await callNVIDIAWithHistory(systemPrompt, messages, 0.8);
    return reply.trim();
  } catch (error) {
    console.error('[FamilyButler] AI 回覆生成失敗:', error);
    const fallbackReplies = [
      '謝謝你分享這些！大家一起聊聊吧😊',
      '很高興看到大家在这里交流～',
      '這是個很好的話題呢！',
      '感謝分享，說得真好👍',
    ];
    return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  }
}

// 生成每日聊天摘要
export async function generateDailySummary(messages: Array<{user_name: string; content: string; created_at: string}>): Promise<{
  summary_text: string;
  key_topics: string[];
  key_members: string[];
  mood_score: number;
}> {
  const chatText = messages.slice(-100).map(m => `[${m.created_at}] ${m.user_name}: ${m.content}`).join('\n');

  const prompt = `請分析這個家族今天的聊天記錄，生成一份摘要。

聊天記錄：
${chatText}

請按照以下 JSON 格式輸出，只輸出純 JSON：
{
  "summary_text": "今天的主要話題和氛圍描述（100-200字）",
  "key_topics": ["話題1", "話題2", "話題3"],
  "key_members": ["活躍成員1", "活躍成員2"],
  "mood_score": 0.8
}

mood_score 是整體情緒評分（0-1），越高表示氛圍越好。`;

  try {
    const resultText = await callNVIDIA(prompt, 0.5);
    const fixedJson = repairJson(resultText);
    const result = JSON.parse(fixedJson);
    return {
      summary_text: result.summary_text || '今天家人們有愉快的交流。',
      key_topics: result.key_topics || [],
      key_members: result.key_members || [],
      mood_score: typeof result.mood_score === 'number' ? result.mood_score : 0.7,
    };
  } catch (error) {
    console.error('[FamilyButler] 每日摘要生成失敗:', error);
    const members = [...new Set(messages.map(m => m.user_name))];
    return {
      summary_text: '今天家人們有溫馨的交流，氣氛融洽。',
      key_topics: ['日常生活'],
      key_members: members.slice(0, 3),
      mood_score: 0.7,
    };
  }
}

// 分析成員畫像
export async function analyzeMemberProfile(
  userName: string,
  recentMessages: Array<{content: string}>
): Promise<{
  personality_traits: string[];
  concerns: string[];
}> {
  const messagesText = recentMessages.slice(-20).map(m => m.content).join('\n');

  const prompt = `請分析這位家庭成員 ${userName} 的最近聊天內容，提取他的性格特點和近期關注點。

聊天內容：
${messagesText}

請按照以下 JSON 格式輸出，只輸出純 JSON：
{
  "personality_traits": ["性格特點1", "性格特點2"],
  "concerns": ["近期關注點1", "近期關注點2"]
}`;

  try {
    const resultText = await callNVIDIA(prompt, 0.3);
    const fixedJson = repairJson(resultText);
    const result = JSON.parse(fixedJson);
    return {
      personality_traits: result.personality_traits || [],
      concerns: result.concerns || [],
    };
  } catch (error) {
    console.error('[FamilyButler] 成員畫像分析失敗:', error);
    return { personality_traits: [], concerns: [] };
  }
}

export async function detectTaskInMessage(message: string): Promise<TaskDetectionResult> {
  const prompt = `
你是一個任務識別助手，請分析用戶發言是否包含需要在未來某一天提醒的事項。

用戶發言："""${message}"""

請按照以下 JSON 格式輸出，只輸出純 JSON：
{
  "hasTask": true/false,
  "taskContent": "任務內容描述（如果有）",
  "taskDate": "YYYY-MM-DD 格式的提醒日期（如果識別出來）",
  "taskTime": "HH:MM 格式的提醒時間（如果識別出來，否則為 null）",
  "confidence": 0.0-1.0 你對這個識別結果的置信度
}

如果識別不出來日期，設置 hasTask = false。千萬不要編造日期。`;

  try {
    const resultText = await callNVIDIA(prompt, 0.3);
    const fixedJson = repairJson(resultText);
    const result = JSON.parse(fixedJson) as TaskDetectionResult;
    if (result.confidence < 0.7) return { hasTask: false, confidence: result.confidence };
    if (result.hasTask && result.taskDate && !/^\d{4}-\d{2}-\d{2}$/.test(result.taskDate)) {
      result.hasTask = false;
      result.confidence = 0.5;
    }
    return result;
  } catch (error) {
    console.error('[FamilyButler] 任務檢測失敗:', error);
    return { hasTask: false, confidence: 0 };
  }
}

export async function detectNegativeSentiment(
  messages: Array<{userName: string; userId: number; content: string}>
): Promise<SentimentDetectionResult> {
  const messagesText = messages.map(m => `${m.userId}: ${m.content}`).join('\n');

  const prompt = `
你是一個聊天室情緒分析助手，請分析最近幾條聊天記錄中是否：
1. 有發生爭吵或劇烈衝突
2. 有用戶表現出強烈負面情緒（不開心、生氣、難過等）

聊天記錄：
${messagesText}

請按照以下 JSON 格式輸出，只輸出純 JSON：
{
  "hasConflict": true/false,
  "hasNegativeEmotion": true/false,
  "conflictLevel": 0.0-1.0,
  "negativeUserList": [],
  "suggestedIntervention": ""
}`;

  try {
    const resultText = await callNVIDIA(prompt, 0.3);
    const fixedJson = repairJson(resultText);
    return JSON.parse(fixedJson) as SentimentDetectionResult;
  } catch (error) {
    console.error('[FamilyButler] 情緒檢測失敗:', error);
    return { hasConflict: false, hasNegativeEmotion: false, conflictLevel: 0, negativeUserList: [], suggestedIntervention: '' };
  }
}

export async function generateBirthdayGreeting(userName: string): Promise<string> {
  const prompt = `請為家族成員 ${userName} 寫一段溫馨的生日祝賀詞，由家族管家發送。要求：1. 溫暖真誠 2. 用中文繁體 3. 100-200字`;
  try {
    const greeting = await callNVIDIA(prompt, 0.9);
    return `🎂 ${greeting.trim()} 祝你生日快樂！🎂`;
  } catch (error) {
    console.error('[FamilyButler] 生日祝賀生成失敗:', error);
    return `🎂 祝 ${userName} 生日快樂！年年有今日，歲歲有今朝，願你所有願望都能實現！🎂`;
  }
}

export async function generateHolidayGreeting(holidayName: string): Promise<string> {
  const prompt = `今天是${holidayName}，請以家族管家的身份給全體家族成員寫一段節日祝福。要求：1. 溫暖喜慶 2. 用中文繁體 3. 100字以內`;
  try {
    const greeting = await callNVIDIA(prompt, 0.8);
    return `🎊 ${greeting.trim()} 🎊`;
  } catch (error) {
    console.error('[FamilyButler] 節日祝賀生成失敗:', error);
    return `🎊 恭祝大家${holidayName}快樂！願家族和樂融融，每位成員都開心幸福！🎊`;
  }
}

export async function generateAnnualSummary(
  year: number,
  chatContents: Array<{userName: string; content: string; date: string}>
): Promise<{summary: string; keyTopics: string[]}> {
  const sample = chatContents.slice(-200);
  const chatText = sample.map(c => `[${c.date}] ${c.userName}: ${c.content}`).join('\n');

  const prompt = `
請幫我總結這個家族在 ${year} 年的聊天室討論，寫一份年度總結。

要求：
1. 列出本年度幾個核心的討論主題
2. 總結家族成員這一年來的互動氛圍
3. 溫暖正向，回顧過去，展望來年
4. 用中文繁體，大約 300-500 字

聊天記錄樣本：
${chatText}

請按照以下 JSON 格式輸出，只輸出純 JSON：
{
  "summary": "完整的年度總結文字",
  "keyTopics": ["主題1", "主題2", "主題3"]
}`;

  try {
    const resultText = await callNVIDIA(prompt, 0.7);
    const fixedJson = repairJson(resultText);
    const result = JSON.parse(fixedJson);
    return { summary: result.summary.trim(), keyTopics: result.keyTopics || [] };
  } catch (error) {
    console.error('[FamilyButler] 年度總結生成失敗:', error);
    return {
      summary: `${year} 年即將過去，感謝家族成員一年來在聊天室的陪伴與交流。回顧這一年，大家分享了生活點滴，互相鼓勵支持，留下了許多溫暖美好的回憶。期待來年我們繼續相聚，分享更多幸福時光！`,
      keyTopics: ['日常生活分享', '家庭互動', '重要事項討論'],
    };
  }
}

export default {
  generateButlerReply,
  generateDailySummary,
  analyzeMemberProfile,
  detectTaskInMessage,
  detectNegativeSentiment,
  generateBirthdayGreeting,
  generateHolidayGreeting,
  generateAnnualSummary,
};
