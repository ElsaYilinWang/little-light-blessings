// Owner-only CLI through authenticated Wrangler. Never expose an admin HTTP route.
import {randomBytes,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
const args=process.argv.slice(2),mode=args[0],remote=args.includes('--remote');
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const execute=sql=>JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','little-light',remote?'--remote':'--local','--json','--command',sql],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
if(mode==='issue'){
  const count=Number(option('--count',5)),credits=Number(option('--credits',3)),days=Number(option('--days',30));
  if(!Number.isInteger(count)||count<1||count>30||!Number.isInteger(credits)||credits<1||credits>100||!Number.isInteger(days)||days<1||days>90)throw new Error('Use 1–30 codes, 1–100 credits and 1–90 days.');
  const folder=resolve('.local-private'),out=resolve(option('--out',`.local-private/invitations-${Date.now()}.md`));
  if(relative(folder,out).startsWith('..')||out===folder)throw new Error('Codes must be saved inside the ignored .local-private folder.');
  const expiry=Math.floor(Date.now()/1000)+days*86400,rows=[];
  for(let i=0;i<count;i++){
    const digits=randomBytes(12).toString('hex').toUpperCase(),code=`LL-${digits.match(/.{4}/g).join('-')}`;
    const hash=createHash('sha256').update(`LL${digits}`).digest('hex');rows.push({code,hash});
  }
  execute(rows.map(({hash})=>`INSERT INTO invitations(code_hash,credits_total,credits_remaining,expires_at) VALUES('${hash}',${credits},${credits},${expiry});`).join('\n'));
  await mkdir(dirname(out),{recursive:true});
  await writeFile(out,`# Little Light invitations — keep private\n\nEach code has ${credits} gift-link credits. Drafting and downloads are free. Expires ${new Date(expiry*1000).toISOString()}.\n\nSend one code per tester by private message. Anyone holding a code can spend its remaining credits.\n\nWebsite: https://little-light-blessings.elsa-yilin-w39.workers.dev/\n\n`+rows.map(({code,hash},i)=>`## Invitation ${i+1}\n\nCode: ${code}\n\nAdmin hash for revocation: ${hash}\n`).join('\n'),{flag:'wx'});
  console.log(`Created ${count} invitations. Private codes saved to ${out}.`);
}else if(mode==='list'){
  console.log(JSON.stringify(execute('SELECT code_hash,credits_total,credits_remaining,expires_at,revoked FROM invitations ORDER BY expires_at DESC'),null,2));
}else if(mode==='revoke'){
  const hash=args[1];if(!/^[a-f0-9]{64}$/.test(hash||''))throw new Error('Provide the admin hash, never the raw invitation code.');
  execute(`UPDATE invitations SET revoked=1 WHERE code_hash='${hash}'; DELETE FROM invite_sessions WHERE invitation_hash='${hash}';`);console.log('Invitation revoked; its unspent credits and sessions are blocked.');
}else if(mode==='stats'){
  console.log(JSON.stringify(execute('SELECT day,event,count FROM metrics ORDER BY day DESC,event'),null,2));
}else throw new Error('Use issue, list, revoke HASH or stats; append --remote for production.');
