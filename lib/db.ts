import Database from 'better-sqlite3';

// 自动初始化所有可插拔插件
const db = new Database('family.db', {
  fileMustExist: true,
});

// 自动初始化所有启用的插件
import { initDatabase as initBirthday } from '../plugins/birthday-reminder';
import { initDatabase as initAlbum } from '../plugins/family-album';
import { initDatabase as initGrowthColumn } from '../plugins/growth-column';
import { initDatabase as initMessageBoard } from '../plugins/message-board';

// 按顺序初始化各个插件
if (typeof initBirthday === 'function') {
  initBirthday();
}
if (typeof initAlbum === 'function') {
  initAlbum();
}
if (typeof initGrowthColumn === 'function') {
  initGrowthColumn(db);
}
if (typeof initMessageBoard === 'function') {
  initMessageBoard(db);
}

console.log('[PluginSystem] 插件初始化完成');

export { db };
export default db;
