import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createClient} from '@libsql/client';
import {openRemoteAccountStore} from '../backend/utils/remoteAccountStore.js';
import {createVercelApp} from '../backend/vercelApp.js';

async function serve(app) {
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    request: (path, body, cookie) => fetch(base + path, {
      method: body ? 'POST' : 'GET',
      headers: {...(body ? {'Content-Type': 'application/json'} : {}), ...(cookie ? {Cookie: cookie} : {})},
      body: body ? JSON.stringify(body) : undefined,
    }),
    close: () => new Promise(resolve => server.close(resolve)),
  };
}

test('async libSQL accounts, sessions and saves survive separate function instances', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'clubsim-turso-'));
  const url = pathToFileURL(join(directory, 'accounts.db')).href;
  const stores = [], servers = [];
  const openStore = async () => {
    const store = await openRemoteAccountStore({client: createClient({url})});
    stores.push(store);
    return store;
  };
  try {
    const first = await serve(createVercelApp({openStore})); servers.push(first);
    const signup = await first.request('/api/auth/signup', {name: 'Vercel Manager', email: 'vercel@example.com', password: 'password123'});
    assert.equal(signup.status, 200);
    const cookie = signup.headers.get('set-cookie').split(';')[0];
    const user = (await signup.json()).user;
    const club = {version: 1, name: 'Cloud FC', coins: 54321, owned: ['p1'], lineup: Array(11).fill(null), formation: '4-3-3'};
    assert.equal((await first.request('/api/auth/club-save', {club}, cookie)).status, 200);
    const result = {id: 'test-result-001', gameId: 'quiz', score: 100, correct: 2, total: 2};
    assert.equal((await first.request('/api/auth/results', result, cookie)).status, 200);
    assert.equal((await first.request('/api/auth/results', result, cookie)).status, 200);
    // A fresh client and Express app stand in for a cold start or another instance.
    const second = await serve(createVercelApp({openStore})); servers.push(second);
    assert.equal((await (await second.request('/api/auth/me', null, cookie)).json()).user.id, user.id);
    assert.equal((await (await second.request('/api/auth/me', null, cookie)).json()).user.xp, 30);
    assert.deepEqual((await (await second.request('/api/auth/club-save', null, cookie)).json()).club, club);
    assert.equal((await second.request('/api/auth/login', {email: 'vercel@example.com', password: 'wrong'})).status, 401);
    assert.equal((await second.request('/api/auth/login', {email: 'vercel@example.com', password: 'password123'})).status, 200);
    assert.equal((await second.request('/api/auth/club-save')).status, 401);
    assert.equal((await second.request('/api/auth/friends', null, cookie)).status, 503);
    assert.equal((await second.request('/api/auth/logout', {}, cookie)).status, 200);
    assert.equal((await (await first.request('/api/auth/me', null, cookie)).json()).user, null);
    assert.equal((await first.request('/api/nonexistent')).status, 404);
  } finally {
    for (const server of servers) await server.close();
    for (const store of stores) store.close();
    await rm(directory, {recursive: true, force: true, maxRetries: 10, retryDelay: 100});
  }
});

test('failed database initialization returns JSON and can recover on the next request', async () => {
  let attempts = 0;
  const server = await serve(createVercelApp({openStore: async () => {
    attempts++;
    throw new Error('test connection failure');
  }}));
  try {
    assert.equal((await server.request('/api/health')).status, 200);
    assert.equal(attempts, 0);
    for (let i = 0; i < 2; i++) {
      const response = await server.request('/api/auth/me');
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {code: 'unavailable'});
    }
    assert.equal(attempts, 2);
  } finally {
    await server.close();
  }
});
