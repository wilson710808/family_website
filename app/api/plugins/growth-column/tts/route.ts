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
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
  }
};

// 使用 ElevenLabs 生成語音
async function generateSpeech(text: string): Promise<Buffer> {
  const headers: any = {
    'Content-Type': 'application/json',
    'xi-api-key': config.elevenlabs.apiKey
  };
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 使用 OpenAI TTS 生成語音
async function generateSpeechOpenAI(text: string): Promise<Buffer> {
  const headers: any = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.openai.apiKey}`
  };
  const response = await fetch(`${config.openai.baseUrl}/audio/speech`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'nova',
      response_format: 'mp3'
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  try {
    const { text, provider = 'openai' } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: '請提供文字內容' }, { status: 400 });
    }

    let audioBuffer: Buffer;

    // NVIDIA API 只提供聊天，不支持 TTS
    // 所以只支持 ElevenLabs
    if (config.elevenlabs.apiKey) {
      audioBuffer = await generateSpeech(text);
    } else if (config.openai.apiKey && !config.openai.baseUrl?.includes('nvidia')) {
      // 只有使用官方 OpenAI 时才能用 OpenAI TTS
      audioBuffer = await generateSpeechOpenAI(text);
    } else {
      return NextResponse.json(
        { error: '服務未配置', message: '語音功能需要配置 ELEVENLABS_API_KEY。使用 NVIDIA API 時不支持 OpenAI TTS。' },
        { status: 503 }
      );
    }

    // 返回音频
    const responseHeaders: any = {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString()
    };
    return new NextResponse(audioBuffer as unknown as ArrayBuffer, {
      headers: responseHeaders
    });
  } catch (error: any) {
    console.error('语音生成失败:', error);
    return NextResponse.json(
      { error: '語音生成失敗', message: error.message },
      { status: 500 }
    );
  }
}
