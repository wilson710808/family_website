/**
 * 家族相册插件 - 相册 API
 * 可插拔设计
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  isEnabled, 
  createAlbum, 
  updateAlbum, 
  deleteAlbum, 
  getFamilyAlbums 
} from '@/plugins/family-album';

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
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const { searchParams } = new URL(request.url);
    const familyId = Number(searchParams.get('familyId'));

    if (!familyId) {
      return NextResponse.json({ error: 'familyId required' }, { status: 400 });
    }

    const albums = getFamilyAlbums(familyId);

    return NextResponse.json({
      success: true,
      enabled: true,
      albums
    });
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
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const body = await request.json();

    const id = createAlbum({
      family_id: body.family_id,
      title: body.title,
      description: body.description || null,
      cover_image: body.cover_image || null,
      created_by: user.id,
      is_public: body.is_public ?? 1
    });

    return NextResponse.json({
      success: true,
      id
    });
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
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
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
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));

    const success = deleteAlbum(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Album API] DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
