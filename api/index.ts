import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Request, Response } from 'express';
import { productionSecurityHeaders } from '../deployment/security-policy.mjs';
import { logApiError } from '../src/server/httpSecurity';

// No listener, body pre-parser or public/static serving in the function.
let application: Promise<typeof import('../server')['default']> | undefined;
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    application ??= import('../server').then(module => module.default);
    const app = await application;
    app(req as Request, res as Response);
  } catch (error) {
    logApiError('api.initialization', error);
    if (res.headersSent) { res.end(); return; }
    for (const [name, value] of Object.entries(productionSecurityHeaders)) res.setHeader(name, value);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 503;
    res.end(JSON.stringify({ success: false, error: 'The service is temporarily unavailable.' }));
  }
}
