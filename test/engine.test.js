import {test} from 'node:test';
import assert from 'node:assert/strict';
import {templateProvider,faiths,tones,presets} from '../public/engine.js';
import {seal,unseal} from '../public/crypto.js';
import {webcrypto} from 'node:crypto';
if (!globalThis.crypto) Object.defineProperty(globalThis,'crypto',{value:webcrypto});
test('all 40 preset/faith/tone combinations produce editable, script-free results',async()=>{
  for(const preset of presets)for(const faith of faiths)for(const tone of tones){
    const value=await templateProvider.generate({preset,faith,tone,recipient:'A & B',detail:'Our weekends together.',sender:'C'});
    assert.match(value.blessing,/Dear A & B/);assert.match(value.blessing,/Our weekends together\./);assert.equal(value.script,'');assert.ok(value.title);assert.ok(value.theme);assert.ok(value.keepsake);
  }
});
test('rejects scope expansion and generates scripts only through explicit method',async()=>{
  await assert.rejects(templateProvider.generate({preset:'wedding',faith:'Universal',tone:'Warm'}));
  const input={preset:'thinking',faith:'Universal',tone:'Minimal'};
  const value=await templateProvider.generate(input);value.blessing='My edited message';
  assert.match(await templateProvider.script(input,value),/My edited message/);
});
test('encryption roundtrip, wrong key and tampered ciphertext',async()=>{
  const first=await seal({blessing:'Private words',script:'Private script'}),second=await seal({});
  assert.deepEqual(await unseal(first.payload,first.key),{blessing:'Private words',script:'Private script'});
  assert.ok(!first.payload.includes('Private'));
  await assert.rejects(unseal(first.payload,second.key));
  const [iv,cipher]=first.payload.split('.');
  await assert.rejects(unseal(`${iv}.${cipher[0]==='A'?'B':'A'}${cipher.slice(1)}`,first.key));
});
