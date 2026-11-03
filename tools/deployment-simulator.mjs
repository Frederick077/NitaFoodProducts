import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// A deliberately small local interpreter of the emitted Build Output API routes.
// It verifies this project's output; it does not emulate the Vercel network/runtime.
/** @param {{output?: string, apiHandler?: import('node:http').RequestListener}} options */
export function deploymentSimulator({ output = fileURLToPath(new URL('../.vercel/output/', import.meta.url)), apiHandler } = {}) {
  const config = JSON.parse(fs.readFileSync(path.join(output, 'config.json'), 'utf8'));
  const staticRoot = path.join(output, 'static');
  const handler = apiHandler ?? createRequire(import.meta.url)(path.join(output, 'functions/api.func/index.cjs'));
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
  return http.createServer((req, res) => {
    const raw = (req.url || '/').split('?')[0];
    let pathname;
    try { pathname = path.posix.normalize(decodeURIComponent(raw).replaceAll('\\', '/')); }
    catch { res.writeHead(400); res.end(); return; }
    const serve = name => {
      const target = path.resolve(staticRoot, '.' + name);
      if (!target.startsWith(path.resolve(staticRoot) + path.sep)) return false;
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return false;
      if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; res.end(); return true; }
      res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
      res.setHeader('Content-Length', fs.statSync(target).size);
      if (req.method === 'HEAD') res.end(); else fs.createReadStream(target).pipe(res);
      return true;
    };
    for (const route of config.routes) {
      if (route.handle === 'filesystem') { if (serve(pathname === '/' ? '/index.html' : pathname)) return; continue; }
      if (route.methods && !route.methods.includes(req.method)) continue;
      if (!new RegExp(route.src, route.caseSensitive === false ? 'i' : '').test(pathname)) continue;
      for (const [name, value] of Object.entries(route.headers || {})) res.setHeader(name, value);
      if (route.continue) continue;
      if (route.status) { res.statusCode = route.status; res.end(); return; }
      if (route.dest === '/api') {
        // Preserve original pathname and query, as Vercel's Node request adapter does.
        Promise.resolve(handler(req, res)).catch(() => { if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' }); res.end('{"error":"Service unavailable"}'); });
        return;
      }
      if (route.dest && serve(route.dest)) return;
    }
    res.statusCode = 404; res.end();
  });
}
