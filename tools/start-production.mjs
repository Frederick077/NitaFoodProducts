import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { isPrivatePath } from '../deployment/output-policy.mjs';
import { productionSecurityHeaders } from '../deployment/security-policy.mjs';

// Local standalone production runner; Vercel invokes api.func directly.
process.env.NODE_ENV = 'production';
const root = fileURLToPath(new URL('../', import.meta.url));
const handler = createRequire(import.meta.url)(path.join(root, 'dist/server/app.cjs'));
const app = express();
app.disable('x-powered-by');
app.use((_req, res, next) => { res.set(productionSecurityHeaders); next(); });
app.use((req, res, next) => /^\/api(?:\/|$)/i.test(req.path) ? handler(req, res) : next());
const client = path.join(root, 'dist/client');
app.use((req, res, next) => isPrivatePath(req.path) ? res.status(404).end() : next());
app.use(express.static(client, { dotfiles: 'deny', index: false }));
app.get('*', (req, res) => {
  if (/\.[^/]+$/.test(req.path) || /^\/(assets|images|uploads)(\/|$)/i.test(req.path)) { res.status(404).end(); return; }
  res.sendFile(path.join(client, 'index.html'));
});
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`[Server] Standalone production server listening on port ${port}.`));
