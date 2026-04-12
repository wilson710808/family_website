import { getCurrentUser, getUserFamilies } from '@/lib/auth';
import { db } from '@/lib/db';
import GrowthSocialClient from './page.client';
import { redirect } from 'next/navigation';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

async function getInitialData(familyId: number) {
  // 家族书单
  const books = db.prepare(`
    SELECT fb.*, u.name as recommender_name, u.avatar as recommender_avatar
    FROM plugin_growth_family_books fb
    LEFT JOIN users u ON fb.user_id = u.id
    WHERE fb.family_id = ?
    ORDER BY fb.is_featured DESC, fb.likes_count DESC, fb.created_at DESC
    LIMIT 20
  `).all(familyId);

  // 读书笔记
  const notes = db.prepare(`
    SELECT rn.*, u.name as author_name, u.avatar as author_avatar
    FROM plugin_growth_reading_notes rn
    LEFT JOIN users u ON rn.user_id = u.id
    WHERE rn.family_id = ? AND rn.is_shared = 1
    ORDER BY rn.likes_count DESC, rn.created_at DESC
    LIMIT 20
  `).all(familyId);

  // 统计
  const bookCount = db.prepare(`
    SELECT COUNT(*) FROM plugin_growth_family_books WHERE family_id = ?
  `).pluck().get(familyId) as number;

  const noteCount = db.prepare(`
    SELECT COUNT(*) FROM plugin_growth_reading_notes WHERE family_id = ? AND is_shared = 1
  `).pluck().get(familyId) as number;

  return {
    books,
    notes,
    stats: { bookCount, noteCount },
  };
}

export default async function GrowthSocialPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const families = await getUserFamilies(user.id);
  const approvedFamilies = families.filter(f => f.status === 'approved');

  let initialData = null;
  if (approvedFamilies.length > 0) {
    initialData = await getInitialData(approvedFamilies[0].id);
  }

  return (
    <GrowthSocialClient
      user={user}
      families={approvedFamilies}
      initialData={initialData}
      initialFamilyId={approvedFamilies[0]?.id}
    />
  );
}
