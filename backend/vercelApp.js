import express from 'express';
import {readFileSync} from 'node:fs';
import {createAccountRouter} from './routes/accounts.js';
import {openRemoteAccountStore} from './utils/remoteAccountStore.js';

export function createVercelApp({openStore = openRemoteAccountStore} = {}) {
  const app = express();
  let routerPromise;
  app.disable('x-powered-by');
  app.use(express.json({limit: '4mb'}));
  app.get('/api/health', (req, res) => res.set('Cache-Control', 'no-store').json({
    ok: true,
    service: 'club-simulator',
    accountStorage: 'turso',
    configured: Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN),
    features: {friends: false, onlineMatches: false},
  }));
  app.get('/api/players', (req, res) => {
    const players = JSON.parse(readFileSync(new URL('../public/game-data/players.json', import.meta.url), 'utf8'));
    res.json({data: players, pagination: {page: 1, totalPages: 1, total: players.length}});
  });
  app.use('/api/auth', async (req, res, next) => {
    // Share initialization in a warm instance; retry after a connection failure.
    routerPromise ??= openStore().then(db => createAccountRouter(db, {serverless: true})).catch(error => {
      routerPromise = undefined;
      throw error;
    });
    let router;
    try {
      router = await routerPromise;
    } catch {
      console.error('Account database unavailable. Check Turso configuration and connectivity.');
      return res.status(503).set('Cache-Control', 'no-store').json({code: 'unavailable'});
    }
    router(req, res, next);
  });
  app.use((req, res) => res.status(404).json({code: 'notFound'}));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error.status || 500).json({code: 'generic'});
  });
  return app;
}
