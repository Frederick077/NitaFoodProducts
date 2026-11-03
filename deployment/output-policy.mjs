import path from 'node:path';
import { productionSecurityHeaders } from './security-policy.mjs';

export const privatePathPattern = '^/(?:[^/]+/)*(?:\\.[^/]+|(?:node_modules|prisma|src|tools|tests|dist|build|deployment|artifacts)(?:/.*)?|[^/]+\\.(?:map|cjs|mjs|ts|tsx|sql|prisma|env|log|md|json|node|wasm))(?:/.*)?$';
const privatePath = new RegExp(privatePathPattern, 'i');
export function isPrivatePath(pathname) {
  try { return privatePath.test(path.posix.normalize(decodeURIComponent(pathname).replaceAll('\\', '/'))); }
  catch { return true; }
}

export const mediaExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf']);
export function isSourcePublicAsset(filename) {
  const pathname = '/' + filename.replaceAll('\\', '/');
  return !isPrivatePath(pathname) && (mediaExtensions.has(path.extname(filename).toLowerCase()) || filename === 'robots.txt' || filename === 'sitemap.xml');
}
export function isPublishedFile(filename) {
  const pathname = '/' + filename.replaceAll('\\', '/');
  if (isPrivatePath(pathname)) return false;
  return filename === 'index.html' || isSourcePublicAsset(filename) ||
    /^assets\/[^/]+-[a-zA-Z0-9_-]{8,}\.(?:js|css)$/.test(filename);
}

// API dispatch precedes both filesystem lookup and the SPA fallback.
// The provider invokes the function with the original pathname/query intact.
export const vercelOutputConfig = {
  version: 3,
  routes: [
    { src: '^/.*$', headers: productionSecurityHeaders, continue: true },
    { src: '^/api(?:/.*)?$', dest: '/api', caseSensitive: false },
    { src: privatePathPattern, status: 404, caseSensitive: false },
    { src: '^/assets/.*$', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
    { handle: 'filesystem' },
    { src: '^/(?:assets|images|uploads)(?:/.*)?$|^/.*\\.[^/]+$', status: 404, caseSensitive: false },
    { src: '^/.*$', methods: ['GET', 'HEAD'], dest: '/index.html' },
    { src: '^/.*$', status: 404 },
  ],
};

export const functionConfig = {
  runtime: 'nodejs24.x', handler: 'index.cjs', launcherType: 'Nodejs',
  shouldAddHelpers: false, shouldAddSourcemapSupport: false,
  supportsResponseStreaming: true, maxDuration: 30,
};
