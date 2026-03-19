import Database from 'better-sqlite3';

const db = new Database('family.db', {
  fileMustExist: true,
});

export { db };
export default db;
