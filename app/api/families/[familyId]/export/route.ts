import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }
    
    const { familyId } = await params;
    const familyIdNum = parseInt(familyId);

    if (isNaN(familyIdNum)) {
      return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
    }

    // 检查用户是否是家族成员
    const membership = await isUserInFamily(user.id, familyIdNum);
    if (!membership) {
      return NextResponse.json({ success: false, error: '无权限导出该家族数据' }, { status: 403 });
    }

    // 获取家族基本信息
    const family = db.prepare(`
      SELECT id, name, description, avatar, referral_code, created_at 
      FROM families WHERE id = ?
    `).get(familyIdNum) as any;

    // 获取成员列表
    const members = db.prepare(`
      SELECT u.id, u.name, u.avatar, fm.role, fm.relationship, fm.contribution_points, fm.contribution_stars, fm.created_at as joined_at
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = ? AND fm.status = 'approved'
      ORDER BY fm.contribution_stars DESC, fm.created_at ASC
    `).all(familyIdNum);

    // 获取公告
    const announcements = db.prepare(`
      SELECT a.id, a.title, a.content, u.name as author, a.created_at
      FROM announcements a
      JOIN users u ON a.user_id = u.id
      WHERE a.family_id = ?
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all(familyIdNum);

    // 获取留言
    const messages = db.prepare(`
      SELECT m.id, m.content, u.name as author, m.created_at
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.family_id = ?
      ORDER BY m.created_at DESC
      LIMIT 100
    `).all(familyIdNum);

    // 获取聊天记录
    const chatMessages = db.prepare(`
      SELECT cm.id, cm.content, cm.created_at,
        CASE WHEN cm.user_id = 0 THEN '聊天室管家' ELSE u.name END as author
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.family_id = ?
      ORDER BY cm.created_at ASC
      LIMIT 500
    `).all(familyIdNum);

    // 获取生日提醒
    const birthdayReminders = db.prepare(`
      SELECT id, reminder_type, title, birth_date, year, created_at
      FROM plugin_birthday_reminders
      WHERE family_id = ? AND is_enabled = 1
      ORDER BY birth_date
    `).all(familyIdNum);

    // 获取事件日历
    const events = db.prepare(`
      SELECT id, title, description, event_type, location, start_at, end_at, is_all_day, created_at
      FROM plugin_calendar_events
      WHERE family_id = ?
      ORDER BY start_at DESC
      LIMIT 100
    `).all(familyIdNum);

    // 获取家族树成员
    const treeMembers = db.prepare(`
      SELECT id, name, gender, birth_year, death_year, relationship, bio, generation, sort_order, created_at
      FROM plugin_tree_members
      WHERE family_id = ?
      ORDER BY generation, sort_order
    `).all(familyIdNum);

    // 获取管家记忆
    const butlerMemories = db.prepare(`
      SELECT id, category, key_name, value, importance, created_at
      FROM plugin_butler_memories
      WHERE family_id = ?
      ORDER BY importance DESC, created_at DESC
      LIMIT 50
    `).all(familyIdNum);

    // 构建导出数据
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        exported_by: user.name,
        family_name: family.name,
      },
      family,
      members,
      announcements,
      messages,
      chat_messages: chatMessages,
      plugins: {
        birthday_reminders: birthdayReminders,
        calendar_events: events,
        family_tree: treeMembers,
        butler_memories: butlerMemories,
      },
    };

    // 返回 JSON 文件下载
    const fileName = `${family.name}_导出_${new Date().toISOString().split('T')[0]}.json`;
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error('导出数据失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
