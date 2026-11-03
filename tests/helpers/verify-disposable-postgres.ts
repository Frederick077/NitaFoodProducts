import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { assertProvisionedLocalTarget, assertLocalServerState } from './disposablePostgres';
import { inspectLocalPostgres } from './postgresInspection';

const directory = 'node_modules/.cache/nita-phase3c2/acceptance-run';
mkdirSync(directory, {recursive: true});
let client: PrismaClient | undefined;
let initialGatePassed = false;
try {
  const raw = process.env.NITA_TEST_DATABASE_URL || '';
  const target = assertProvisionedLocalTarget({environment: process.env.NODE_ENV, targetUrl: raw, ownerApproved: process.env.NITA_TEST_OWNER_APPROVED === 'true', runId: randomUUID()});
  client = new PrismaClient({datasources: {db: {url: raw}}, log: []});
  const observations = await inspectLocalPostgres(client);
  writeFileSync(`${directory}/identity.json`, JSON.stringify({target, observations}, null, 2));
  assertLocalServerState(observations, []);
  initialGatePassed = true;
  console.log('Full authenticated read-only isolation gate PASSED.');
  // Read-only runner only. Migration execution requires a separately reviewed runner.
} catch (error) {
  const code = typeof (error as any)?.code === 'string' && /^P\d{4}$/.test((error as any).code) ? (error as any).code : undefined;
  writeFileSync(`${directory}/stopped.json`, JSON.stringify({initialGatePassed, outcome: initialGatePassed ? 'PARTIALLY VERIFIED' : 'BLOCKED', code, blocker: 'Stopped at failed gate or acceptance stage; consult stage-results.json. No automatic retry or reset.'}, null, 2));
  console.log('Verification STOPPED. Sanitized stage evidence retained; no automatic retry or reset.');
  process.exitCode = 1;
} finally { await client?.$disconnect(); }
