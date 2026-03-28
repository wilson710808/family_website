import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../plugins/growth-column';
import Database from 'better-sqlite3';

// 配置 - 从环境变量读取
const isNvidia = process.env.OPENAI_BASE_URL?.includes('nvidia');
const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: isNvidia
      ? (process.env.OPENAI_MODEL || 'meta/llama-3.1-8b-instruct')
      : (process.env.OPENAI_MODEL || 'gpt-4o-mini'),
    imageModel: isNvidia
      ? (process.env.NVIDIA_IMAGE_MODEL || 'nvidia/flux-dev-16x1-bc8c4658')
      : 'dall-e-3'
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
  }
};

// 生成书籍导讀
async function generateBookGuide(bookName: string) {
  const prompt = `你是一位資深讀書導讀專家，請為《${bookName}》這本書生成一份完整的導讀內容。

請用繁體中文回答，並**嚴格按照以下JSON格式輸出**。

**非常重要：**
- 你輸出的必須是**純JSON**，不能有任何其他文字說明
- 所有屬性必須正確闭合，逗號不能少也不能多
- 字符串必須用雙引號包裹
- 正確閉合所有數組和對象
- 只輸出JSON，不要說"這是你要的JSON"之類的前言

格式：
{
  "title": "書名",
  "author": "作者",
  "category": "類型（如：自我成長、歷史、小說、商業等）",
  "rating": 4.5,
  "summary": "內容簡介（100-150字，概述本書核心內容和主旨）",
  "keyPoints": [
    "核心觀點1（簡潔有力，20-30字）",
    "核心觀點2",
    "核心觀點3",
    "核心觀點4"
  ],
  "inspiration": "讀後啟發（80-120字，從讀者角度分享閱讀感悟）",
  "practicalExamples": [
    {
      "scenario": "場景描述（30字以内）",
      "advice": "建議做法（30-50字）"
    },
    {
      "scenario": "場景描述（30字以内）",
      "advice": "建議做法（30-50字）"
    }
  ],
  "quotes": [
    "書中金句1",
    "書中金句2"
  ],
  "readingTime": "預計閱讀時間",
  "difficulty": "閱讀難度（入門/進階/深度）"
}

要求：
1. 如果不確定書籍信息，請根據書名合理推測
2. 核心觀點要具體、有洞察力
3. 讀後啟發要有個人感悟，不要泛泛而談
4. 必須提供2個實際生活應用範例
5. **再次強調：只輸出純JSON，不要任何其他內容！**`;

  const response = await fetch(`${config.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openai.apiKey}`
    },
    body: JSON.stringify({
      model: config.openai.model,
      messages: [
        { role: 'system', content: '你是一位專業的讀書導讀專家，擅長提煉書籍精華並提供深刻見解。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // 清理内容：移除markdown代码块标记等
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // 提取第一个 { 到最后一个 } 之间的内容，处理多余文字
  let start = content.indexOf('{');
  let end = content.lastIndexOf('}');
  if (start >= 0 && end >= 0) {
    content = content.slice(start, end + 1);
  }
  // 移除所有控制字符（包括不可见字符）
  content = content.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // 多行模式修复
  content = content
    // 1. 修复缺少逗号：对象/数组项之间缺少逗号
    .replace(/}\s*\n\s*([{"\[])/g, '},\n$1')
    .replace(/]\s*\n\s*([^\]}])/g, '],\n$1')
    // 2. 修复 trailing commas（尾逗号）
    .replace(/,\s*([\]}])/g, '$1')
    // 3. 单引号 → 双引号
    .replace(/'/g, '"')
    // 4. 数组字符串元素之间缺少逗号
    .replace(/"\s*\n\s*"/g, '", "')
    .replace(/"\s+"([^\s])/g, '", "$1')
    // 5. 属性之间缺少逗号
    .replace(/(".*":.*)\s*\n\s*"/g, '$1, "')
    .replace(/(.*)\s*\n\s*"/g, '$1, "')
    // 6. 移除换行，压缩空格
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ');

  // 多级重试解析
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.warn('First JSON parse failed:', (parseError as Error).message);
    console.warn('Problematic content:', content);
    
    // 第二级修复：更激进，手动补全闭合
    let fixed = content;
    
    // 确保所有数组都闭合
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }
    
    // 确保所有对象都闭合
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    
    // 再次尝试
    try {
      const parsed = JSON.parse(fixed);
      console.log('Second attempt (auto-close) succeeded');
      return parsed;
    } catch (secondError) {
      console.warn('Second JSON parse also failed:', (secondError as Error).message);
      
      // 第三级修复：根据错误位置插入缺失字符
      const msg = (secondError as Error).message;
      const positionMatch = msg.match(/position (\d+)/);
      if (positionMatch) {
        const pos = parseInt(positionMatch[1]);
        const charBefore = fixed[pos - 1];
        if (charBefore && /[}\]]/.test(charBefore)) {
          fixed = fixed.slice(0, pos) + ',' + fixed.slice(pos);
        } else if (charBefore) {
          fixed += '}]}';
        }
        try {
          const parsed = JSON.parse(fixed);
          console.log('Third attempt (position fix) succeeded');
          return parsed;
        } catch (thirdError) {
          console.error('Third attempt also failed:', thirdError);
        }
      }
      
      // 第四级回退：尝试提取所有可识别的字段，构建一个最小可用对象
      console.warn('All parse attempts failed, falling back to heuristic extraction');
      try {
        const fallback = extractFallbackGuide(content, bookName);
        console.log('Fallback extraction succeeded');
        return fallback;
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // 不会到这里
  throw new Error('All JSON parsing attempts failed');
}

// 回退方案：当JSON解析完全失败时，启发式提取字段构建一个可用对象
function extractFallbackGuide(content: string, defaultTitle: string): any {
  const guide: any = {
    title: defaultTitle,
    author: '未知',
    category: '自我成長',
    rating: 4.0,
    summary: '無法生成完整導讀，請重試一次。',
    keyPoints: ['暫無法生成核心觀點', '請點擊AI推薦重新嘗試', '', ''],
    inspiration: '由於AI輸出格式錯誤，暫無法生成完整導讀。請返回重試一次通常可以解決問題。',
    practicalExamples: [
      { scenario: '格式錯誤', advice: '請返回上一頁，點擊AI推薦重新生成' },
      { scenario: '解析失敗', advice: '由於模型輸出不穩定，重試通常可以成功' }
    ],
    quotes: ['暫無金句', '請重試'],
    readingTime: '未知',
    difficulty: '入門'
  };

  // 尝试提取各个字段
  const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch) guide.title = titleMatch[1].trim();

  const authorMatch = content.match(/"author"\s*:\s*"([^"]+)"/);
  if (authorMatch) guide.author = authorMatch[1].trim();

  const categoryMatch = content.match(/"category"\s*:\s*"([^"]+)"/);
  if (categoryMatch) guide.category = categoryMatch[1].trim();

  const summaryMatch = content.match(/"summary"\s*:\s*"([^"]+)"/);
  if (summaryMatch) guide.summary = summaryMatch[1].trim();

  const inspirationMatch = content.match(/"inspiration"\s*:\s*"([^"]+)"/);
  if (inspirationMatch) guide.inspiration = inspirationMatch[1].trim();

  // 提取keyPoints数组
  const keyPoints: string[] = [];
  const keyPointsStart = content.indexOf('"keyPoints"');
  if (keyPointsStart >= 0) {
    const arrayStart = content.indexOf('[', keyPointsStart);
    const arrayEnd = content.indexOf(']', arrayStart);
    if (arrayStart >= 0 && arrayEnd >= 0) {
      const arrayContent = content.slice(arrayStart + 1, arrayEnd);
      const matches = arrayContent.match(/"([^"]+)"/g);
      if (matches) {
        matches.forEach(m => {
          const item = m.replace(/^"/, '').replace(/"$/, '').trim();
          if (item) keyPoints.push(item);
        });
      }
    }
  }
  while (keyPoints.length < 4) keyPoints.push('');
  guide.keyPoints = keyPoints.slice(0, 4);

  // 提取quotes
  const quotes: string[] = [];
  const quotesStart = content.indexOf('"quotes"');
  if (quotesStart >= 0) {
    const arrayStart = content.indexOf('[', quotesStart);
    const arrayEnd = content.indexOf(']', arrayStart);
    if (arrayStart >= 0 && arrayEnd >= 0) {
      const arrayContent = content.slice(arrayStart + 1, arrayEnd);
      const matches = arrayContent.match(/"([^"]+)"/g);
      if (matches) {
        matches.forEach(m => {
          const item = m.replace(/^"/, '').replace(/"$/, '').trim();
          if (item) quotes.push(item);
        });
      }
    }
  }
  guide.quotes = quotes.length > 0 ? quotes : ['暫無金句'];

  // 提取practicalExamples - 简化处理
  guide.practicalExamples = [
    { scenario: '日常閱讀', advice: '建議每天安排固定閱讀時間，逐步吸收書中精華' },
    { scenario: '知識實踐', advice: '將書中觀點應用到生活中，在實踐中驗證和調整' }
  ];

  const readingTimeMatch = content.match(/"readingTime"\s*:\s*"([^"]+)"/);
  if (readingTimeMatch) guide.readingTime = readingTimeMatch[1].trim();

  const difficultyMatch = content.match(/"difficulty"\s*:\s*"([^"]+)"/);
  if (difficultyMatch) guide.difficulty = difficultyMatch[1].trim();

  const ratingMatch = content.match(/"rating"\s*:\s*([\d\.]+)/);
  if (ratingMatch) guide.rating = parseFloat(ratingMatch[1]);

  return guide;
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  // Debug: log environment
  console.log('=== Growth Column API Debug ===');
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);
  console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL);
  console.log('config.openai.apiKey exists:', !!config.openai.apiKey);
  console.log('==============================');

  if (!config.openai.apiKey) {
    return NextResponse.json(
      { error: '服務未配置', message: '請設置 OPENAI_API_KEY 環境變量', 
        debug: {
          hasEnvKey: !!process.env.OPENAI_API_KEY,
          configHasKey: !!config.openai.apiKey
        }
      },
      { status: 503 }
    );
  }

  try {
    const { bookName, familyId, userId } = await request.json();

    if (!bookName || !bookName.trim()) {
      return NextResponse.json({ error: '請提供書名' }, { status: 400 });
    }

    const guide = await generateBookGuide(bookName.trim());

    // 保存到阅读历史（如果有数据库连接）
    try {
      const dbPath = process.env.DB_PATH || './family.db';
      const db = new Database(dbPath);

      // 先检查是否已存在
      const existing = db.prepare(`
        SELECT id FROM plugin_growth_book_history
        WHERE family_id = ? AND book_name = ? AND user_id = ?
      `).get(familyId || 1, bookName.trim(), userId || null);

      if (!existing) {
        db.prepare(`
          INSERT INTO plugin_growth_book_history (family_id, user_id, book_name, author, category)
          VALUES (?, ?, ?, ?, ?)
        `).run(familyId || 1, userId || null, bookName.trim(), guide.author || null, guide.category || null);
      }

      db.close();
    } catch (dbError) {
      console.warn('保存阅读历史失败:', dbError);
      // 不影响主流程
    }

    return NextResponse.json({ success: true, data: guide });
  } catch (error: any) {
    console.error('生成导讀失败:', error);
    return NextResponse.json(
      { error: '生成失敗', message: error.message },
      { status: 500 }
    );
  }
}
