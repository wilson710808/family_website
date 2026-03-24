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
      ? (process.env.OPENAI_MODEL || 'meta/llama-3.1-405b-instruct')
      : (process.env.OPENAI_MODEL || 'gpt-4o-mini')
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
  }
};

// 生成书籍导讀
async function generateBookGuide(bookName: string) {
  const prompt = `你是一位資深讀書導讀專家，請為《${bookName}》這本書生成一份完整的導讀內容。

請用繁體中文回答，並嚴格按照以下 JSON 格式輸出：

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
  "inspiration": "讀後啟發（80-120字，從讀者角度分享閱讀感悟和實際應用）",
  "quotes": [
    "書中金句1",
    "書中金句2"
  ],
  "readingTime": "預計閱讀時間（如：4-6小時）",
  "difficulty": "閱讀難度（入門/進階/深度）"
}

請確保：
1. 如果不確定書籍信息，請根據書名合理推測
2. 核心觀點要具體、有洞察力
3. 讀後啟發要有個人感悟，不要泛泛而談
4. 只輸出 JSON，不要有其他文字`;

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
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  return JSON.parse(content);
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
