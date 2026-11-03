import { validEmail } from './validation';
import { logApiError } from './httpSecurity';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from 'express';

interface AdminRecord { id: string; name: string; email: string; passwordHash: string }
export interface AuthenticationDatabase {
  admin: { findUnique(args: { where: { id: string } | { email: string } }): Promise<AdminRecord | null> };
}
interface AdminIdentity { id: string; name: string; email: string; role: 'Admin' }
interface TokenPayload extends AdminIdentity { exp: number }
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export function requireJwtSecret(value: unknown): string {
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') < 32 ||
      value.trim() !== value || /^(.)\1+$/.test(value) ||
      /^(?:nita-food-(?:secure-)?jwt-secret-key-2026|change[-_ ]?me.*|your[-_ ].*|.*placeholder.*)$/i.test(value)) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes and must not be a default or placeholder.');
  }
  return value;
}

// Preserve the existing two-part HMAC token format and millisecond expiry.
// Database access is injected so security tests never need application startup.
export function createAuthentication(configuredSecret: unknown, database: () => AuthenticationDatabase) {
  const secret = requireJwtSecret(configuredSecret);
  const generateToken = (admin: AdminIdentity) => {
    const payload: TokenPayload = { id: admin.id, name: admin.name, email: admin.email, role: 'Admin', exp: Date.now() + SESSION_DURATION_MS };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  };

  const verifyToken = (token: unknown): TokenPayload | null => {
    try {
      if (typeof token !== 'string' || token.length > 8192) return null;
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [body, signature] = parts;
      if (!body || !/^[a-f0-9]{64}$/.test(signature)) return null;
      const bytes = Buffer.from(body, 'base64');
      if (bytes.toString('base64') !== body) return null;
      const expected = crypto.createHmac('sha256', secret).update(body).digest();
      if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), expected)) return null;
      const payload = JSON.parse(bytes.toString('utf8'));
      if (!payload || Array.isArray(payload) || payload.role !== 'Admin' ||
          !['id', 'name', 'email'].every(key => typeof payload[key] === 'string' && payload[key].trim().length > 0) ||
          !Number.isSafeInteger(payload.exp) || payload.exp <= Date.now()) return null;
      return payload;
    } catch { return null; }
  };

  const login: RequestHandler = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || !validEmail(email.trim()) ||
        typeof password !== 'string' || !password || password.length > 1024) {
      res.status(400).json({ error: 'A valid email and password are required.' });
      return;
    }
    try {
      const admin = await database().admin.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!admin || !await bcrypt.compare(password, admin.passwordHash)) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }
      const user: AdminIdentity = { id: admin.id, name: admin.name, email: admin.email, role: 'Admin' };
      res.json({ token: generateToken(user), user });
    } catch (error) {
      logApiError('authentication.login', error, res.locals.requestId);
      res.status(503).json({ error: 'Authentication is temporarily unavailable. Please try again.' });
    }
  };

  const requireAuth: RequestHandler = async (req, res, next) => {
    const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
    const payload = match ? verifyToken(match[1]) : null;
    if (!payload) {
      res.status(401).json({ success: false, error: 'Your session is invalid or expired. Please log in again.' });
      return;
    }
    try {
      const admin = await database().admin.findUnique({ where: { id: payload.id } });
      if (!admin || admin.email !== payload.email) {
        res.status(401).json({ success: false, error: 'Your session is invalid or expired. Please log in again.' });
        return;
      }
      (req as typeof req & { user: AdminIdentity }).user = { id: admin.id, name: admin.name, email: admin.email, role: 'Admin' };
    } catch (error) {
      logApiError('authentication.authorize', error, res.locals.requestId);
      res.status(503).json({ success: false, error: 'Authentication is temporarily unavailable. Please try again.' });
      return;
    }
    next();
  };

  return { generateToken, verifyToken, login, requireAuth };
}
