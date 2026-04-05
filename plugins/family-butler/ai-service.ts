/**
 * 家族管家 - AI 服務
 * 使用 NVIDIA API Llama 3.1 提供快速響應
 * 支持會話上下文記憶
 */

import type { AIReplyRequest, TaskDetectionResult, SentimentDetectionResult } from './types';

const NVIDIA_API_URL = process.env.OPENAI_BASE_URL 
  ? `${process.env.OPENAI_BASE_URL}/chat/completions` 
  : 'https://integrate.api.nvidia.com/v1/chat/completions';

const DEFAULT_MODEL = process.env.FAMILY_BUTLER_MODEL || process.env.OPENAI_MODEL || 'meta/llama-3.1-8b-instruct';

// 獲取 API Key 從環境變量
// 支持 NVIDIA_API_KEY 或 OPENAI_API_KEY
function getApiKey(): string {
  return process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || '';
}

// 四級 JSON 修復機制（從成長專欄借鑒）
function repairJson(text: string): string {
  let cleaned = text.trim();

  // 一級清理：移除多餘的 markdown 標記
  cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();

  // 如果已經是合法 JSON，直接返回
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e1) {
    // 二級清理：自動補全括號
    let fixed = cleaned;
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }

    try {
      JSON.parse(fixed);
      return fixed;
    } catch (e2) {
      // 三級：根據錯誤位置智能修復（簡化版）
      // 移除末尾不完整的逗號
      fixed = fixed.replace(/,\s*$/, '');
      try {
        JSON.parse(fixed);
        return fixed;
      } catch (e3) {
        // 四級：啟發式提取，返回一個默認的安全結果
        console.warn('[FamilyButler] JSON 解析完全失敗，使用啟發式回退');
        return '{}';
      }
    }
  }
}

// 調用 NVIDIA AI（支持多輪對話）
async function callNVIDIAWithHistory(
  systemPrompt: string,
  messages: Array<{role: string; content: string}>,
  temperature: number = 0.7
): Promise<string> {
  const apiKey = getApiKey();
  console.log(`[FamilyButler] callNVIDIA: apiKey length=${apiKey.length}, model=${DEFAULT_MODEL}, url=${NVIDIA_API_URL}`);

  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY 未配置');
  }

  const model = DEFAULT_MODEL;

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
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

// 調用 NVIDIA AI（簡單版本，單輪對話）
async function callNVIDIA(prompt: string, temperature: number = 0.7): Promise<string> {
  const apiKey = getApiKey();
  console.log(`[FamilyButler] callNVIDIA: apiKey length=${apiKey.length}, model=${DEFAULT_MODEL}, url=${NVIDIA_API_URL}`);

  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY 未配置');
  }

  const model = DEFAULT_MODEL;

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'user', content: prompt }
      ],
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

// 擴展的 AI 回覆請求（支持會話歷史）
export interface ExtendedAIReplyRequest extends AIReplyRequest {
  sessionHistory?: Array<{role: 'user' | 'assistant'; content: string}>;
  userPreferences?: Record<string, string>;
}

// 生成管家回覆（支持上下文）
export async function generateButlerReply(request: ExtendedAIReplyRequest): Promise<string> {
  const { message, recentMessages, context, sessionHistory, userPreferences } = request;

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

  // 添加用戶偏好
  if (userPreferences && Object.keys(userPreferences).length > 0) {
    systemPrompt += `\n用戶偏好：\n`;
    for (const [key, value] of Object.entries(userPreferences)) {
      systemPrompt += `- ${key}: ${value}\n`;
    }
  }

  systemPrompt += `\n最近的聊天記錄：\n`;
  recentMessages.slice(-10).forEach(msg => {
    systemPrompt += `${msg.userName}: ${msg.content}\n`;
  });

  systemPrompt += `\n用戶最新發言：${message}\n\n請給出你的回覆：`;

  try {
    // 構建消息歷史（支持多輪對話）
    const messages: Array<{role: string; content: string}> = [];
    
    if (sessionHistory && sessionHistory.length > 0) {
      // 使用會話歷史
      sessionHistory.slice(-10).forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // 添加當前用戶消息
    messages.push({ role: 'user', content: message });

    const reply = await callNVIDIAWithHistory(systemPrompt, messages, 0.8);
    return reply.trim();
  } catch (error) {
    console.error('[FamilyButler] AI 回覆生成失敗:', error);

    // 返回一個友好的默認回覆
    const fallbackReplies = [
      '謝謝你分享這些！大家一起聊聊吧😊',
      '很高興看到大家在这里交流～',
      '這是個很好的話題呢！',
      '感謝分享，說得真好👍',
    ];
    return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  }
}

// 檢測消息中是否包含任務/提醒
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

如果識別不出來日期，設置 hasTask = false。千萬不要編造日期。
`;

  try {
    const resultText = await callNVIDIA(prompt, 0.3);
    const fixedJson = repairJson(resultText);
    const result = JSON.parse(fixedJson) as TaskDetectionResult;

    // 置信度低於 0.7 就認為沒有
    if (result.confidence < 0.7) {
      return { hasTask: false, confidence: result.confidence };
    }

    // 驗證日期格式
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

// 檢測聊天中是否有爭吵或負面情緒
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
  "hasConflict": true/false, 是否有明顯爭吵
  "hasNegativeEmotion": true/false, 是否有用戶有負面情緒
  "conflictLevel": 0.0-1.0, 衝突程度，0表示沒有，1表示非常嚴重
  "negativeUserList": [用戶ID列表], 哪些用戶有負面情緒
  "suggestedIntervention": "如果有情緒衝突，建議管家說什麼話來緩和氣氛"
}

原則：
- 如果只是普通意見分歧不算爭吵，只有明顯衝突才算
- 如果只是隨口說"不開心"算負面情緒，如果嚴重爭吵需要介入
- 如果沒有問題，suggestedIntervention 為空字符串
`;

  try {
    const resultText = await callNVIDIA(prompt, 0.3);
    const fixedJson = repairJson(resultText);
    return JSON.parse(fixedJson) as SentimentDetectionResult;
  } catch (error) {
    console.error('[FamilyButler] 情緒檢測失敗:', error);
    return {
      hasConflict: false,
      hasNegativeEmotion: false,
      conflictLevel: 0,
      negativeUserList: [],
      suggestedIntervention: '',
    };
  }
}

// 生成生日祝賀
export async function generateBirthdayGreeting(userName: string): Promise<string> {
  const prompt = `
請為家族成員 ${userName} 寫一段溫馨的生日祝賀詞，由家族管家發送。

要求：
1. 溫暖真誠，不要太浮誇
2. 用中文繁體
3. 長度適中，100-200字
`;

  try {
    const greeting = await callNVIDIA(prompt, 0.9);
    return `🎂 ${greeting.trim()} 祝你生日快樂！🎂`;
  } catch (error) {
    console.error('[FamilyButler] 生日祝賀生成失敗:', error);
    return `🎂 祝 ${userName} 生日快樂！年年有今日，歲歲有今朝，願你所有願望都能實現！🎂`;
  }
}

// 生成節日祝賀
export async function generateHolidayGreeting(holidayName: string): Promise<string> {
  const prompt = `
今天是${holidayName}，請以家族管家的身份給全體家族成員寫一段節日祝福。

要求：
1. 溫暖喜慶
2. 用中文繁體
3. 100字以內
`;

  try {
    const greeting = await callNVIDIA(prompt, 0.8);
    return `🎊 ${greeting.trim()} 🎊`;
  } catch (error) {
    console.error('[FamilyButler] 節日祝賀生成失敗:', error);
    return `🎊 恭祝大家${holidayName}快樂！願家族和樂融融，每位成員都開心幸福！🎊`;
  }
}

// 生成年度總結
export async function generateAnnualSummary(
  year: number,
  chatContents: Array<{userName: string; content: string; date: string}>
): Promise<{summary: string; keyTopics: string[]}> {
  const sample = chatContents.slice(-200); // 取最後 200 條消息樣本
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
}
`;

  try {
    const resultText = await callNVIDIA(prompt, 0.7);
    const fixedJson = repairJson(resultText);
    const result = JSON.parse(fixedJson);
    return {
      summary: result.summary.trim(),
      keyTopics: result.keyTopics || [],
    };
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
  detectTaskInMessage,
  detectNegativeSentiment,
  generateBirthdayGreeting,
  generateHolidayGreeting,
  generateAnnualSummary,
};
