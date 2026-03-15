import { db } from './db';

// 生成6位随机推荐码
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 生成唯一的家族推荐码
export async function generateUniqueFamilyReferralCode(): Promise<string> {
  let code: string;
  let exists: boolean;
  
  do {
    code = generateReferralCode();
    const result = db.prepare('SELECT id FROM families WHERE referral_code = ?').get(code);
    exists = !!result;
  } while (exists);
  
  return code;
}

// 生成唯一的用户推荐码
export async function generateUniqueUserReferralCode(): Promise<string> {
  let code: string;
  let exists: boolean;
  
  do {
    code = generateReferralCode();
    const result = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(code);
    exists = !!result;
  } while (exists);
  
  return code;
}

// 通过推荐码查找家族
export async function getFamilyByReferralCode(code: string) {
  try {
    const family = db.prepare('SELECT * FROM families WHERE referral_code = ?').get(code.trim().toUpperCase());
    return family as { id: number; name: string; creator_id: number } | undefined;
  } catch (error) {
    console.error('查找推荐码失败:', error);
    return undefined;
  }
}
