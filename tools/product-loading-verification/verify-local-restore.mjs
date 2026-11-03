import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

// Read-only verification of the owner's already-restored database. Never restores,
// creates, migrates or resets a database. No record values are written to evidence.
const file='C:/NitaBackups/nita-2026-10-29T16-06-37.225Z-yeHngS/nita-pre-publication.dump';
const evidence='artifacts/product-loading-verification/local-restore-verification.json';
const result={checkedAt:new Date().toISOString(),target:{host:'127.0.0.1',port:5432,database:'nita_restore_test_20261029'},originalRestoreExitStatus:'unavailable: restore performed by owner outside this session'};
const expected=JSON.parse(fs.readFileSync('artifacts/product-loading-verification/database-readonly.json','utf8'));
const protectedFields={
  Product:['id','categoryId','featuredImageUrl','featuredImagePublicId'],
  ProductVariant:['id','productId','price','compareAtPrice','stock'],
  ProductImage:['id','productId','imageUrl','storagePublicId'],
  Category:['id','name','slug'],
  Order:['id','productId','subtotal','total','quantity','orderNumber'],
  OrderItem:['id','orderId','productId','variantId','unitPrice','subtotal','quantity','imageUrl'],
};
const fingerprint=rows=>crypto.createHash('sha256').update(rows.sort().join('\n')+'\n').digest('hex');
const copyText=value=>value===null?'\\N':String(value).replaceAll('\\','\\\\').replaceAll('\b','\\b').replaceAll('\f','\\f').replaceAll('\n','\\n').replaceAll('\r','\\r').replaceAll('\t','\\t').replaceAll('\v','\\v');
try {
  const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(hash!=='e6227a8a53b73783546f52f5e6e065bd5acbd8d9a2ddc787942bdc08180bffee')throw new Error('BACKUP_HASH_CHANGED');
  const source=fs.readFileSync('tools/product-loading-verification/inspect-database-readonly.mjs','utf8');
  const queryNames=['session','tables','columns','enums','constraints','indexes'];
  const entries=queryNames.map(name=>{
    const match=source.match(new RegExp('const '+name+' = await tx\\.\\$queryRawUnsafe\\("([^"\\n]*(?:\\\\.[^"\\n]*)*)"\\)'));
    if(!match) throw new Error('METADATA_QUERY_NOT_FOUND');
    const sql=JSON.parse('"'+match[1]+'"');
    return `'${name}',(SELECT coalesce(json_agg(q),'[]'::json) FROM (${sql}) q)`;
  });
  entries.push("'ledger',(SELECT coalesce(json_agg(q),'[]'::json) FROM (SELECT migration_name,checksum,started_at,finished_at,rolled_back_at,applied_steps_count,(logs IS NOT NULL AND logs<>'') AS has_logs FROM public._prisma_migrations ORDER BY started_at) q)");
  for(const [table,fields] of Object.entries(protectedFields)) {
    entries.push(`'${table}',(SELECT coalesce(json_agg(q),'[]'::json) FROM (SELECT ${fields.map(f=>'"'+f+'"::text AS "'+f+'"').join(',')} FROM public."${table}" ORDER BY id) q)`);
  }
  const orphanQueries={
    variantProduct:'SELECT count(*) FROM public."ProductVariant" c LEFT JOIN public."Product" p ON p.id=c."productId" WHERE p.id IS NULL',
    imageProduct:'SELECT count(*) FROM public."ProductImage" c LEFT JOIN public."Product" p ON p.id=c."productId" WHERE p.id IS NULL',
    productCategory:'SELECT count(*) FROM public."Product" c LEFT JOIN public."Category" p ON p.id=c."categoryId" WHERE p.id IS NULL',
    orderItemOrder:'SELECT count(*) FROM public."OrderItem" c LEFT JOIN public."Order" p ON p.id=c."orderId" WHERE p.id IS NULL',
    orderItemProduct:'SELECT count(*) FROM public."OrderItem" c LEFT JOIN public."Product" p ON p.id=c."productId" WHERE c."productId" IS NOT NULL AND p.id IS NULL',
    orderItemVariant:'SELECT count(*) FROM public."OrderItem" c LEFT JOIN public."ProductVariant" p ON p.id=c."variantId" WHERE c."variantId" IS NOT NULL AND p.id IS NULL',
    orderProduct:'SELECT count(*) FROM public."Order" c LEFT JOIN public."Product" p ON p.id=c."productId" WHERE c."productId" IS NOT NULL AND p.id IS NULL',
  };
  entries.push("'orphans',json_build_object("+Object.entries(orphanQueries).map(([name,q])=>`'${name}',(${q})`).join(',')+')');
  const sql='BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\nSELECT json_build_object('+entries.join(',')+');\nROLLBACK;';
  const local=spawnSync('C:/Program Files/PostgreSQL/18/bin/psql.exe',['--host','127.0.0.1','--port','5432','--username','postgres','--dbname','nita_restore_test_20261029','--no-password','--no-psqlrc','--quiet','--tuples-only','--no-align','--set','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',maxBuffer:20*1024*1024,timeout:45000,env:{...process.env,PGCONNECT_TIMEOUT:'10',PGOPTIONS:'-c default_transaction_read_only=on -c timezone=UTC'}});
  if(local.status!==0)throw new Error(/no password supplied/i.test(local.stderr||'')?'LOCAL_PASSWORD_REQUIRED':'LOCAL_QUERY_FAILED_DETAILS_WITHHELD');
  const metadata=JSON.parse(local.stdout.trim());
  if(metadata.session[0].database!==result.target.database||metadata.session[0].transaction_read_only!=='on')throw new Error('LOCAL_TARGET_OR_READONLY_MISMATCH');
  result.structuralChecks={};
  for(const key of queryNames.filter(k=>k!=='session'))result.structuralChecks[key]=JSON.stringify(metadata[key])===JSON.stringify(expected.metadata[key]);
  const normalizeLedger=rows=>rows.map(r=>({...r,started_at:r.started_at?new Date(r.started_at).toISOString():null,finished_at:r.finished_at?new Date(r.finished_at).toISOString():null,rolled_back_at:r.rolled_back_at?new Date(r.rolled_back_at).toISOString():null}));
  result.ledgerMatches=JSON.stringify(normalizeLedger(metadata.ledger))===JSON.stringify(expected.metadata.ledgers[0].rows);
  result.orphanCounts=metadata.orphans;
  // Decode the archive to memory only. No database connection is passed to pg_restore.
  const archive=spawnSync('C:/Program Files/PostgreSQL/18/bin/pg_restore.exe',['--file=-',file],{encoding:'utf8',maxBuffer:20*1024*1024,timeout:45000,windowsHide:true});
  if(archive.status!==0)throw new Error('ARCHIVE_DECODE_FAILED');
  result.archiveDecodeExitCode=archive.status;
  result.protectedComparisons={};
  for(const [table,fields] of Object.entries(protectedFields)) {
    const escaped=table.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const block=archive.stdout.match(new RegExp('COPY public\\."?'+escaped+'"? \\(([^\\n]+)\\) FROM stdin;\\r?\\n([\\s\\S]*?)\\\\\\.\\r?\\n'));
    if(!block)throw new Error('ARCHIVE_COPY_BLOCK_MISSING');
    const columns=block[1].split(',').map(c=>c.trim().replaceAll('"',''));
    const indices=fields.map(f=>columns.indexOf(f));
    if(indices.includes(-1))throw new Error('ARCHIVE_COLUMN_MISSING');
    const archiveRows=block[2].split(/\r?\n/).filter(Boolean).map(row=>{const parts=row.split('\t');return indices.map(i=>parts[i]).join('\t');});
    const localRows=metadata[table].map(row=>fields.map(f=>copyText(row[f])).join('\t'));
    result.protectedComparisons[table]={count:localRows.length,archiveCount:archiveRows.length,fields,match:fingerprint(localRows)===fingerprint(archiveRows)};
  }
  const checks=[...Object.values(result.structuralChecks),result.ledgerMatches,...Object.values(result.orphanCounts).map(n=>n===0),...Object.values(result.protectedComparisons).map(c=>c.match)];
  result.status=checks.every(Boolean)?'PASS: isolated restore independently verified read-only against original backup':'FAILED: restore verification mismatch';
  if(!checks.every(Boolean))process.exitCode=1;
} catch(err) {
  result.status='BLOCKED';result.error=/^[A-Z_]+$/.test(err.message)?err.message:'ERROR_DETAILS_WITHHELD';process.exitCode=1;
} finally {
  fs.writeFileSync(evidence,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}
