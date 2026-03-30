-- 重新创建用户相关表结构
-- 删除旧表（如果存在）
DROP TABLE IF EXISTS user_login_logs;
DROP TABLE IF EXISTS family_members;
DROP TABLE IF EXISTS users;

-- 创建用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    referral_code TEXT UNIQUE,
    referred_by INTEGER,
    is_admin INTEGER DEFAULT 0 CHECK(is_admin IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    login_total INTEGER DEFAULT 0,
    login_30d INTEGER DEFAULT 0,
    last_login DATETIME,
    FOREIGN KEY (referred_by) REFERENCES users(id)
);

-- 创建用户登录日志表
CREATE TABLE user_login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  login_time DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建家族成员关联表
-- 一个用户可以加入多个家族，一个家族有多个用户
CREATE TABLE family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    invited_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    relationship TEXT,
    contribution_points INTEGER DEFAULT 0,
    contribution_stars INTEGER DEFAULT 1,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (invited_by) REFERENCES users(id),
    UNIQUE(family_id, user_id)
);

-- 插入默认超级管理员账号
-- 邮箱: admin@family.com
-- 密码: admin123456 (bcrypt hashed)
INSERT INTO users (email, password, name, is_admin) VALUES (
  'admin@family.com',
  '$2b$10$vI8zBxEzSxLbJjGvFvUGuWkFmOcGyrXyFzWJyWXyWJyWXyWJyWXyWJyWXyWJyWXyW',
  'Admin',
  1
);
