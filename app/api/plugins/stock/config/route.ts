import { NextResponse } from 'next/server';
import { isEnabled, getStockAIDomain } from '@/plugins/stock-assistant';

export async function GET() {
  if (!isEnabled()) {
    return NextResponse.json({ error: '投資助手插件未啟用' }, { status: 404 });
  }

  return NextResponse.json({
    domain: getStockAIDomain(),
    enabled: true,
  });
}
