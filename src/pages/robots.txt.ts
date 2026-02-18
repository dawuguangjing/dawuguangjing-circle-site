import type { APIContext } from 'astro';

export function GET(context: APIContext) {
  const siteUrl = context.site?.toString().replace(/\/$/, '') ?? '';
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /age/',
    '',
    `Sitemap: ${siteUrl}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
