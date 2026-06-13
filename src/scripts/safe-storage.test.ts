import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { safeGet, safeRemove, safeSet } from './safe-storage';

function mockStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    }
  } as Storage;
}

describe('safe-storage', () => {
  beforeEach(() => {
    globalThis.localStorage = mockStorage();
    globalThis.sessionStorage = mockStorage();
  });
  afterEach(() => {
    // @ts-expect-error テスト後のクリーンアップ
    delete globalThis.localStorage;
    // @ts-expect-error テスト後のクリーンアップ
    delete globalThis.sessionStorage;
  });

  test('set→get→remove ラウンドトリップ (local)', () => {
    safeSet('k', 'v');
    expect(safeGet('k')).toBe('v');
    safeRemove('k');
    expect(safeGet('k')).toBeNull();
  });

  test('session と local は独立している', () => {
    safeSet('k', 'L', 'local');
    safeSet('k', 'S', 'session');
    expect(safeGet('k', 'local')).toBe('L');
    expect(safeGet('k', 'session')).toBe('S');
  });

  test('未設定キーは null', () => {
    expect(safeGet('nope')).toBeNull();
  });
});
