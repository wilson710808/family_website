/**
 * 家族管家 - 年度總結 API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getAllAnnualSummaries,
  getAnnualSummary,
  getChatMemoryByYear,
  saveAnnualSummary,
} from '@/plugins/family-butler';
import { generateAnnualSummary } from '@/plugins/family-butler/ai-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = Number(searchParams.get('familyId'));
    const year = searchParams.get('year');

    if (!familyId) {
      return NextResponse.json(
        { success: false, error: '缺少 familyId' },
        { status: 400 }
      );
    }

    if (year) {
      // 獲取指定年份總結
      const summary = getAnnualSummary(db, familyId, Number(year));
      return NextResponse.json({
        success: true,
        summary,
      });
    } else {
      // 獲取所有年度總結列表
      const summaries = getAllAnnualSummaries(db, familyId);
      return NextResponse.json({
        success: true,
        summaries,
      });
    }
  } catch (error) {
    console.error('[FamilyButler] 獲取年度總結失敗:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { familyId, year } = body;

    if (!familyId || !year) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 獲取該年度所有聊天記錄
    const chatMemories = getChatMemoryByYear(db, familyId, year);

    if (chatMemories.length === 0) {
      return NextResponse.json(
        { success: false, error: '該年度沒有聊天記錄' },
        { status: 400 }
      );
    }

    // 轉換格式
    const chatData = chatMemories.map(m => ({
      userName: m.user_name,
      content: m.content,
      date: m.created_at,
    }));

    // 生成年度總結
    const { summary, keyTopics } = await generateAnnualSummary(year, chatData);

    // 保存到數據庫
    const id = saveAnnualSummary(db, familyId, year, summary, keyTopics);

    return NextResponse.json({
      success: true,
      id,
      summary,
      keyTopics,
    });
  } catch (error) {
    console.error('[FamilyButler] 生成年度總結失敗:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
