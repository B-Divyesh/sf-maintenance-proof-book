import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const assetsDir = new URL('../dist/assets/', import.meta.url);
const serviceWorkerPath = new URL('../dist/sw.js', import.meta.url);
const files = (await readdir(assetsDir)).filter((name) => !name.endsWith('.map')).sort();
const assets = files.map((name) => `/assets/${name}`);
let worker = await readFile(serviceWorkerPath, 'utf8');
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(join(assetsDir.pathname, file)));
hash.update(worker);
const version = hash.digest('hex').slice(0, 12);
worker = worker
  .replace('__BUILD_VERSION__', version)
  .replace('/* INJECT_BUILD_ASSETS */', assets.map((asset) => JSON.stringify(asset)).join(', '));
await writeFile(serviceWorkerPath, worker);
console.log(`service worker: ${assets.length} built assets precached as ${version}`);
