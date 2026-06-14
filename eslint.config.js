import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**']
  },
  {
    files: ['**/*.ts', '**/*.mjs'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    // scripts と ルート設定ファイル（astro.config.mjs 等）は Node 環境のグローバルを許可
    files: ['scripts/**/*.mjs', '*.config.{js,mjs,ts}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
      }
    }
  }
];
