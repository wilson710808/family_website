const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const db = new Database('./family.db');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Full hash:', hash);
console.log('Hash length:', hash.length);

const result = db.prepare('UPDATE users SET password = ? WHERE id = 1').run(hash);

console.log('Update result:', result);
console.log('Changes:', result.changes);

const updated = db.prepare('SELECT id, email, password FROM users WHERE id = 1').get();
console.log('Updated row:', updated);

db.close();
