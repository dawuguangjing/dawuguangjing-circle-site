import type { NewsCategory } from '../content/config';

export const categoryLabels: Record<NewsCategory, string> = {
  release: 'リリース',
  update: '更新',
  sale: 'セール',
  devlog: '開発ログ',
  futekigo: '不適合記録',
};

export const branchingLabels: Record<string, string> = {
  none: '一本道',
  light: '軽い分岐あり',
  multi: '複数ルートあり',
};

export const aiLevelLabels: Record<string, string> = {
  none: '未使用',
  partial: '一部使用',
  major: '主要部分で使用',
};
