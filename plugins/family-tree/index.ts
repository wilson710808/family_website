/**
 * 家族树插件
 * 可插拔設計，通過環境變量控制啟用/禁用
 */

import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface TreeMember {
  id: number;
  family_id: number;
  name: string;
  gender: 'male' | 'female';
  birth_year: number | null;
  death_year: number | null;
  relationship: string | null;
  bio: string | null;
  avatar: string | null;
  parent_ids: string | null;
  spouse_id: number | null;
  generation: number;
  sort_order: number;
  user_id: number | null; // 关联的用户账号ID
  is_registered: number; // 是否已注册用户 (0=否, 1=是)
  created_by: number;
  created_at: string;
  updated_at: string;
  children?: TreeMember[];
  spouse?: TreeMember;
}

export const RELATIONSHIPS = [
  { value: 'self', label: '本人' },
  { value: 'father', label: '爸爸' },
  { value: 'mother', label: '媽媽' },
  { value: 'grandfather', label: '爺爺' },
  { value: 'grandmother', label: '奶奶' },
  { value: 'grandfather_m', label: '外公' },
  { value: 'grandmother_m', label: '外婆' },
  { value: 'son', label: '兒子' },
  { value: 'daughter', label: '女兒' },
  { value: 'brother', label: '兄弟' },
  { value: 'sister', label: '姐妹' },
  { value: 'uncle', label: '叔叔/伯伯' },
  { value: 'aunt', label: '阿姨/姑姑' },
  { value: 'cousin', label: '堂/表兄弟姊妹' },
  { value: 'spouse', label: '配偶' },
  { value: 'other', label: '其他' },
];

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_FAMILY_TREE !== 'false' &&
         process.env.DISABLE_PLUGIN_FAMILY_TREE !== 'true';
}

// 初始化數據庫
export function initDatabase(db: any): void {
  if (!isEnabled()) return;

  try {
    const schemaPath = path.join(process.cwd(), 'plugins/family-tree/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ 家族樹插件數據庫初始化完成');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ 家族樹插件數據庫已存在');
    } else {
      console.error('❌ 家族樹插件數據庫初始化失敗:', error);
      throw error;
    }
  }
}

// 創建成員
export function createMember(db: any, member: {
  family_id: number;
  name: string;
  gender: 'male' | 'female';
  birth_year?: number;
  death_year?: number;
  relationship?: string;
  bio?: string;
  avatar?: string;
  parent_ids?: string;
  spouse_id?: number;
  generation?: number;
  user_id?: number; // 关联用户账号
  is_registered?: number; // 是否已注册用户
  created_by: number;
}): number {
  const result = db.prepare(`
    INSERT INTO plugin_tree_members
    (family_id, name, gender, birth_year, death_year, relationship, bio, avatar, parent_ids, spouse_id, generation, user_id, is_registered, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    member.family_id,
    member.name,
    member.gender,
    member.birth_year || null,
    member.death_year || null,
    member.relationship || null,
    member.bio || null,
    member.avatar || null,
    member.parent_ids || null,
    member.spouse_id || null,
    member.generation || 0,
    member.user_id || null,
    member.is_registered || 0,
    member.created_by,
  );
  return Number(result.lastInsertRowid);
}

// 更新成員
export function updateMember(db: any, id: number, data: Partial<TreeMember>): boolean {
  const fields = Object.keys(data).filter(k => !['id', 'created_at'].includes(k));
  if (fields.length === 0) return false;

  const setClause = fields.map(k => `${k} = ?`).join(', ') + ', updated_at = CURRENT_TIMESTAMP';
  const values = fields.map(k => (data as any)[k]);
  values.push(id);

  return db.prepare(`UPDATE plugin_tree_members SET ${setClause} WHERE id = ?`).run(...values).changes > 0;
}

// 刪除成員
export function deleteMember(db: any, id: number): boolean {
  // 先清除配偶關聯
  db.prepare('UPDATE plugin_tree_members SET spouse_id = NULL WHERE spouse_id = ?').run(id);
  // 清除子代父級關聯
  const member = db.prepare('SELECT * FROM plugin_tree_members WHERE id = ?').get(id) as TreeMember | undefined;
  if (member) {
    const members = db.prepare('SELECT id, parent_ids FROM plugin_tree_members WHERE family_id = ?').all(member.family_id) as { id: number; parent_ids: string | null }[];
    for (const m of members) {
      if (m.parent_ids) {
        const ids = m.parent_ids.split(',').filter(pid => pid !== String(id));
        db.prepare('UPDATE plugin_tree_members SET parent_ids = ? WHERE id = ?').run(
          ids.length > 0 ? ids.join(',') : null,
          m.id
        );
      }
    }
  }
  return db.prepare('DELETE FROM plugin_tree_members WHERE id = ?').run(id).changes > 0;
}

// 獲取所有成員
export function getFamilyMembers(db: any, familyId: number): TreeMember[] {
  return db.prepare(`
    SELECT * FROM plugin_tree_members
    WHERE family_id = ?
    ORDER BY generation, sort_order, id
  `).all(familyId) as TreeMember[];
}

// 構建樹結構
export function buildTree(members: TreeMember[]): TreeMember[] {
  const memberMap = new Map<number, TreeMember>();
  const roots: TreeMember[] = [];

  // 初始化 map
  members.forEach(m => {
    m.children = [];
    memberMap.set(m.id, m);
  });

  // 設置配偶
  members.forEach(m => {
    if (m.spouse_id && memberMap.has(m.spouse_id)) {
      m.spouse = memberMap.get(m.spouse_id)!;
    }
  });

  // 構建樹
  members.forEach(m => {
    if (!m.parent_ids) {
      roots.push(m);
    } else {
      const parentIds = m.parent_ids.split(',').map(Number);
      parentIds.forEach(pid => {
        const parent = memberMap.get(pid);
        if (parent) {
          parent.children = parent.children || [];
          if (!parent.children.find(c => c.id === m.id)) {
            parent.children.push(m);
          }
        }
      });
    }
  });

  return roots;
}

// 獲取成員詳情
export function getMember(db: any, id: number): TreeMember | null {
  return db.prepare('SELECT * FROM plugin_tree_members WHERE id = ?').get(id) as TreeMember | null;
}

// 根據用戶ID獲取家族樹成員
export function getMemberByUserId(db: any, familyId: number, userId: number): TreeMember | null {
  return db.prepare('
    SELECT * FROM plugin_tree_members WHERE family_id = ? AND user_id = ?
  ').get(familyId, userId) as TreeMember | null;
}

// 綁定用戶賬號到家族樹成員
export function bindUserToMember(db: any, memberId: number, userId: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_tree_members
    SET user_id = ?, is_registered = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(userId, memberId);
  return result.changes > 0;
}

// 解綁用戶賬號
export function unbindUserFromMember(db: any, memberId: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_tree_members
    SET user_id = NULL, is_registered = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(memberId);
  return result.changes > 0;
}

// 獲取家族中所有已註冊用戶的成員
export function getRegisteredMembers(db: any, familyId: number): TreeMember[] {
  return db.prepare(`
    SELECT * FROM plugin_tree_members
    WHERE family_id = ? AND is_registered = 1
    ORDER BY generation, sort_order, id
  `).all(familyId) as TreeMember[];
}

// 獲取家族中所有未註冊的成員（可邀請註冊）
export function getUnregisteredMembers(db: any, familyId: number): TreeMember[] {
  return db.prepare(`
    SELECT * FROM plugin_tree_members
    WHERE family_id = ? AND (is_registered = 0 OR is_registered IS NULL)
    ORDER BY generation, sort_order, id
  `).all(familyId) as TreeMember[];
}

export default {
  name: 'family-tree',
  displayName: '家族樹',
  description: '建立家族成員關係樹',
  isEnabled,
  initDatabase,
  createMember,
  updateMember,
  deleteMember,
  getFamilyMembers,
  buildTree,
  getMember,
  // 用戶綁定相關
  getMemberByUserId,
  bindUserToMember,
  unbindUserFromMember,
  getRegisteredMembers,
  getUnregisteredMembers,
};
