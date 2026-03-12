import { describe, expect, test } from 'vitest';
import { buildLinks } from './types';

const entries = [
  { key: 'fanza', label: 'FANZA で購入', track: 'click_fanza', store: 'fanza' as const },
  { key: 'dlsite', label: 'DLsite で購入', track: 'click_dlsite', store: 'dlsite' as const }
];

describe('buildLinks', () => {
  test('全キーが存在する場合は全リンクを生成', () => {
    const result = buildLinks(
      { fanza: 'https://fanza.example', dlsite: 'https://dlsite.example' },
      entries
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      label: 'FANZA で購入',
      href: 'https://fanza.example',
      track: 'click_fanza',
      store: 'fanza'
    });
  });

  test('undefined のキーはフィルタされる', () => {
    const result = buildLinks({ fanza: 'https://fanza.example', dlsite: undefined }, entries);
    expect(result).toHaveLength(1);
    expect(result[0].store).toBe('fanza');
  });

  test('全て undefined なら空配列', () => {
    const result = buildLinks({ fanza: undefined, dlsite: undefined }, entries);
    expect(result).toEqual([]);
  });

  test('キーが存在しない場合も空配列', () => {
    const result = buildLinks({}, entries);
    expect(result).toEqual([]);
  });
});
