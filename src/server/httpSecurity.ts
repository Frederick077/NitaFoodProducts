import { commonSecurityHeaders, productionSecurityHeaders } from '../../deployment/security-policy.mjs';
export { productionCsp } from '../../deployment/security-policy.mjs';
import crypto from 'node:crypto';
import path from 'node:path';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { InputError, objectBody } from './validation';

export function securityHeaders(production: boolean): RequestHandler {
  return (req, res, next) => {
    res.removeHeader('X-Powered-By');
    for (const [name, value] of Object.entries(production ? productionSecurityHeaders : commonSecurityHeaders)) res.setHeader(name, value);
    const filename = path.posix.basename(path.posix.normalize(decodeURIComponent(req.path).replace(/\\/g, '/'))).toLowerCase();
    if (filename === 'server.cjs' || filename === 'server.cjs.map') { res.status(404).end(); return; }
    if (req.path.toLowerCase() === '/api' || req.path.toLowerCase().startsWith('/api/')) {
      res.locals.requestId = crypto.randomUUID();
      res.setHeader('X-Request-ID', res.locals.requestId);
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  };
}

const parsers = Object.fromEntries([2048, 4096, 16384, 65536, 262144].map(limit => [limit, express.json({ limit, strict: true, inflate: false })]));
export const apiBodyParser: RequestHandler = (req, res, next) => {
  const path = req.path.toLowerCase().replace(/\/+$/, '');
  if (!path.startsWith('/api/') || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (path === '/api/admin/images/upload') return next(); // bounded, authenticated multipart parser
  const empty = !req.headers['transfer-encoding'] && (!req.headers['content-length'] || req.headers['content-length'] === '0');
  if (req.method === 'DELETE' && empty) return next();
  if (!req.is('application/json')) { res.status(415).json({ error: 'Use application/json for this request.' }); return; }
  const limit = path === '/api/auth/login' ? 4096 : path === '/api/messages' ? 16384 :
    path === '/api/analytics/visit' ? 2048 : path === '/api/orders' ? 65536 : 262144;
  parsers[limit](req, res, error => {
    if (error) return next(error);
    try { req.body = objectBody(req.body); next(); } catch (error) { next(error); }
  });
};

// Deliberately exclude messages, stacks, SQL, URLs, headers and customer input.
export function logApiError(operation: string, error: unknown, requestId?: string) {
  const candidate = (error as { code?: unknown } | null)?.code;
  const code = typeof candidate === 'string' && /^(P\d{4}|ECONNRESET|ECONNREFUSED|ETIMEDOUT)$/.test(candidate) ? candidate : 'UNEXPECTED';
  console.error('[API]', JSON.stringify({ operation, code, ...(requestId ? { requestId } : {}) }));
}

export const apiErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (!(req.path.toLowerCase() === '/api' || req.path.toLowerCase().startsWith('/api/'))) return next(error);
  if (res.headersSent) return next(error);
  const type = error?.type;
  const status = error instanceof InputError || type === 'entity.parse.failed' || error instanceof URIError ? 400 :
    type === 'entity.too.large' ? 413 : type === 'encoding.unsupported' || type === 'charset.unsupported' ? 415 : 500;
  const message = error instanceof InputError ? error.message : status === 400 ? 'Malformed request.' :
    status === 413 ? 'Request body is too large.' : status === 415 ? 'Unsupported request encoding.' : 'The request could not be completed.';
  if (status >= 500) logApiError('request.failed', error, res.locals.requestId);
  res.status(status).json({ success: false, error: message, ...(res.locals.requestId ? { requestId: res.locals.requestId } : {}) });
};
