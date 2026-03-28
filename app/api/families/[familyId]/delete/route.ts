import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { familyId } = await params;
    const familyIdNum = parseInt(familyId);

    if (isNaN(familyIdNum)) {
      return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
    }

    // 检查用户是否是家族成员并获取角色
    const memberInfo = db.prepare(`
      SELECT role FROM family_members 
      WHERE family_id = ? AND user_id = ? AND status = 'approved'
    `).get(familyIdNum, user.id) as { role: string } | undefined;

    if (!memberInfo) {
      return NextResponse.json({ success: false, error: '你不是该家族成员' }, { status: 403 });
    }

    // 只有管理员可以删除家族
    if (memberInfo.role !== 'admin') {
      return NextResponse.json({ success: false, error: '只有管理员可以删除家族' }, { status: 403 });
    }

    // 开始事务删除家族相关数据
    // SQLite 不支持外键级联删除，需要手动删除所有相关数据

    // 1. 删除所有成员关系
    db.prepare(`DELETE FROM family_members WHERE family_id = ?`).run(familyIdNum);

    // 2. 删除所有公告
    db.prepare(`DELETE FROM announcements WHERE family_id = ?`).run(familyIdNum);

    // 3. 删除所有消息
    db.prepare(`DELETE FROM messages WHERE family_id = ?`).run(familyIdNum);

    // 4. 删除聊天消息
    db.prepare(`DELETE FROM chat_messages WHERE family_id = ?`).run(familyIdNum);

    // 5. 刪除成長專欄歷史和收藏（如果插件表存在）
    try {
      db.prepare(`DELETE FROM plugin_growth_book_history WHERE family_id = ?`).run(familyIdNum);
      db.prepare(`DELETE FROM plugin_growth_book_favorites WHERE family_id = ?`).run(familyIdNum);
    } catch (e) {
      // 如果表不存在，忽略錯誤
      console.log('成長專欄表不存在，跳過');
    }

    // 6. 删除生日提醒设置（如果插件表存在）
    try {
      db.prepare(`DELETE FROM birthday_reminders WHERE family_id = ?`).run(familyIdNum);
    } catch (e) {
      console.log('生日提醒表不存在，跳过');
    }

    // 7. 删除家庭相册数据（如果插件表存在）
    try {
      db.prepare(`DELETE FROM family_album_photos WHERE family_id = ?`).run(familyIdNum);
      db.prepare(`DELETE FROM family_albums WHERE family_id = ?`).run(familyIdNum);
    } catch (e) {
      console.log('家庭相册表不存在，跳过');
    }

    // 8. 最后删除家族本身
    db.prepare(`DELETE FROM families WHERE id = ?`).run(familyIdNum);

    console.log(`家族 ${familyIdNum} 已被用户 ${user.id} 删除`);

    // 删除成功后重定向到家族列表
    return NextResponse.redirect(new URL('/families', request.url));
  } catch (error) {
    console.error('删除家族接口错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
