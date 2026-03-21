const db = require('./lib/db').db;
const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@family.com');
console.log('默认管理员用户存在:', user ? '是' : '否');
if (user) {
  console.log('ID:', user.id);
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  console.log('is_admin:', user.is_admin);
} else {
  console.log('需要创建默认管理员用户');
}
