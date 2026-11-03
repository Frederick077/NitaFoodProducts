import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Prisma } from '@prisma/client';
import * as authentication from '../../src/server/auth';
import * as httpSecurity from '../../src/server/httpSecurity';
import * as validation from '../../src/server/validation';
import * as rateLimits from '../../src/server/rateLimits';
import * as uploadPolicy from '../../src/uploadPolicy';
import * as uploadValidation from '../../src/server/uploadValidation';
import * as checkout from '../../src/server/checkout';
import { productReadRoutes } from '../../src/server/productReads';

const secret = 'isolated-api-security-secret-32-bytes';
export const fixturePassword = 'isolated-api-password';
const admin = { id: 'admin-fixture', name: 'Fixture Admin', email: 'admin@example.invalid', passwordHash: bcrypt.hashSync(fixturePassword, 4) };
const variant = { id: 'v1', name: '250g', size: '250g', price: 12000, available: true };
const product = { id: 'p1', slug: 'fixture-seeds', name: 'Fixture seeds', category: { name: 'Seeds' }, categoryId: 'c1', available: true, publicationStatus: 'PUBLISHED', featuredImageUrl: '/images/headers/contact-phone-notepad-communication.jpg', variants: [variant], images: [] };

export async function apiFixture(options: { store?: rateLimits.RateLimitStore; missingStore?: boolean; storageUnavailable?: boolean; serveFrontend?: boolean } = {}) {
  const writes = { messages: [] as any[], orders: [] as any[], analytics: [] as any[], uploads: 0, other: 0 };
  const state = { fail: false };
  const maybeFail = () => { if (state.fail) throw new Error('postgresql://private:secret@internal/customer-personal-data'); };
  const gallery = [{ id: 'visible', enabled: true, imageUrl: '/images/headers/contact-phone-notepad-communication.jpg', category: 'Products' }, { id: 'hidden', enabled: false, imageUrl: '/private.png', category: 'Products' }];
  const database: any = {
    admin: { findUnique: async ({ where }: any) => { maybeFail(); return where.id === admin.id || where.email === admin.email ? admin : null; } },
    message: { create: async ({ data }: any) => { maybeFail(); writes.messages.push(data); return { id: 'm1', ...data }; }, findMany: async () => [] },
    analyticsEvent: { create: async ({ data }: any) => { maybeFail(); writes.analytics.push(data); return { id: 'a1', ...data }; } },
    product: { findUnique: async ({ where }: any) => { maybeFail(); return where.id === product.id || where.slug === product.slug ? product : null; }, findMany: async () => { maybeFail(); return [product]; } },
    order: { create: async ({ data }: any) => { maybeFail(); writes.orders.push(data); return { id: 'o1', ...data }; } },
    galleryItem: { findMany: async ({ where }: any = {}) => { maybeFail(); return gallery.filter(g => where?.enabled === undefined || g.enabled === where.enabled); }, create: async () => { writes.other++; return {}; } },
    siteImage: { findMany: async () => { maybeFail(); return []; }, create: async () => { writes.other++; return {}; } },
    $transaction: async (run: any) => run(database),
  };
  const app = express();
  const listen = app.listen.bind(app);
  // The entry point gets a fake listener; only this fixture binds an ephemeral local port.
  app.listen = (() => undefined) as any;
  const fakeExpress = Object.assign(() => app, express);
  const store = options.missingStore ? undefined : options.store ?? { ...rateLimits.developmentRateStore(), shared: true };
  const noop = () => {};
  const imports: Record<string, unknown> = {
    express: fakeExpress, path, multer, vite: { createServer: async () => ({ middlewares: noop }) }, '@prisma/client': { Prisma },
    './src/server/auth': authentication, './src/server/httpSecurity': httpSecurity, './src/server/validation': validation,
    './src/server/rateLimits': rateLimits, './src/uploadPolicy': uploadPolicy, './src/server/uploadValidation': uploadValidation,
    './src/server/redisRateStore': { configuredRateStore: () => store },
    './src/lib/prisma': { prisma: database, requireDatabase: () => database },
    './src/server/productReads': { productReadRoutes },
    './src/server/productWrites': { productWriteRoutes: () => (_req: unknown, _res: unknown, next: () => void) => next() },
    './src/server/productMedia': { productMediaRoutes: () => (_req: unknown, _res: unknown, next: () => void) => next() },
    './src/server/categories': { categoryRoutes: () => (_req: unknown, _res: unknown, next: () => void) => next() },
    './src/server/productImages': { retainMediaForReview: async () => false }, './src/server/checkout': checkout,
    './src/server/imageStorage': { uploadImageFile: async () => { if (options.storageUnavailable) throw new Error('private cloud provider failure'); writes.uploads++; return { imageUrl: '/fixture.png', publicId: 'fixture', provider: 'fixture' }; }, isCloudinaryConfigured: () => true, validateCloudinaryConfig: noop },
  };
  const source = readFileSync(new URL('../../server.ts', import.meta.url), 'utf8');
  runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports: {}, Buffer, console,
    process: { env: { NODE_ENV: 'production', JWT_SECRET: secret }, cwd: () => process.cwd() },
    require: (name: string) => { if (!(name in imports)) throw Error('Unexpected fixture import: ' + name); return imports[name]; },
  });
  if (options.serveFrontend !== false) {
    app.use(express.static(path.resolve('dist/client'), { dotfiles: 'deny' }));
    app.get('*', (_req, res) => res.sendFile(path.resolve('dist/client/index.html')));
  }
  const server = listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const auth = authentication.createAuthentication(secret, () => database);
  return {
    app, database, writes, state, base: `http://127.0.0.1:${(server.address() as any).port}`,
    authorization: 'Bearer ' + auth.generateToken({ ...admin, role: 'Admin' }),
    close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}
