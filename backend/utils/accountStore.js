import { coreSchema, friendsSchema } from './accountSchema.js';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function openAccountStore(filename = process.env.CLUB_ACCOUNT_DB || fileURLToPath(new URL('../runtime/accounts.sqlite', import.meta.url))) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode=WAL;');
  db.exec(coreSchema);
  // Existing club records used lifetime totals; season 0 lets the first seasonal sync replace them.
  if(!db.prepare('PRAGMA table_info(simulator_clubs)').all().some(column=>column.name==='season'))db.exec('ALTER TABLE simulator_clubs ADD COLUMN season INTEGER NOT NULL DEFAULT 0');
  if(!db.prepare('PRAGMA table_info(users)').all().some(c=>c.name==='username'))db.exec('ALTER TABLE users ADD COLUMN username TEXT');
  for(const user of db.prepare('SELECT id,name FROM users WHERE username IS NULL').all()){
    const slug=user.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,14)||'manager';
    db.prepare('UPDATE users SET username=? WHERE id=?').run(slug+'_'+user.id.replace(/-/g,'').slice(0,8),user.id);
  }
  db.exec(friendsSchema);
  return db;
}
