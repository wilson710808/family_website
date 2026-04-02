
// 测试 NVIDIA API 连接
const apiKey = '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';
const baseUrl = 'https://integrate.api.nvidia.com/v1';
const model = 'meta/llama-3.1-8b-instruct';

async function testAPI() {
  console.log('Testing NVIDIA API...');
  console.log('URL:', baseUrl);
  console.log('Model:', model);
  console.log('API Key length:', apiKey.length);
  
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: 'Say hello in 5 words' }
        ],
        temperature: 0.7,
        max_tokens: 100,
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('Error response:', text);
      return;
    }
    
    const data = await response.json();
    console.log('Success! Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testAPI();
