import { describe, expect, test } from 'vitest';
import {
  buildOrgSchema,
  buildWebSiteSchema,
  buildProductSchema,
  buildArticleSchema
} from './schema';

describe('buildOrgSchema', () => {
  test('Organization スキーマを返す', () => {
    const schema = buildOrgSchema('https://example.com');
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Organization');
    expect(schema.url).toBe('https://example.com');
    expect(schema.name).toBe('ダウグアングジング');
  });

  test('siteUrl 省略時は url が undefined', () => {
    const schema = buildOrgSchema();
    expect(schema.url).toBeUndefined();
  });
});

describe('buildWebSiteSchema', () => {
  test('WebSite スキーマを返す', () => {
    const schema = buildWebSiteSchema('https://example.com');
    expect(schema['@type']).toBe('WebSite');
    expect(schema.name).toBe('ダウグアングジング公式');
    expect(schema.alternateName).toEqual(['だうぐあんぐじんぐ公式', 'だうぐあんぐじんぐ']);
  });
});

describe('buildProductSchema', () => {
  test('SoftwareApplication スキーマを返す', () => {
    const schema = buildProductSchema({
      title: 'テストゲーム',
      description: '説明文',
      os: 'Windows',
      datePublished: new Date('2025-06-15')
    });
    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.name).toBe('テストゲーム');
    expect(schema.operatingSystem).toBe('Windows');
    expect(schema.datePublished).toBe('2025-06-15');
    expect(schema.applicationCategory).toBe('GameApplication');
  });
});

describe('buildArticleSchema', () => {
  test('Article スキーマを返す', () => {
    const schema = buildArticleSchema({
      headline: 'テスト記事',
      datePublished: new Date('2025-01-10'),
      dateModified: new Date('2025-02-20'),
      image: 'https://example.com/img.png'
    });
    expect(schema['@type']).toBe('Article');
    expect(schema.headline).toBe('テスト記事');
    expect(schema.datePublished).toBe('2025-01-10');
    expect(schema.dateModified).toBe('2025-02-20');
    expect(schema.image).toBe('https://example.com/img.png');
  });

  test('dateModified 省略時は datePublished にフォールバック', () => {
    const schema = buildArticleSchema({
      headline: '記事',
      datePublished: new Date('2025-03-01')
    });
    expect(schema.dateModified).toBe('2025-03-01');
  });

  test('image 省略時はプロパティなし', () => {
    const schema = buildArticleSchema({
      headline: '記事',
      datePublished: new Date('2025-03-01')
    });
    expect('image' in schema).toBe(false);
  });
});
