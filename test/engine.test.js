import {test} from 'node:test';
import assert from 'node:assert/strict';
import {templateProvider,faiths,tones,presets,keywords} from '../public/engine.js';
import {publicCard} from '../public/sharing.js';
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
test('keyword defaults, bounds and short scripts without invented personal memories',async()=>{
  assert.deepEqual(keywords('miss you, miss you; different cities'),['miss you','different cities']);
  assert.equal(keywords('one,two,three,four,five,six').length,5);
  assert.equal(keywords('x'.repeat(80))[0].length,40);
  const input={preset:'thinking',keywords:['miss you','different cities','weekend walks']};
  const result=await templateProvider.generate(input);
  assert.match(result.blessing,/different cities/);assert.equal(result.script,'');
  for(const seconds of [15,30]){
    const script=await templateProvider.script(input,result,seconds);
    assert.ok(script.split(/\s+/).length<=(seconds===15?30:62));assert.match(script,/miss you/);
  }
  const unknown=await templateProvider.generate({preset:'baby',keywords:['violet umbrella']});
  assert.match(unknown.blessing,/Sending this thought with love: “violet umbrella”/);
  assert.doesNotMatch(unknown.blessing,/remember|we shared/i);
});
test('social card hides private content and never includes a script',()=>{
  const original={title:'Private name',blessing:'Private message',sender:'Private sender',script:'Private script',theme:'dawn',keepsake:'A line'};
  const safe=publicCard(original,true,'Public title','Reviewed line');
  assert.equal(safe.blessing,'');assert.equal(safe.sender,'');assert.equal(safe.script,'');assert.equal(safe.title,'Public title');
  assert.equal(original.blessing,'Private message');
  assert.equal(publicCard(original,false,'Title','Line').blessing,'Private message');
});
