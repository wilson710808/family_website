import Database from 'better-sqlite3';

// 自动初始化所有可插拔插件
const db = new Database('family.db', { fileMustExist: true });

// 自动初始化所有启用的插件
import { initDatabase as initBirthday } from '../plugins/birthday-reminder';
import { initDatabase as initAlbum } from '../plugins/family-album';
import { initDatabase as initGrowthColumn } from '../plugins/growth-column';
import { initDatabase as initMessageBoard } from '../plugins/message-board';
import { initDatabase as initButler } from '../plugins/family-butler';
import { initDatabase as initCalendar } from '../plugins/event-calendar';
import { initDatabase as initFamilyTree } from '../plugins/family-tree';
import { initDatabase as initNotification } from '../plugins/notification';
import { initDatabase as initDocumentLibrary } from '../plugins/document-library';

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
if (typeof initButler === 'function') {
  initButler(db);
}
if (typeof initCalendar === 'function') {
  initCalendar(db);
}
if (typeof initFamilyTree === 'function') {
  initFamilyTree(db);
}
if (typeof initNotification === 'function') {
  initNotification(db);
}
if (typeof initDocumentLibrary === 'function') {
  initDocumentLibrary(db);
}

console.log('[PluginSystem] 插件初始化完成');

export { db };
export default db;
