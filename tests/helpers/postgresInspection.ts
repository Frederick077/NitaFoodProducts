import type { PrismaClient } from '@prisma/client';
import type { ServerObservation } from './disposablePostgres';

export async function inspectLocalPostgres(client: PrismaClient): Promise<ServerObservation> {
  return client.$transaction(async tx => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const identity = await tx.$queryRawUnsafe<ServerObservation['identity']>(`SELECT current_database() AS database, current_user AS username, host(inet_server_addr()) AS address, inet_server_port() AS port, current_setting('server_version') AS version, pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname=current_database()`);
    const roles = await tx.$queryRawUnsafe<ServerObservation['roles']>(`SELECT rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolinherit, rolreplication, rolbypassrls FROM pg_roles WHERE rolname=current_user`);
    const memberships = await tx.$queryRawUnsafe<unknown[]>(`SELECT roleid::text FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname=current_user)`);
    const privileges = await tx.$queryRawUnsafe<ServerObservation['privileges']>(`SELECT has_database_privilege(current_user,current_database(),'CONNECT') AS connect, has_database_privilege(current_user,current_database(),'CREATE') AS create_schema, has_schema_privilege(current_user,'public','USAGE') AS usage, has_schema_privilege(current_user,'public','CREATE') AS create_objects`);
    const relations = await tx.$queryRawUnsafe<ServerObservation['relations']>(`SELECT n.nspname,c.relname,c.relkind,pg_get_userbyid(c.relowner) AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE left(n.nspname,3)<>'pg_' AND n.nspname<>'information_schema' AND c.relkind IN ('r','p','v','m','S','f')`);
    const schemas = await tx.$queryRawUnsafe<unknown[]>(`SELECT nspname FROM pg_namespace WHERE left(nspname,3)<>'pg_' AND nspname NOT IN ('public','information_schema')`);
    return {identity, roles, memberships, privileges, relations, schemas};
  });
}
