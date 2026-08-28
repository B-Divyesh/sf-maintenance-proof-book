import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('static deployment response policy', () => {
  it('ships immutable caching, manifest MIME, CSP, anti-framing and permissions policy', async () => {
    const config = JSON.parse(await readFile(new URL('../../public/staticwebapp.config.json', import.meta.url), 'utf8'));
    const assetRoute = config.routes.find((route: { route: string }) => route.route === '/assets/*');
    expect(assetRoute.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
  });
});
