import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../plugins/growth-column';

// 配置 - 从环境变量读取
const isNvidia = process.env.OPENAI_BASE_URL?.includes('nvidia');
const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: isNvidia
      ? (process.env.OPENAI_MODEL || 'meta/llama-3.1-405b-instruct')
      : (process.env.OPENAI_MODEL || 'gpt-4o-mini')
  }
};

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  if (!config.openai.apiKey) {
    return NextResponse.json(
      { error: '服務未配置', message: '請設置 OPENAI_API_KEY 環境變量' },
      { status: 503 }
    );
  }

  try {
    const { bookName } = await request.json();

    if (!bookName || !bookName.trim()) {
      return NextResponse.json({ error: '請提供書名' }, { status: 400 });
    }

    const prompt = `請為《${bookName}》生成一段適合語音朗讀的導讀文本（約300-400字）。
要求：
1. 用繁體中文
2. 口語化，適合聆聽
3. 包含書籍簡介、核心觀點、讀後啟發
4. 語氣親切，像朋友分享
5. 只輸出文本內容，不要標題或其他格式`;

    const response = await fetch(`${config.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openai.apiKey}`
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [
          { role: 'system', content: '你是一位專業的讀書導讀專家，擅長用親切的口吻分享書籍精華。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error('生成導讀文本失败:', error);
    return NextResponse.json(
      { error: '生成失敗', message: error.message },
      { status: 500 }
    );
  }
}
