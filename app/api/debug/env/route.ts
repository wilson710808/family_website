// Debug route to check if environment variables are loaded
import { NextResponse } from 'next/server';

export async function GET() {
  const info = {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyPrefix: process.env.OPENAI_API_KEY ? 
      process.env.OPENAI_API_KEY.slice(0, 20) + '...' + process.env.OPENAI_API_KEY.slice(-5) : 
      null,
    baseUrl: process.env.OPENAI_BASE_URL,
    model: process.env.OPENAI_MODEL,
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
  };
  
  return NextResponse.json(info);
}
