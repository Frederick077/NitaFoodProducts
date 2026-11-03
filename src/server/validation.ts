import type { RequestHandler } from 'express';

export class InputError extends Error {}

export function objectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => ['__proto__', 'constructor', 'prototype'].includes(key))) throw new InputError('Invalid request body.');
  return value as Record<string, unknown>;
}

export function textField(body: Record<string, unknown>, key: string, max: number, required = false): string {
  const value = body[key];
  if (value !== undefined && value !== null && typeof value !== 'string') throw new InputError(`Invalid ${key}.`);
  const text = typeof value === 'string' ? value.trim() : '';
  if ((required && !text) || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) throw new InputError(`Invalid ${key}.`);
  return text;
}

export const validEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export function emailField(body: Record<string, unknown>, required = false): string {
  const email = textField(body, 'email', 254, required);
  if (email && !validEmail(email)) throw new InputError('Invalid email.');
  return email;
}

export function contactInput(value: unknown) {
  const body = objectBody(value);
  return { name: textField(body, 'name', 120, true), email: emailField(body, true), phone: textField(body, 'phone', 40),
    subject: textField(body, 'subject', 160) || 'Website Contact Form', message: textField(body, 'message', 5000, true) };
}

export function orderCustomerInput(value: unknown) {
  const body = objectBody(value);
  return { customerName: textField(body, 'customerName', 120, true), phone: textField(body, 'phone', 40, true),
    email: emailField(body), address: textField(body, 'address', 2000), notes: textField(body, 'notes', 2000) };
}

export function analyticsInput(value: unknown): string {
  const body = objectBody(value);
  const path = textField(body, 'path', 2048, true);
  if (!path.startsWith('/') || path.startsWith('//') || /[\\\s]/.test(path)) throw new InputError('Invalid page path.');
  const pathname = path.split(/[?#]/, 1)[0];
  if (pathname.length > 512) throw new InputError('Invalid page path.');
  return pathname;
}

export function siteImageSection(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !['PRODUCTION', 'FACTORY', 'QUALITY_CERTIFICATIONS'].includes(value.toUpperCase())) throw new InputError('Invalid image section.');
  return value.toUpperCase();
}

export function imageRecordInput(value: unknown, kind: 'gallery' | 'site', partial = false) {
  const body = objectBody(value);
  const data: Record<string, unknown> = {};
  for (const [key, max] of Object.entries({ title: 200, description: 2000, altText: 300, storagePublicId: 300, image: 2048, imageUrl: 2048, category: 120 })) {
    if (body[key] !== undefined) data[key] = textField(body, key, max);
  }
  for (const key of ['image', 'imageUrl']) {
    const value = data[key];
    if (value) {
      if (typeof value !== 'string' || /[\\\s]/.test(value)) throw new InputError('Invalid image URL.');
      if (value.startsWith('/') && !value.startsWith('//')) continue;
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      } catch { throw new InputError('Invalid image URL.'); }
    }
  }
  if (!partial && !(data.image || data.imageUrl)) throw new InputError('An image URL is required.');
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') throw new InputError('Invalid image visibility.');
    data.enabled = body.enabled;
  }
  if (body.position !== undefined) {
    if (!Number.isSafeInteger(body.position) || (body.position as number) < 0 || (body.position as number) > 100000) throw new InputError('Invalid image position.');
    data.position = body.position;
  }
  if (kind === 'site') {
    if (body.section !== undefined) data.section = siteImageSection(body.section);
    if (!partial && !data.section) throw new InputError('An image section is required.');
  } else if (body.category !== undefined || !partial) {
    if (typeof data.category !== 'string' || !['Products', 'Packaging', 'Production Process', 'Company Events', 'Customers'].includes(data.category)) throw new InputError('Invalid photograph category.');
  }
  return data;
}

export function imageRecordValidation(kind: 'gallery' | 'site', partial = false): RequestHandler {
  return (req, _res, next) => {
    try { req.body = imageRecordInput(req.body, kind, partial); next(); } catch (error) { next(error); }
  };
}

export const reorderValidation: RequestHandler = (req, _res, next) => {
  try {
    const { items } = objectBody(req.body);
    if (!Array.isArray(items) || !items.length || items.length > 500) throw new InputError('Invalid image order.');
    const seen = new Set<string>();
    for (const item of items) {
      const row = objectBody(item);
      if (typeof row.id !== 'string' || !row.id || row.id.length > 200 || seen.has(row.id) ||
          !Number.isSafeInteger(row.position) || (row.position as number) < 0 || (row.position as number) > 100000) throw new InputError('Invalid image order.');
      seen.add(row.id);
    }
    next();
  } catch (error) { next(error); }
};
