import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../plugins/growth-column';

export async function GET() {
  if (!isEnabled()) {
    return NextResponse.json({ enabled: false }, { status: 404 });
  }

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY;

  return NextResponse.json({
    enabled: true,
    hasOpenAI,
    hasElevenLabs,
    timestamp: new Date().toISOString()
  });
}
