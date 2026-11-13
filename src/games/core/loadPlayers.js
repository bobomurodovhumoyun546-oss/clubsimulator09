import { normalizePlayers } from './players.js';
let cache;
let cachedAt = 0;
let pending;
export async function fetchPlayers({ signal, fetcher = fetch } = {}) {
  try {
    const first = await fetcher('/api/players?limit=100&page=1', { signal: signal || AbortSignal.timeout(5000) });
    if (!first.ok) throw new Error('API unavailable');
    const body = await first.json();
    if (!Array.isArray(body.data) || !Number.isInteger(body.pagination?.totalPages) || body.pagination.totalPages > 100) throw new Error('Invalid catalogue');
    const pages = await Promise.all(Array.from({ length: Math.max(0, body.pagination.totalPages - 1) }, async (_, i) => {
      const response = await fetcher(`/api/players?limit=100&page=${i + 2}`, { signal: signal || AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Incomplete catalogue');
      const page = await response.json();
      if (!Array.isArray(page.data)) throw new Error('Invalid page');
      return page.data;
    }));
    const players = normalizePlayers([...body.data, ...pages.flat()]);
    if (!players.length) throw new Error('Empty catalogue');
    return { players, source: 'api' };
  } catch (error) {
    if (signal?.aborted) throw error;
    const response = await fetcher('/game-data/players.json', { signal: signal || AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Catalogue unavailable', { cause:error });
    const players = normalizePlayers(await response.json());
    if (!players.length) throw new Error('Empty catalogue', { cause:error });
    return { players, source: 'snapshot' };
  }
}
export function loadPlayers() {
  if (cache && Date.now() - cachedAt < 60000) return Promise.resolve(cache);
  if (!pending) pending = fetchPlayers().then(value => { cache = value; cachedAt = Date.now(); return value; }).finally(() => { pending = null; });
  return pending;
}
