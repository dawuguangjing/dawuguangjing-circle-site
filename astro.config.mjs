import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

const { name: repoName } = JSON.parse(readFileSync('./package.json', 'utf-8'));
const isCI = process.env.GITHUB_ACTIONS === 'true';
const repo = process.env.GITHUB_REPOSITORY || '';
const [owner, repoFromEnv] = repo.split('/');
const resolvedRepo = repoFromEnv || repoName;

const site =
  process.env.ASTRO_SITE ??
  (isCI && owner
    ? `https://${owner}.github.io/${resolvedRepo}/`
    : `http://localhost:4321/${repoName}/`);

const base = process.env.ASTRO_BASE ?? `/${resolvedRepo}/`;

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/age/')
    })
  ]
});
