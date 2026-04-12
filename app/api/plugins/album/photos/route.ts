/**
 * 家族相册插件 - 照片 API
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  isEnabled, 
  addPhoto, 
  deletePhoto, 
  getAlbumPhotos,
  getRecentPhotos,
  toggleLike,
  addComment,
  deleteComment,
  getPhotoComments,
  getPhotoLikes,
  hasUserLiked
} from '@/plugins/family-album';

export async function GET(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ enabled: false, photos: [] }, { status: 200 });
  }

  try {
    const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const { searchParams } = new URL(request.url);
    const albumId = Number(searchParams.get('albumId'));
    const familyId = Number(searchParams.get('familyId'));
    const recent = searchParams.get('recent') === 'true';
    const limit = Number(searchParams.get('limit') || '20');

    let photos;
    if (recent && familyId) {
      photos = getRecentPhotos(familyId, limit);
    } else if (albumId) {
      photos = getAlbumPhotos(albumId, limit);
    } else {
      return NextResponse.json({ error: 'albumId or familyId required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      enabled: true,
      photos
    });
  } catch (error) {
    console.error('[Album Photos API] GET error:', error);
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

    const id = addPhoto({
      album_id: body.album_id,
      family_id: body.family_id,
      file_path: body.file_path,
      file_name: body.file_name,
      file_size: body.file_size || null,
      width: body.width || null,
      height: body.height || null,
      title: body.title || null,
      description: body.description || null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      uploaded_by: user.id,
      taken_at: body.taken_at || null
    });

    return NextResponse.json({
      success: true,
      id
    });
  } catch (error) {
    console.error('[Album Photos API] POST error:', error);
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

    const success = deletePhoto(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Album Photos API] DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
