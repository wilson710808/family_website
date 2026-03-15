import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUniqueFamilyReferralCode } from '@/lib/referral';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: '请输入家族名称' }, { status: 400 });
    }

    // 生成唯一推荐码
    const referralCode = await generateUniqueFamilyReferralCode();

    // 创建家族
    const result = db.prepare(
      'INSERT INTO families (name, description, creator_id, referral_code) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), description?.trim() || '', user.id, referralCode);

    const familyId = result.lastInsertRowid as number;

    // 添加创建者为管理员
    db.prepare(
      'INSERT INTO family_members (family_id, user_id, role, status) VALUES (?, ?, ?, ?)'
    ).run(familyId, user.id, 'admin', 'approved');

    return NextResponse.json({ success: true, familyId, referralCode });
  } catch (error) {
    console.error('创建家族接口错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
