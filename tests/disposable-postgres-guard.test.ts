import test from 'node:test';
import assert from 'node:assert/strict';
import {assertDisposableTarget, assertEmptyDisposableDatabase, type DisposableTarget} from './helpers/disposablePostgres';

// Synthetic URL strings only. No client, socket, database or real credentials.
const approved: DisposableTarget = {purpose:'nita-phase3c2-disposable',explicitlyApproved:true,runId:'12345678-1234-1234-1234-123456789abc',host:'127.0.0.1',port:55432,database:'nita_disposable_12345678',username:'fixture_runner'};
const valid = {environment:'test',targetUrl:'postgresql://fixture_runner:synthetic-only@127.0.0.1:55432/nita_disposable_12345678',approved,applicationUrls:['postgresql://application:other-synthetic-only@application.invalid:5432/business']};

test('disposable guard requires explicit approval, exact local target and distinct application configuration',()=>{
  const target=assertDisposableTarget(valid);assert.equal(target.database,approved.database);assert.equal(Object.hasOwn(target,'password'),false);
  for(const patch of [{environment:'production'},{environment:undefined},{applicationUrls:[]},{approved:{...approved,explicitlyApproved:false}},{approved:{...approved,runId:''}},{approved:{...approved,runId:'12345678----------------------------'}},{targetUrl:valid.targetUrl.replace('55432','5432')},{targetUrl:valid.targetUrl.replace('fixture_runner:','another_runner:')},{targetUrl:valid.targetUrl+'/other'},{targetUrl:valid.targetUrl+'?host=other.invalid'},{targetUrl:valid.targetUrl+'?options=unsafe'},{targetUrl:valid.targetUrl.replace('127.0.0.1','remote.neon.tech')}]) assert.throws(()=>assertDisposableTarget({...valid,...patch}),/No migration or write is authorized/);
});

test('same database with different credentials, reused credentials and remote approval are refused without disclosing URLs',()=>{
  for(const applicationUrls of [[valid.targetUrl.replace('synthetic-only','different')],[valid.targetUrl.replace('nita_disposable_12345678','other_database')],[valid.applicationUrls[0].replace('other-synthetic-only','synthetic-only')],[valid.applicationUrls[0].replace('application:', 'fixture%5frunner:')],[valid.applicationUrls[0].replace('other-synthetic-only','syn%74hetic-only')]]){
    assert.throws(()=>assertDisposableTarget({...valid,applicationUrls}),e=>{assert.ok(e instanceof Error);assert.equal(e.message.includes('postgresql:'),false);assert.equal(e.message.includes('synthetic-only'),false);return true;});
  }
  assert.throws(()=>assertDisposableTarget({...valid,approved:{...approved,host:'remote.neon.tech'}}));
  assert.throws(()=>assertDisposableTarget({...valid,targetUrl:'invalid URL'}));
});

test('read-only initial inspection must prove correct database/user and no unexpected relations or schemas',()=>{
  const target=assertDisposableTarget(valid),empty={database:target.database,username:target.username,userRelations:[],unexpectedSchemas:[]};
  assert.equal(assertEmptyDisposableDatabase(target,empty).initialState,'confirmed-empty');
  for(const patch of [{database:'another_database'},{username:'another_user'},{userRelations:['Product']},{userRelations:['_prisma_migrations']},{unexpectedSchemas:['business']}]) assert.throws(()=>assertEmptyDisposableDatabase(target,{...empty,...patch}));
});
