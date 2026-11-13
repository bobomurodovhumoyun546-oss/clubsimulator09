import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function openAccountStore(filename = process.env.CLUB_ACCOUNT_DB || fileURLToPath(new URL('../runtime/accounts.sqlite', import.meta.url))) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS club_saves(user_id TEXT PRIMARY KEY REFERENCES users(id),state TEXT NOT NULL,updated TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, avatar TEXT NOT NULL DEFAULT '⚽', xp INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS club_grants(id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),amount INTEGER NOT NULL CHECK(amount>0),PRIMARY KEY(id,user_id));
    CREATE TABLE IF NOT EXISTS results(id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), game TEXT NOT NULL, score INTEGER NOT NULL, correct INTEGER NOT NULL, total INTEGER NOT NULL, day TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS quizzes(id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), title TEXT NOT NULL, questions TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS simulator_clubs(user_id TEXT PRIMARY KEY REFERENCES users(id),name TEXT NOT NULL,played INTEGER NOT NULL,wins INTEGER NOT NULL,draws INTEGER NOT NULL,losses INTEGER NOT NULL,goals_for INTEGER NOT NULL,goals_against INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS results_user_day ON results(user_id,day);`);
  // Existing club records used lifetime totals; season 0 lets the first seasonal sync replace them.
  if(!db.prepare('PRAGMA table_info(simulator_clubs)').all().some(column=>column.name==='season'))db.exec('ALTER TABLE simulator_clubs ADD COLUMN season INTEGER NOT NULL DEFAULT 0');
  if(!db.prepare('PRAGMA table_info(users)').all().some(c=>c.name==='username'))db.exec('ALTER TABLE users ADD COLUMN username TEXT');
  for(const user of db.prepare('SELECT id,name FROM users WHERE username IS NULL').all()){
    const slug=user.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,14)||'manager';
    db.prepare('UPDATE users SET username=? WHERE id=?').run(slug+'_'+user.id.replace(/-/g,'').slice(0,8),user.id);
  }
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS users_username ON users(username COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS friendships(a TEXT NOT NULL REFERENCES users(id),b TEXT NOT NULL REFERENCES users(id),sender TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL CHECK(status IN ('pending','accepted')),created INTEGER NOT NULL,PRIMARY KEY(a,b),CHECK(a<b));
    CREATE TABLE IF NOT EXISTS friend_invites(id TEXT PRIMARY KEY,host TEXT NOT NULL REFERENCES users(id),guest TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,match_id TEXT);
    CREATE INDEX IF NOT EXISTS friend_invites_users ON friend_invites(host,guest,status);
    CREATE TABLE IF NOT EXISTS friend_matches(id TEXT PRIMARY KEY,host TEXT NOT NULL REFERENCES users(id),guest TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL,created INTEGER NOT NULL,score TEXT,reason TEXT);
  `);
  return db;
}
