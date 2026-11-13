export function readLocal(key, fallback) {
  try { return JSON.parse(globalThis.localStorage?.getItem(`clubsim-${key}`) ?? 'null') ?? fallback; } catch { return fallback; }
}
export function writeLocal(key, value) {
  try { globalThis.localStorage?.setItem(`clubsim-${key}`, JSON.stringify(value)); return true; } catch { return false; }
}
