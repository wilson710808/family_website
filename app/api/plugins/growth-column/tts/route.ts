import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../plugins/growth-column';

// 使用 OpenAI 官方 TTS（NVIDIA API 不支持 TTS）
async function generateSpeechOpenAI(text: string): Promise<Buffer> {
  const openaiBaseUrl = 'https://api.openai.com/v1';
  const openaiApiKey = process.env.OPENAI_TTS_KEY || process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('未配置 OPENAI_TTS_KEY 或 OPENAI_API_KEY');
  }
  
  const response = await fetch(`${openaiBaseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'nova',
      response_format: 'mp3'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI TTS API error: ${response.status} - ${error}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 使用 ElevenLabs 生成語音（後備）
async function generateSpeechElevenLabs(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  
  if (!apiKey) {
    throw new Error('未配置 ELEVENLABS_API_KEY');
  }
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
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
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
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
    
    // 優先使用 OpenAI TTS，因為 NVIDIA API 不支持 TTS
    if (process.env.OPENAI_TTS_KEY || process.env.OPENAI_API_KEY) {
      try {
        audioBuffer = await generateSpeechOpenAI(text);
      } catch (error: any) {
        console.warn('OpenAI TTS 失敗，嘗試 ElevenLabs:', error.message);
        if (process.env.ELEVENLABS_API_KEY) {
          audioBuffer = await generateSpeechElevenLabs(text);
        } else {
          throw error;
        }
      }
    } else if (process.env.ELEVENLABS_API_KEY) {
      audioBuffer = await generateSpeechElevenLabs(text);
    } else {
      return NextResponse.json(
        { error: '服務未配置', message: '需要配置 OPENAI_TTS_KEY 或 ELEVENLABS_API_KEY' },
        { status: 503 }
      );
    }
    
    // 返回音頻
    return new NextResponse(audioBuffer as unknown as ArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString()
      }
    });
  } catch (error: any) {
    console.error('語音生成失敗:', error);
    return NextResponse.json(
      { error: '語音生成失敗', message: error.message },
      { status: 500 }
    );
  }
}
