/**
 * 家族相册插件 - 相册 API
 * 可插拔设计
 */
import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { isEnabled, createAlbum, updateAlbum, deleteAlbum, getFamilyAlbums } from '@/plugins/family-album';

if (isEnabled()) {
  import('@/plugins/family-album').then(({ initDatabase }) => {
    initDatabase();
  });
}

export async function GET(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled', enabled: false }, { status: 200 });
  }
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const familyId = Number(searchParams.get('familyId'));
    if (!familyId) {
      return NextResponse.json({ error: '缺少 familyId' }, { status: 400 });
    }
    const inFamily = await isUserInFamily(user.id, familyId);
    if (!inFamily) {
      return NextResponse.json({ error: '你不是該家族成員' }, { status: 403 });
    }
    const albums = getFamilyAlbums(familyId);
    return NextResponse.json({ success: true, enabled: true, albums });
  } catch (error) {
    console.error('[Album API] GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.family_id) {
      return NextResponse.json({ error: '缺少 family_id' }, { status: 400 });
    }
    const inFamily = await isUserInFamily(user.id, Number(body.family_id));
    if (!inFamily) {
      return NextResponse.json({ error: '你不是該家族成員' }, { status: 403 });
    }
    const id = createAlbum({
      family_id: body.family_id,
      title: body.title,
      description: body.description || null,
      cover_image: body.cover_image || null,
      created_by: user.id,
      is_public: body.is_public ?? 1
    });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[Album API] POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const familyId = Number(searchParams.get('familyId'));
    if (!familyId) {
      return NextResponse.json({ error: '缺少 familyId' }, { status: 400 });
    }
    const inFamily = await isUserInFamily(user.id, familyId);
    if (!inFamily) {
      return NextResponse.json({ error: '你不是該家族成員' }, { status: 403 });
    }
    const body = await request.json();
    const success = updateAlbum(id, body);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Album API] PUT error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const familyId = Number(searchParams.get('familyId'));
    if (!familyId) {
      return NextResponse.json({ error: '缺少 familyId' }, { status: 400 });
    }
    const inFamily = await isUserInFamily(user.id, familyId);
    if (!inFamily) {
      return NextResponse.json({ error: '你不是該家族成員' }, { status: 403 });
    }
    const success = deleteAlbum(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Album API] DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
