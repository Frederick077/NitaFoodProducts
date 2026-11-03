import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Explicitly authorized metadata inspection. Never import the application adapter.
const inherited = Boolean(process.env.DATABASE_URL);
dotenv.config({ quiet: true });
const output = path.resolve('artifacts/product-loading-verification/database-readonly.json');
const result = { inspectedAt: new Date().toISOString(), configurationSource: inherited ? 'inherited process environment (dotenv does not override)' : 'project .env via dotenv, matching application resolution', credentials: 'omitted' };
if (fs.existsSync('.env')) {
  const fileValue = dotenv.parse(fs.readFileSync('.env')).DATABASE_URL;
  if (fileValue) {
    const fileUrl = new URL(fileValue);
    result.projectFileTarget = { host: fileUrl.hostname, port: fileUrl.port || '5432', database: decodeURIComponent(fileUrl.pathname.slice(1)), schema: fileUrl.searchParams.get('schema') || 'public' };
    result.projectFileMatchesEffectiveUrl = fileValue === process.env.DATABASE_URL;
  }
}
let client;
try {
  const url = new URL(process.env.DATABASE_URL);
  result.configuredTarget = { host: url.hostname, port: url.port || '5432', database: decodeURIComponent(url.pathname.slice(1)), schema: url.searchParams.get('schema') || 'public' };
  client = new PrismaClient({ errorFormat: 'minimal', log: [] });
  result.metadata = await client.$transaction(async tx => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const session = await tx.$queryRawUnsafe("SELECT current_database() AS database, current_schema() AS schema, current_setting('transaction_read_only') AS transaction_read_only, current_setting('search_path') AS search_path, current_setting('server_version') AS server_version");
    if (session[0].transaction_read_only !== 'on') throw new Error('READ_ONLY_NOT_CONFIRMED');
    const tables = await tx.$queryRawUnsafe("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') AND table_type='BASE TABLE' ORDER BY table_schema, table_name");
    const columns = await tx.$queryRawUnsafe("SELECT table_schema, table_name, column_name, ordinal_position, data_type, udt_schema, udt_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name, ordinal_position");
    const enums = await tx.$queryRawUnsafe("SELECT n.nspname AS schema, t.typname AS name, e.enumlabel AS value, e.enumsortorder AS position FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY n.nspname,t.typname,e.enumsortorder");
    const constraints = await tx.$queryRawUnsafe("SELECT n.nspname AS schema, c.relname AS table_name, con.conname AS name, con.contype AS type, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY n.nspname,c.relname,con.conname");
    const indexes = await tx.$queryRawUnsafe("SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY schemaname,tablename,indexname");
    const ledgerTables = tables.filter(t => t.table_name === '_prisma_migrations');
    const ledgers = [];
    for (const t of ledgerTables) {
      const identifier = '"' + t.table_schema.replaceAll('"','""') + '"."_prisma_migrations"';
      const rows = await tx.$queryRawUnsafe(`SELECT migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count, (logs IS NOT NULL AND logs <> '') AS has_logs FROM ${identifier} ORDER BY started_at`);
      ledgers.push({ schema: t.table_schema, rows });
    }
    return { session, tables, columns, enums, constraints, indexes, ledgers };
  }, { maxWait: 10000, timeout: 45000 });
  result.localMigrations = fs.readdirSync('prisma/migrations', { withFileTypes: true }).filter(e => e.isDirectory()).map(e => {
    const file = path.join('prisma/migrations',e.name,'migration.sql');
    return { name: e.name, checksum: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') };
  });
  result.status = 'PASS: read-only metadata transaction completed';
} catch (err) {
  // Never serialize Prisma messages, connection strings, server logs or credentials.
  result.status = 'FAILED';
  const message = String(err?.message || '');
  const classification = /can't reach database server|cannot reach database server/i.test(message) ? 'database server unreachable' : /authentication failed/i.test(message) ? 'authentication failed' : /TLS|SSL|certificate/i.test(message) ? 'TLS/SSL connection failure' : /timed out|timeout/i.test(message) ? 'connection timeout' : 'initialization failure; raw message withheld';
  result.error = { type: err?.constructor?.name || 'Error', code: err?.errorCode || (typeof err?.code === 'string' ? err.code : null), classification };
  process.exitCode = 1;
} finally {
  if (client) await client.$disconnect();
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ status: result.status, evidence: output, error: result.error }));
}
