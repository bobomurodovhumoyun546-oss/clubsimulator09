// Keep the result and its XP award atomic, including duplicate submissions.
export function saveResult(db, {id, user, gameId, score, correct, total, day}) {
  const statements = [
    {sql: 'INSERT OR IGNORE INTO results VALUES(?,?,?,?,?,?,?)', args: [`${user}:${id}`, user, gameId, score, correct, total, day]},
    {sql: 'UPDATE users SET xp=xp+? WHERE id=? AND changes()>0', args: [Math.min(300, 10 + correct * 10), user]},
  ];
  if (db.batch) return db.batch(statements);
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const {sql, args} of statements) db.prepare(sql).run(...args);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
