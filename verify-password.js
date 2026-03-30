const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const db = new Database('./family.db');
const user = db.prepare('SELECT * FROM users WHERE id = 1').get();

console.log('User:', {
  id: user.id,
  email: user.email,
  passwordHash: user.password,
  passwordLength: user.password.length
});

const password = 'admin123';
const isMatch = bcrypt.compareSync(password, user.password);

console.log('Testing password: "' + password + '"');
console.log('Password matches:', isMatch);
console.log('bcrypt version detected:', user.password.startsWith('$2a$') ? '$2a$' : user.password.startsWith('$2b$') ? '$2b$' : 'unknown');

db.close();
