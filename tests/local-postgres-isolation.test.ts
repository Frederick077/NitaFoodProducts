import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { assertProvisionedLocalTarget, assertLocalServerState, type ServerObservation } from './helpers/disposablePostgres';

const target = {environment:'test',targetUrl:'postgresql://nita_test_user:synthetic-only@127.0.0.1:5432/nita_migration_test',ownerApproved:true,runId:'12345678-1234-1234-1234-123456789abc'};
const empty: ServerObservation = {
  identity:[{database:'nita_migration_test',username:'nita_test_user',owner:'nita_test_user',address:'127.0.0.1',port:5432,version:'18.6'}],
  roles:[{rolcanlogin:true,rolsuper:false,rolcreatedb:false,rolcreaterole:false,rolinherit:false,rolreplication:false,rolbypassrls:false}],
  memberships:[],privileges:[{connect:true,create_schema:true,usage:true,create_objects:true}],relations:[],schemas:[],
};

test('owner-provisioned mode accepts only the exact approved local test identity',()=>{
  assert.equal(assertProvisionedLocalTarget(target).database,'nita_migration_test');
  for (const patch of [{environment:'production'},{ownerApproved:false},{runId:''},{targetUrl:target.targetUrl.replace('127.0.0.1','remote.neon.tech')},{targetUrl:target.targetUrl+'?host=other'},{targetUrl:target.targetUrl.replace('5432','5433')},{targetUrl:target.targetUrl.replace('nita_migration_test','business')},{targetUrl:target.targetUrl.replace('nita_test_user','postgres')}]) assert.throws(()=>assertProvisionedLocalTarget({...target,...patch}));
});

test('actual server observation must match ownership, restricted role, privileges and stage tables',()=>{
  assert.equal(assertLocalServerState(empty,[]).isolation,'confirmed');
  for (const alter of [
    (o:ServerObservation)=>{o.identity[0].owner='postgres';},
    (o:ServerObservation)=>{o.identity[0].address='192.0.2.1';},
    (o:ServerObservation)=>{o.identity[0].database='other';},
    (o:ServerObservation)=>{o.roles[0].rolinherit=true;},
    (o:ServerObservation)=>{o.roles[0].rolsuper=true;},
    (o:ServerObservation)=>{o.memberships.push({roleid:'1'});},
    (o:ServerObservation)=>{o.privileges[0].create_objects=false;},
    (o:ServerObservation)=>{o.schemas.push({nspname:'business'});},
    (o:ServerObservation)=>{o.relations.push({nspname:'public',relname:'Product',relkind:'r',owner:'nita_test_user'});},
  ]) { const observation=structuredClone(empty);alter(observation);assert.throws(()=>assertLocalServerState(observation,[])); }
  const stage=structuredClone(empty);
  stage.relations.push({nspname:'public',relname:'Product',relkind:'r',owner:'nita_test_user'});
  assert.equal(assertLocalServerState(stage,['Product']).isolation,'confirmed');
  assert.throws(()=>assertLocalServerState(stage,['Product','_prisma_migrations']));
  stage.relations[0].owner='postgres';assert.throws(()=>assertLocalServerState(stage,['Product']));
});

test('preload blocks environment-file content access before Prisma import without opening a connection',()=>{
  const script = `
    const assert=require('node:assert/strict');
    const fs=require('node:fs');
    assert.equal(fs.existsSync('.env'),false);
    assert.throws(()=>fs.readFileSync('.env'),{code:'NITA_ENV_ACCESS_REFUSED'});
    assert.throws(()=>fs.openSync('.env.local','r'),{code:'NITA_ENV_ACCESS_REFUSED'});
    fs.promises.readFile('.env').then(()=>process.exit(3),async error=>{
      assert.equal(error.code,'NITA_ENV_ACCESS_REFUSED');
      const {PrismaClient}=require('@prisma/client');
      const db=new PrismaClient({datasources:{db:{url:'postgresql://fixture:synthetic@127.0.0.1:1/fixture'}}});
      await db.$disconnect();
    }).catch(()=>process.exit(4));
  `;
  const env: Record<string,string> = {};
  for (const key of ['SystemRoot','WINDIR','TEMP','TMP','PATH','PATHEXT','USERPROFILE']) if(process.env[key]) env[key]=process.env[key]!;
  const result=spawnSync(process.execPath,['--require',resolve('tests/helpers/block-environment-files.cjs'),'-e',script],{env,encoding:'utf8',timeout:15000});
  assert.equal(result.status,0,'Preload verification failed; child output intentionally withheld.');
});
