import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api,digest} from '../src/worker.js';
import {normalizeCode,giftToken} from '../src/invitations.js';
import {seal} from '../public/crypto.js';
const origin='https://example.test',code='LL-ABCD-1234-ABCD-1234-ABCD-1234';
async function setup(credits=3){
  const db=new DatabaseSync(':memory:');
  for(const file of ['0001_initial.sql','0002_invitation_credits.sql'])db.exec(readFileSync(new URL(`../migrations/${file}`,import.meta.url),'utf8'));
  const hash=await digest(normalizeCode(code));db.prepare('INSERT INTO invitations VALUES(?,?,?,?,0)').run(hash,credits,credits,Math.floor(Date.now()/1000)+86400);
  const env={RATE_SALT:'test-only-secret',DB:{
    prepare(sql){
      return {bind(...values){return {
        async first(){return db.prepare(sql).get(...values)||null;},
        async run(){return db.prepare(sql).run(...values);}
      };}};
    }
  }};
  let cookie='';
  const post=async(path,data={},options={})=>{
    const response=await api(new Request(origin+path,{method:options.method||'POST',headers:{'Content-Type':'application/json',Origin:options.origin||origin,Cookie:options.guest?'':cookie,'CF-Connecting-IP':options.ip||'test'},body:options.method==='GET'?undefined:JSON.stringify(data)}),env);
    const set=response.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return response;
  };
  const login=()=>post('/api/invite',{code});
  return {db,hash,post,login,balance:()=>db.prepare('SELECT credits_remaining AS n FROM invitations').get().n};
}
test('invitation gate authenticates without names, spends no credit and uses secure functional cookie',async()=>{
  const x=await setup();
  assert.equal((await x.post('/api/share',{}, {guest:true})).status,401);
  assert.deepEqual(await (await x.post('/api/session')).json(),{active:false});
  assert.equal((await x.post('/api/invite',{code:'123456'})).status,403);
  assert.equal((await x.post('/api/invite',{code},{origin:'https://evil.test'})).status,403);
  const login=await x.login();assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
  assert.equal(x.balance(),3);assert.equal((await (await x.post('/api/session')).json()).remaining,3);
  assert.equal((await x.post('/api/event',{event:'created'})).status,200);assert.equal(x.balance(),3);
  assert.equal((await x.post('/api/event',{event:'created',code})).status,400);
  assert.equal((await x.post('/api/event',{event:'credit_spent'})).status,400);
  await x.post('/api/logout');assert.equal((await (await x.post('/api/session')).json()).active,false);
});
test('one credit creates one gift; retries and recipient opens are free and do not resurrect content',async()=>{
  const x=await setup();await x.login();
  const payload=(await seal({blessing:'Private message'})).payload,requestId='a'.repeat(32);
  const first=await (await x.post('/api/share',{payload,requestId})).json();assert.equal(x.balance(),2);
  const retry=await (await x.post('/api/share',{payload,requestId})).json();assert.equal(retry.token,first.token);assert.equal(x.balance(),2);
  assert.equal((await x.post('/api/redeem',{}, {method:'GET',guest:true})).status,405);
  const opens=await Promise.all([x.post('/api/redeem',{token:first.token},{guest:true}),x.post('/api/redeem',{token:first.token},{guest:true})]);
  assert.deepEqual(opens.map(r=>r.status).sort(),[200,410]);assert.equal(x.balance(),2);
  const after=await (await x.post('/api/share',{payload,requestId})).json();assert.equal(after.alreadyOpened,true);assert.equal(x.balance(),2);
  assert.equal(x.db.prepare('SELECT count(*) AS n FROM gifts').get().n,0);
  const changed=(await seal({blessing:'Changed'})).payload;
  assert.equal((await x.post('/api/share',{payload:changed,requestId})).status,409);
  const rows=x.db.prepare("SELECT event,count FROM metrics WHERE event IN ('share_created','credit_spent')").all();assert.equal(rows.length,2);assert.ok(rows.every(row=>row.count===1));
});
test('parallel sharing cannot overspend final credit; exhausted codes still allow drafts',async()=>{
  const x=await setup(1);await x.login();const payload=(await seal({title:'Sample'})).payload;
  const requests=await Promise.all(['b','c'].map(char=>x.post('/api/share',{payload,requestId:char.repeat(32)})));
  assert.deepEqual(requests.map(r=>r.status).sort(),[200,403]);assert.equal(x.balance(),0);
  assert.equal((await x.post('/api/event',{event:'created'})).status,200);
  assert.equal((await x.login()).status,200);assert.equal((await (await x.post('/api/session')).json()).remaining,0);
});
test('revocation, invitation expiry and session expiry block further spending; failed shares cost nothing',async()=>{
  const x=await setup();await x.login();
  assert.equal((await x.post('/api/share',{payload:'invalid',requestId:'d'.repeat(32)})).status,400);assert.equal(x.balance(),3);
  x.db.prepare('UPDATE invite_sessions SET expires_at=0').run();assert.equal((await (await x.post('/api/session')).json()).active,false);
  await x.login();x.db.prepare('UPDATE invitations SET revoked=1').run();assert.equal((await x.post('/api/share',{})).status,401);
  assert.equal((await x.login()).status,403);
  x.db.prepare('UPDATE invitations SET revoked=0,expires_at=0').run();assert.equal((await x.login()).status,403);
});
test('invitation guessing is rate limited; gift tokens are deterministic only within a delivery request',async()=>{
  const x=await setup();let status;
  for(let i=0;i<11;i++)status=(await x.post('/api/invite',{code:'123456'})).status;
  assert.equal(status,429);
  const a=await giftToken('secret','invite','a'),b=await giftToken('secret','invite','a'),c=await giftToken('secret','invite','b');
  assert.match(a,/^[a-f0-9]{64}$/);assert.equal(a,b);assert.notEqual(a,c);
});
