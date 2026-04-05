/**
 * 管家 AI 测试脚本
 * 测试触发检测 + AI 回复生成
 */

const AI_CONFIG = {
  baseUrl: process.env.BUTLER_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.BUTLER_API_KEY || '',
  model: process.env.BUTLER_MODEL || 'meta/llama-3.1-8b-instruct',
};

// 触发检测测试
function testTriggerDetection() {
  const triggers = {
    mention: ['@管家', '@小幫手', '管家', '小幫手'],
    greeting: ['早安', '午安', '晚安', '大家早上好'],
    question: ['怎麼辦', '怎麼說', '覺得呢', '你覺得'],
    thanks: ['謝謝', '感謝'],
    emotion: ['好累', '好煩', '無聊'],
  };

  const conflictWords = ['滾', '閉嘴', '去死', '白癡'];

  const tests = [
    { input: '@管家，今天天氣怎麼樣？', expected: 'mention' },
    { input: '早安！大家今天好嗎？', expected: 'greeting' },
    { input: '這個問題怎麼辦呢？', expected: 'question' },
    { input: '謝謝管家的建議', expected: 'thanks' },
    { input: '今天好累啊...', expected: 'emotion' },
    { input: '你給我滾', expected: 'conflict' },
    { input: '今天吃了火鍋，很好吃', expected: 'none' },
  ];

  console.log('=== 触发检测测试 ===');
  let pass = 0, fail = 0;

  for (const test of tests) {
    const text = test.input;
    const lower = text.toLowerCase();

    let detected = 'none';
    if (conflictWords.some(w => lower.includes(w))) detected = 'conflict';
    else if (triggers.mention.some(t => text.includes(t))) detected = 'mention';
    else if (triggers.greeting.some(t => text.includes(t))) detected = 'greeting';
    else if (triggers.question.some(t => text.includes(t))) detected = 'question';
    else if (triggers.thanks.some(t => text.includes(t))) detected = 'thanks';
    else if (triggers.emotion.some(t => text.includes(t))) detected = 'emotion';

    const ok = detected === test.expected;
    console.log(`${ok ? '✅' : '❌'} "${test.input}" → ${detected} (期望: ${test.expected})`);
    ok ? pass++ : fail++;
  }
  console.log(`\n通过: ${pass}/${tests.length}`);
}

// AI API 测试
async function testAI() {
  if (!AI_CONFIG.apiKey) {
    console.log('\n⚠️  未配置 API Key，跳过 AI 测试');
    return;
  }

  console.log('\n=== AI 回复测试 ===');

  const testCases = [
    { user: '小明', msg: '@管家，今天天氣怎麼樣？' },
    { user: '媽媽', msg: '早安！大家今天好嗎？' },
    { user: '爺爺', msg: '謝謝你，管家' },
  ];

  for (let tc of testCases) {
    const PERSONA = `你是「小幫手」，一個溫暖智慧的家庭管家。回答控制在3句話以內。`;
    const prompt = `${PERSONA}\n\n使用者 ${tc.user} 說：${tc.msg}\n\n請回覆：`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.75,
          max_tokens: 150,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`❌ "${tc.msg}" → API 錯誤: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      console.log(`✅ "${tc.msg}" → ${reply}`);
    } catch (error) {
      console.log(`❌ "${tc.msg}" → ${error.message}`);
    }
  }
}

// 运行测试
console.log('🏠 家族管家 AI 测试\n');
testTriggerDetection();
testAI().then(() => console.log('\n测试完成'));
