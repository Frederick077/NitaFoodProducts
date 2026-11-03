import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import dotenv from 'dotenv';
dotenv.config({quiet:true});
const original='C:/NitaBackups/nita-2026-10-29T16-06-37.225Z-yeHngS/nita-pre-publication.dump';
const file=process.argv.includes('--latest-backup')?JSON.parse(fs.readFileSync('artifacts/product-loading-verification/database-backup-integrity.json','utf8')).file:original;
const result={checkedAt:new Date().toISOString(),archive:file};
const evidence=process.argv.includes('--post-migration')?'artifacts/product-loading-verification/post-migration-record-comparison.json':'artifacts/product-loading-verification/live-recovery-point-comparison.json';
try {
 const url=new URL(process.env.DATABASE_URL);
 if(url.hostname!=='ep-dry-wind-axm517bt.c-4.us-east-2.aws.neon.tech'||decodeURIComponent(url.pathname.slice(1))!=='neondb'||(url.searchParams.get('schema')||'public')!=='public')throw new Error('TARGET_MISMATCH');
 result.archiveSha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(file===original&&result.archiveSha256!=='e6227a8a53b73783546f52f5e6e065bd5acbd8d9a2ddc787942bdc08180bffee')throw new Error('ORIGINAL_BACKUP_HASH_CHANGED');
 const archive=spawnSync('C:/Program Files/PostgreSQL/18/bin/pg_restore.exe',['--file=-',file],{encoding:'utf8',maxBuffer:64*1024*1024,timeout:60000,windowsHide:true});
 if(archive.status!==0)throw new Error('ARCHIVE_DECODE_FAILED');
 const blocks=[...archive.stdout.matchAll(/COPY public\.((?:"[^"]+")|\w+) \(([^\n]+)\) FROM stdin;\r?\n([\s\S]*?)\\\.\r?\n/g)].map(m=>({table:m[1].replaceAll('"',''),identifier:m[1],columns:m[2],rows:m[3].split(/\r?\n/).filter(Boolean)})).filter(t=>t.table!=='_prisma_migrations');
 if(blocks.length!==11)throw new Error('UNEXPECTED_TABLE_SET');
 // Keep all row data in memory only. Markers separate COPY TO stdout sections.
 const sql='BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\n'+blocks.map((t,i)=>'\\echo NITA_BEGIN_'+i+'\nCOPY (SELECT '+t.columns+' FROM public.'+t.identifier+') TO STDOUT;\n\\echo NITA_END_'+i).join('\n')+'\nROLLBACK;\n';
 const env={...process.env,PGHOST:url.hostname,PGPORT:url.port||'5432',PGDATABASE:'neondb',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGSSLMODE:url.searchParams.get('sslmode')||'require',PGCONNECT_TIMEOUT:'20',PGOPTIONS:'-c default_transaction_read_only=on -c timezone=UTC -c datestyle=ISO -c statement_timeout=60000'};
 const live=spawnSync('C:/Program Files/PostgreSQL/18/bin/psql.exe',['--no-password','--no-psqlrc','--quiet','--set','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',maxBuffer:64*1024*1024,timeout:90000,env,windowsHide:true});
 if(live.status!==0)throw new Error('LIVE_READONLY_COMPARISON_FAILED');
 const hash=rows=>crypto.createHash('sha256').update(rows.sort().join('\n')+'\n').digest('hex');
 result.tables=blocks.map((t,i)=>{
  const m=live.stdout.match(new RegExp('NITA_BEGIN_'+i+'\\r?\\n([\\s\\S]*?)NITA_END_'+i+'(?:\\r?\\n|$)'));
  if(!m)throw new Error('COMPARISON_SECTION_MISSING');
  const rows=m[1].split(/\r?\n/).filter(Boolean);
  return {table:t.table,archiveCount:t.rows.length,liveCount:rows.length,allOriginalColumnValuesMatch:hash(rows)===hash(t.rows)};
 });
 result.allRecordsMatch=result.tables.every(t=>t.allOriginalColumnValuesMatch);
 result.status='PASS: read-only whole-row comparison completed; inspect allRecordsMatch';
}catch(e){result.status='FAILED';result.error=/^[A-Z_]+$/.test(e.message)?e.message:'DETAILS_WITHHELD';process.exitCode=1;}
fs.writeFileSync(evidence,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
