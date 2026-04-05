import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getFamilyMemories, saveMemory, isEnabled } from '@/plugins/family-butler';

export async function GET(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '管家插件未启用' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json({ error: '缺少家族 ID' }, { status: 400 });
    }

    const memories = db.prepare(`
      SELECT m.*, u.name as created_by_name
      FROM plugin_butler_memories m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.family_id = ?
      ORDER BY m.created_at DESC
    `).all(Number(familyId));

    return NextResponse.json({ success: true, memories });
  } catch (error) {
    console.error('获取记忆失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '管家插件未启用' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    const { familyId, category, content } = await request.json();

    if (!familyId || !content?.trim()) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const categoryName = category || 'general';
    saveMemory(db, Number(familyId), categoryName, content.trim(), user.id);

    return NextResponse.json({ success: true, message: '记忆已保存' });
  } catch (error) {
    console.error('保存记忆失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '管家插件未启用' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const memoryId = searchParams.get('id');

    if (!memoryId) {
      return NextResponse.json({ error: '缺少记忆 ID' }, { status: 400 });
    }

    db.prepare('DELETE FROM plugin_butler_memories WHERE id = ?').run(Number(memoryId));
    return NextResponse.json({ success: true, message: '记忆已删除' });
  } catch (error) {
    console.error('删除记忆失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
