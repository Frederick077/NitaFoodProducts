import crypto from 'node:crypto';
import { isIP } from 'node:net';
import type { Request, RequestHandler } from 'express';
import { logApiError } from './httpSecurity';

export interface RateLimitStore {
  shared: boolean;
  // Must atomically increment and set an expiry on the first increment.
  consume(key: string, windowMs: number): Promise<{ count: number; retryAfter: number }>;
}

// Development only. Never selected or accepted as sole protection in production.
export function developmentRateStore(now = Date.now): RateLimitStore {
  const counters = new Map<string, { count: number; expires: number }>();
  return { shared: false, async consume(key, windowMs) {
    const time = now();
    for (const [key, value] of counters) if (value.expires <= time) counters.delete(key);
    let counter = counters.get(key);
    if (!counter) {
      if (counters.size >= 10000) throw new Error('Rate store capacity reached');
      counter = { count: 0, expires: time + windowMs };
      counters.set(key, counter);
    }
    return { count: ++counter.count, retryAfter: Math.max(1, Math.ceil((counter.expires - time) / 1000)) };
  } };
}

function normalizeIp(value: string): string {
  value = value.toLowerCase();
  const ip = value.startsWith('::ffff:') && isIP(value.slice(7)) === 4 ? value.slice(7) : value;
  const family = isIP(ip);
  if (family === 4) return ip;
  if (family !== 6) return 'unknown';
  const [left, right] = ip.toLowerCase().split('::');
  const first = left ? left.split(':') : [];
  const last = right ? right.split(':') : [];
  const groups = right === undefined ? first : [...first, ...Array(8 - first.length - last.length).fill('0'), ...last];
  return groups.slice(0, 4).map(part => parseInt(part, 16).toString(16)).join(':') + '::/64';
}

export function rateLimitClient(req: Request, onVercel: boolean): string {
  // Only trust Vercel's overwritten client header inside its own runtime.
  // Generic forwarded headers are ignored on a directly reachable Node server.
  const value = onVercel ? req.headers['x-vercel-forwarded-for'] : req.socket.remoteAddress;
  return typeof value === 'string' ? normalizeIp(value.trim()) : 'unknown';
}

export function createApiRateLimits(options: { production: boolean; secret: string; onVercel?: boolean; store?: RateLimitStore }) {
  const store = options.store ?? (options.production ? undefined : developmentRateStore());
  const keyFor = (scope: string, identity: string) => 'nita:rate:' + crypto.createHmac('sha256', options.secret).update(scope + ':' + identity).digest('hex');
  const guard = (scope: string, limit: number, windowMs: number, telemetry = false): RequestHandler => async (req, res, next) => {
    try {
      if (!store || (options.production && !store.shared)) throw new Error('Shared rate protection unavailable');
      const identities = [keyFor(scope, rateLimitClient(req, options.onVercel === true))];
      if (scope === 'login' && typeof req.body?.email === 'string') identities.push(keyFor('login-account', req.body.email.trim().toLowerCase().slice(0, 254)));
      let retry = 0;
      for (const key of identities) {
        const result = await store.consume(key, windowMs);
        if (result.count > limit) { retry = result.retryAfter; break; }
      }
      if (telemetry) { res.locals.analyticsAllowed = retry === 0; next(); return; }
      if (retry) {
        res.setHeader('Retry-After', String(retry));
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return;
      }
      next();
    } catch (error) {
      if (telemetry) { res.locals.analyticsAllowed = false; next(); return; }
      logApiError('rate-limit.unavailable', error, res.locals.requestId);
      res.setHeader('Retry-After', '60');
      res.status(503).json({ error: 'This service is temporarily unavailable. Please try again later.' });
    }
  };
  return {
    login: guard('login', 10, 15 * 60000), contact: guard('contact', 5, 60 * 60000),
    orders: guard('orders', 10, 15 * 60000), analytics: guard('analytics', 60, 60000),
    productViews: guard('product-views', 60, 60000, true),
  };
}
