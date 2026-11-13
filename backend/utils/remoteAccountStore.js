import {createClient} from '@libsql/client/web';
import {accountSchema} from './accountSchema.js';

// Match the SQLite statement interface while allowing network I/O to be awaited.
export async function openRemoteAccountStore({
  url = process.env.TURSO_DATABASE_URL,
  authToken = process.env.TURSO_AUTH_TOKEN,
  client,
} = {}) {
  if (!client) {
    if (!url || !authToken) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');
    client = createClient({url, authToken, intMode: 'number'});
  }
  try {
    await client.executeMultiple(accountSchema);
  } catch (error) {
    client.close();
    throw error;
  }
  return {
    prepare(sql) {
      const execute = args => client.execute({sql, args});
      return {
        async get(...args) { return (await execute(args)).rows[0]; },
        async all(...args) { return (await execute(args)).rows; },
        async run(...args) { return {changes: (await execute(args)).rowsAffected}; },
      };
    },
    batch: statements => client.batch(statements, 'write'),
    close: () => client.close(),
  };
}
