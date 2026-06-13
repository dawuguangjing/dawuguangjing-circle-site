import { describe, expect, test } from 'vitest';
import { chipValue, getActiveFilterValues, getActiveSortValue } from './filter-url';
import type { FilterDimension, SortDimension } from './filter-state';

// dataset と classList.contains のみ参照するため最小モックで代用する
const chip = (value: string, active: boolean, dataKey = 'filter') =>
  ({
    dataset: { [dataKey]: value },
    classList: { contains: (c: string) => (c === 'is-active' ? active : false) }
  }) as unknown as HTMLElement;

const multiDim: FilterDimension = {
  type: 'filter-multi',
  paramName: 'filters',
  defaultValue: 'all',
  chipSelector: '.x',
  chipDataKey: 'filter'
};

const singleDim: FilterDimension = {
  type: 'filter-single',
  paramName: 'cat',
  defaultValue: 'all',
  chipSelector: '.x',
  chipDataKey: 'filter'
};

const sortDim: SortDimension = {
  type: 'sort',
  paramName: 'sort',
  defaultValue: 'newest',
  chipSelector: '.x',
  chipDataKey: 'sort',
  sortFn: () => 0
};

describe('chipValue', () => {
  test('dataset から値を取得', () => {
    expect(chipValue(chip('r18', true), 'filter')).toBe('r18');
  });
  test('キー不在は空文字', () => {
    expect(chipValue(chip('r18', true), 'missing')).toBe('');
  });
});

describe('getActiveFilterValues (multi)', () => {
  test('アクティブな非デフォルト値のみ返す', () => {
    const chips = [
      chip('all', false),
      chip('r18', true),
      chip('mac', true),
      chip('windows', false)
    ];
    expect(getActiveFilterValues(chips, multiDim)).toEqual(['r18', 'mac']);
  });

  test('デフォルト(all)がアクティブでも除外される', () => {
    const chips = [chip('all', true), chip('r18', false)];
    expect(getActiveFilterValues(chips, multiDim)).toEqual([]);
  });
});

describe('getActiveFilterValues (single)', () => {
  test('非デフォルトのアクティブ値を1件返す', () => {
    const chips = [chip('all', false), chip('r18', true)];
    expect(getActiveFilterValues(chips, singleDim)).toEqual(['r18']);
  });

  test('デフォルトがアクティブなら空', () => {
    const chips = [chip('all', true), chip('r18', false)];
    expect(getActiveFilterValues(chips, singleDim)).toEqual([]);
  });
});

describe('getActiveSortValue', () => {
  test('アクティブなソート値を返す', () => {
    const chips = [chip('newest', false, 'sort'), chip('oldest', true, 'sort')];
    expect(getActiveSortValue(chips, sortDim)).toBe('oldest');
  });

  test('アクティブが無ければデフォルト', () => {
    const chips = [chip('newest', false, 'sort'), chip('oldest', false, 'sort')];
    expect(getActiveSortValue(chips, sortDim)).toBe('newest');
  });
});
