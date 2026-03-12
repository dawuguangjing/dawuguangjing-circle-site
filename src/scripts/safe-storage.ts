// ── Safe Storage Wrappers ────────────────────────────────────────────
// プライベートブラウジングや無効化環境でも安全に Storage にアクセスする。

function getStore(type: 'local' | 'session'): Storage | null {
  try {
    return type === 'local' ? localStorage : sessionStorage;
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[safe-storage] getStore failed:', e);
    return null;
  }
}

export function safeGet(key: string, type: 'local' | 'session' = 'local'): string | null {
  return getStore(type)?.getItem(key) ?? null;
}

export function safeSet(key: string, value: string, type: 'local' | 'session' = 'local'): void {
  try {
    getStore(type)?.setItem(key, value);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[safe-storage] safeSet failed:', e);
  }
}

export function safeRemove(key: string, type: 'local' | 'session' = 'local'): void {
  try {
    getStore(type)?.removeItem(key);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[safe-storage] safeRemove failed:', e);
  }
}
