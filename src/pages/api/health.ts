import type { APIRoute } from 'astro';

// Contoh backend endpoint. Static build → jadi /api/health.json-ish (diprerender).
// Butuh backend dinamis? Pasang adapter SSR (mis. @astrojs/vercel) di astro.config.ts.
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ ok: true, ts: new Date().toISOString() }),
    { headers: { 'content-type': 'application/json' } }
  );
};
