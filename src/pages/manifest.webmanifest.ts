import type { APIContext } from 'astro';
import { SITE_NAME, CIRCLE_NAME } from '../utils/constants';

export function GET(context: APIContext) {
  const base = import.meta.env.BASE_URL;

  const manifest = {
    name: SITE_NAME,
    short_name: CIRCLE_NAME,
    start_url: base,
    display: 'standalone',
    background_color: '#F5F5F5',
    theme_color: '#0068B7',
    icons: [
      { src: `${base}images/icon-192.svg`, sizes: '192x192', type: 'image/svg+xml' },
      { src: `${base}images/icon-512.svg`, sizes: '512x512', type: 'image/svg+xml' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
}
