import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isEnabled, createMember, updateMember, deleteMember, getFamilyMembers, buildTree } from '@/plugins/family-tree';

export async function GET(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '家族樹插件未啟用' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const treeView = searchParams.get('tree');

    if (!familyId) {
      return NextResponse.json({ error: '缺少家族 ID' }, { status: 400 });
    }

    const members = getFamilyMembers(db, Number(familyId));

    if (treeView === 'true') {
      const tree = buildTree(members);
      return NextResponse.json({ success: true, members, tree });
    }

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error('获取家族树失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '家族樹插件未啟用' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const { familyId, name, gender, birthYear, deathYear, relationship, bio, avatar, parentIds, spouseId, generation } = body;

    if (!familyId || !name) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const memberId = createMember(db, {
      family_id: Number(familyId),
      name,
      gender: gender || 'male',
      birth_year: birthYear ? Number(birthYear) : undefined,
      death_year: deathYear ? Number(deathYear) : undefined,
      relationship,
      bio,
      avatar,
      parent_ids: parentIds || undefined,
      spouse_id: spouseId ? Number(spouseId) : undefined,
      generation: generation ? Number(generation) : 0,
      created_by: user.id,
    });

    return NextResponse.json({ success: true, memberId });
  } catch (error) {
    console.error('创建成员失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '家族樹插件未啟用' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少成員 ID' }, { status: 400 });
    }

    // 转换字段名
    if (data.birthYear !== undefined) {
      data.birth_year = data.birthYear ? Number(data.birthYear) : null;
      delete data.birthYear;
    }
    if (data.deathYear !== undefined) {
      data.death_year = data.deathYear ? Number(data.deathYear) : null;
      delete data.deathYear;
    }
    if (data.parentIds !== undefined) {
      data.parent_ids = data.parentIds || null;
      delete data.parentIds;
    }
    if (data.spouseId !== undefined) {
      data.spouse_id = data.spouseId ? Number(data.spouseId) : null;
      delete data.spouseId;
    }
    if (data.generation !== undefined) {
      data.generation = Number(data.generation);
    }

    const success = updateMember(db, Number(id), data);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('更新成员失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '家族樹插件未啟用' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少成員 ID' }, { status: 400 });
    }

    const success = deleteMember(db, Number(id));

    return NextResponse.json({ success });
  } catch (error) {
    console.error('删除成员失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
