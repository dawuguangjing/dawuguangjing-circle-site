import { describe, expect, test, vi, beforeEach } from 'vitest';

describe('withBase', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function getWithBase(base: string) {
    vi.stubEnv('BASE_URL', base);
    const { withBase } = await import('./withBase');
    return withBase;
  }

  test('空パスはベース URL を返す', async () => {
    const withBase = await getWithBase('/repo/');
    expect(withBase('')).toBe('/repo/');
  });

  test('http:// で始まる URL はそのまま返す', async () => {
    const withBase = await getWithBase('/repo/');
    expect(withBase('http://example.com')).toBe('http://example.com');
  });

  test('https:// で始まる URL はそのまま返す', async () => {
    const withBase = await getWithBase('/repo/');
    expect(withBase('https://example.com')).toBe('https://example.com');
  });

  test('先頭の / を除去してベースと結合する', async () => {
    const withBase = await getWithBase('/repo/');
    expect(withBase('/images/logo.png')).toBe('/repo/images/logo.png');
  });

  test('/ なしのパスをベースと結合する', async () => {
    const withBase = await getWithBase('/repo/');
    expect(withBase('images/logo.png')).toBe('/repo/images/logo.png');
  });

  test('ベースが / の場合', async () => {
    const withBase = await getWithBase('/');
    expect(withBase('images/logo.png')).toBe('/images/logo.png');
  });
});
