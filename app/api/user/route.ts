import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    // 更新登录统计
    if (user?.id) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // 先获取当前用户信息看看最后登录时间
      const current = db.prepare(`
        SELECT login_total, last_login FROM users WHERE id = ?
      `).get(user.id) as { login_total: number, last_login: string | null };
      
      // 总登录次数 +1
      let loginTotal = (current?.login_total || 0) + 1;
      
      // 计算近30天登录次数
      // 如果最后登录日期不是今天，重新计算
      let login30d = 0;
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM user_login_logs 
        WHERE user_id = ? AND login_time >= ?
      `).get(user.id, thirtyDaysAgo.toISOString()) as { count: number };
      login30d = result.count + 1; // +1 因为这次登录
      
      // 记录本次登录
      db.prepare(`
        INSERT INTO user_login_logs (user_id, login_time) VALUES (?, ?)
      `).run(user.id, today.toISOString());
      
      // 更新用户表
      db.prepare(`
        UPDATE users 
        SET login_total = ?, last_login = ?
        WHERE id = ?
      `).run(loginTotal, today.toISOString(), user.id);
      
      // 清理30天前的登录日志（保持数据库清洁）
      db.prepare(`
        DELETE FROM user_login_logs WHERE login_time < ?
      `).run(thirtyDaysAgo.toISOString());
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    // 如果出错，仍然返回默认管理员用户
    console.error('获取用户信息失败:', error);
    return NextResponse.json({ 
      user: {
        id: 1,
        email: 'admin@family.com',
        name: '系统管理员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        is_admin: 1,
      } 
    });
  }
}
