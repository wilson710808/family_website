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
  }
};

// 根据用户场景推荐书籍
async function generateRecommendations(scenario: string) {
  const prompt = `用户现在面临以下困扰或场景：

"${scenario}"

请推荐5本适合解决这个问题或适合这个场景的书籍。推荐自我成长领域的经典好书。

**非常重要：**
- 你輸出的必須是**純JSON**，不能有任何其他文字說明
- 推荐5本书，每本包含书名和推荐理由（1句话说明为什么适合）
- 只输出JSON，不要其他内容

格式：
{
  "recommendations": [
    {
      "bookName": "书名",
      "reason": "为什么推荐这本书适合这个场景的简短理由（30字以内）"
    },
    {
      "bookName": "书名",
      "reason": "推荐理由"
    },
    {
      "bookName": "书名",
      "reason": "推荐理由"
    },
    {
      "bookName": "书名",
      "reason": "推荐理由"
    },
    {
      "bookName": "书名",
      "reason": "推荐理由"
    }
  ]
}

再次强调：只输出纯JSON，不要任何其他说明文字！`;

  const response = await fetch(`${config.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openai.apiKey}`
    },
    body: JSON.stringify({
      model: config.openai.model,
      messages: [
        { role: 'system', content: '你是一位专业的书单推荐顾问，擅长根据用户的困扰推荐合适的书籍。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // 清理内容
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  let start = content.indexOf('{');
  let end = content.lastIndexOf('}');
  if (start >= 0 && end >= 0) {
    content = content.slice(start, end + 1);
  }
  content = content.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // 解析
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
      // 确保最多5本
      parsed.recommendations = parsed.recommendations.slice(0, 5);
      return parsed.recommendations;
    }
    throw new Error('Invalid format');
  } catch (parseError) {
    console.error('JSON parse failed for scenario recommendation:', content);
    throw parseError;
  }
}

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
    const { scenario, familyId } = await request.json();

    if (!scenario || !scenario.trim()) {
      return NextResponse.json({ error: '請描述你的困擾或場景' }, { status: 400 });
    }

    const recommendations = await generateRecommendations(scenario.trim());

    return NextResponse.json({
      success: true,
      recommendations: recommendations
    });
  } catch (error: any) {
    console.error('场景推荐失败:', error);
    return NextResponse.json(
      { error: '推薦失敗', message: error.message },
      { status: 500 }
    );
  }
}
