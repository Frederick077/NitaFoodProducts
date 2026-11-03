/** Test infrastructure only. Never imports dotenv, Prisma or application startup. */
export interface DisposableTarget {
  purpose: 'nita-phase3c2-disposable';
  explicitlyApproved: boolean;
  runId: string;
  host: string;
  port: number;
  database: string;
  username: string;
}

const refuse = (): never => { throw new Error('Disposable PostgreSQL safety check failed. No migration or write is authorized.'); };
const parse = (value: string) => {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hash) return refuse();
    return url;
  } catch { return refuse(); }
};
const decode = (value: string) => { try { return decodeURIComponent(value); } catch { return refuse(); } };
const identity = (url: URL) => [url.hostname.toLowerCase(), Number(url.port || 5432), decode(url.pathname.slice(1))].join('|');

/** Owner-provisioned local-only mode: never reads production settings.
 * Dedicated credentials are owner-attested test-only; server proofs are mandatory.
 * The older application-URL comparison mode remains unchanged.
 */
export function assertProvisionedLocalTarget(input: {
  environment: string | undefined; targetUrl: string; ownerApproved: boolean; runId: string;
}) {
  const target = parse(input.targetUrl);
  if (input.environment !== 'test' || input.ownerApproved !== true || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.runId) || target.protocol !== 'postgresql:' || target.hostname !== '127.0.0.1' || target.port !== '5432' || target.pathname !== '/nita_migration_test' || target.username !== 'nita_test_user' || !target.password || target.search || target.hash) refuse();
  return Object.freeze({runId: input.runId, host: '127.0.0.1', port: 5432, database: 'nita_migration_test', username: 'nita_test_user'});
}

export interface ServerObservation {
  identity: {database: string; username: string; address: string; port: number; version: string; owner: string}[];
  roles: Record<string, boolean>[];
  memberships: unknown[];
  privileges: Record<string, boolean>[];
  relations: {nspname: string; relname: string; relkind: string; owner: string}[];
  schemas: unknown[];
}

/** Repeated before migration stages. Relations must be the exact run-owned set. */
export function assertLocalServerState(observed: ServerObservation, expectedTables: readonly string[]) {
  const i = observed.identity[0], r = observed.roles[0];
  if (observed.identity.length !== 1 || i.database !== 'nita_migration_test' || i.username !== 'nita_test_user' || i.owner !== 'nita_test_user' || i.address !== '127.0.0.1' || i.port !== 5432 || observed.roles.length !== 1 || r?.rolcanlogin !== true || !['rolsuper','rolcreatedb','rolcreaterole','rolinherit','rolreplication','rolbypassrls'].every(k => r[k] === false) || observed.memberships.length || observed.privileges.length !== 1 || Object.keys(observed.privileges[0]).length !== 4 || !Object.values(observed.privileges[0]).every(v => v === true) || observed.schemas.length) refuse();
  if (observed.relations.some(row => row.nspname !== 'public' || row.relkind !== 'r' || row.owner !== 'nita_test_user') || JSON.stringify(observed.relations.map(r => r.relname).sort()) !== JSON.stringify([...expectedTables].sort())) refuse();
  return Object.freeze({database: i.database, username: i.username, expectedTables: [...expectedTables].sort(), isolation: 'confirmed' as const});
}

export function assertDisposableTarget(input: {
  environment: string | undefined;
  targetUrl: string;
  approved: DisposableTarget;
  applicationUrls: readonly string[];
}) {
  const {approved} = input;
  if (input.environment !== 'test' || approved?.purpose !== 'nita-phase3c2-disposable' || approved.explicitlyApproved !== true || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(approved.runId) || !input.applicationUrls.length) refuse();
  // This harness intentionally supports local infrastructure only. A remote/cloud
  // database needs a separately reviewed explicit configuration; never a Neon fallback.
  if (!['127.0.0.1', '[::1]'].includes(approved.host) || !Number.isSafeInteger(approved.port) || approved.port < 1 || approved.port > 65535) refuse();
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(approved.database) || !/^[a-z][a-z0-9_]{0,62}$/.test(approved.username)) refuse();
  const target = parse(input.targetUrl);
  if (target.hostname !== approved.host || Number(target.port || 5432) !== approved.port || decode(target.pathname.slice(1)) !== approved.database || decode(target.username) !== approved.username || !target.password) refuse();
  // Query parameters can reroute a connection (host/service/options); reject all
  // rather than letting the apparent URL allowlist hide an alternate destination.
  if (target.search) refuse();
  for (const value of input.applicationUrls) {
    const application = parse(value);
    if (identity(target) === identity(application) || decode(target.username) === decode(application.username) || decode(target.password) === decode(application.password)) refuse();
  }
  return Object.freeze({runId: approved.runId, host: approved.host, port: approved.port, database: approved.database, username: approved.username});
}

/** Supply results of read-only current_database/current_user/catalog inspection,
 * before any migration, marker creation, fixture INSERT or other database write.
 * A pre-existing schema/table is refused, even if someone calls the database test.
 */
export function assertEmptyDisposableDatabase(
  target: ReturnType<typeof assertDisposableTarget>,
  observed: {database: string; username: string; userRelations: readonly string[]; unexpectedSchemas: readonly string[]},
) {
  if (observed.database !== target.database || observed.username !== target.username || observed.userRelations.length || observed.unexpectedSchemas.length) refuse();
  return Object.freeze({...target, initialState: 'confirmed-empty' as const});
}
