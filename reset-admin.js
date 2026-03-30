const bcrypt = require('bcryptjs');

// 用项目的 bcrypt 生成
const passwordHash = bcrypt.hashSync('admin123', 10);
console.log('Generated hash:', passwordHash);
