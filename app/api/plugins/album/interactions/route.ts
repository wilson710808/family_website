/**
 * 家族相册插件 - 点赞评论 API
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  isEnabled, 
  toggleLike, 
  addComment, 
  deleteComment, 
  getPhotoComments,
  getPhotoLikes,
  hasUserLiked
} from '@/plugins/family-album';

export async function GET(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ enabled: false }, { status: 200 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const photoId = Number(searchParams.get('photoId'));

    if (!photoId) {
      return NextResponse.json({ error: 'photoId required' }, { status: 400 });
    }

    const likes = getPhotoLikes(photoId);
    const userLiked = hasUserLiked(photoId, user.id);
    const comments = getPhotoComments(photoId);

    return NextResponse.json({
      success: true,
      enabled: true,
      likes,
      userLiked,
      comments
    });
  } catch (error) {
    console.error('[Album Interactions API] GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { action, photoId } = body;

    if (action === 'like') {
      const liked = toggleLike(photoId, user.id);
      const likes = getPhotoLikes(photoId);
      return NextResponse.json({
        success: true,
        liked,
        likes
      });
    }

    if (action === 'comment') {
      const { content } = body;
      const id = addComment(photoId, user.id, content);
      return NextResponse.json({
        success: true,
        id
      });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Album Interactions API] POST error:', error);
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

    const success = deleteComment(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Album Interactions API] DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
