import {test} from 'node:test';
import assert from 'node:assert/strict';
import {templateProvider,faiths,tones,presets,keywords,scriptQuote} from '../public/engine.js';
import {publicCard} from '../public/sharing.js';
import {seal,unseal} from '../public/crypto.js';
import {webcrypto} from 'node:crypto';
import {themes,themeName} from '../public/themes.js';
if (!globalThis.crypto) Object.defineProperty(globalThis,'crypto',{value:webcrypto});
test('all 60 preset/faith/tone combinations produce editable, script-free results',async()=>{
  for(const preset of presets)for(const faith of faiths)for(const tone of tones){
    const value=await templateProvider.generate({preset,faith,tone,recipient:'A & B',detail:'Our weekends together.',sender:'C'});
    assert.match(value.blessing,/Dear A & B/);assert.match(value.blessing,/Our weekends together\./);assert.equal(value.script,'');assert.ok(value.title);assert.ok(value.theme);assert.ok(value.keepsake);
  }
});

test('wishes stay occasion-neutral and have their own short spoken draft',async()=>{
  const input={preset:'wishes',keywords:['good health','new chapter']};
  const value=await templateProvider.generate(input);
  assert.match(value.blessing,/good health/);assert.match(value.blessing,/new chapter/);
  assert.doesNotMatch(value.blessing,/little one|miss you|birthday|Christmas|Halloween/i);
  assert.equal(value.theme,'summer');assert.equal(value.script,'');
  for(const seconds of [15,30]) {
    const spoken=await templateProvider.script(input,value,seconds);
    assert.match(spoken,/good wish/);assert.doesNotMatch(spoken,/growing family|miss you/);
    assert.ok(spoken.split(/\s+/).length<=(seconds===15?30:62));
  }
});

test('six visual themes preserve compatibility with previously shared gifts',()=>{
  assert.equal(Object.keys(themes).length,6);
  assert.equal(themeName('dawn'),'summer');assert.equal(themeName('sage'),'spring');assert.equal(themeName('twilight'),'winter');
  for(const name of Object.keys(themes))assert.equal(themeName(name),name);
});
test('rejects scope expansion and generates scripts only through explicit method',async()=>{
  await assert.rejects(templateProvider.generate({preset:'wedding',faith:'Universal',tone:'Warm'}));
  const input={preset:'thinking',faith:'Universal',tone:'Minimal'};
  const value=await templateProvider.generate(input);value.blessing='My edited message';
  assert.equal(value.script,'');
  assert.doesNotMatch(await templateProvider.script(input,value),/My edited message/);
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
test('social card preserves full message and signature, without the long script',()=>{
  const original={title:'Private name',blessing:'Private message',sender:'Private sender',script:'Private script',theme:'dawn',keepsake:'A line'};
  const safe=publicCard(original,'Public title','Reviewed line');
  assert.equal(safe.blessing,'Private message');assert.equal(safe.sender,'Private sender');assert.equal(safe.script,'');assert.equal(safe.title,'Public title');
  assert.equal(original.blessing,'Private message');
  assert.equal(publicCard(original,'Title','Line').blessing,'Private message');
});
test('recipient sharing cannot override the sender title, keepsake or message',()=>{
  const gift=Object.freeze({title:'Original title',blessing:'Original message',keepsake:'Original line',sender:'Original sender',theme:'dawn',script:'Spoken draft'});
  const shared=publicCard(gift,'Changed title','Changed line',true);
  assert.equal(shared.title,gift.title);assert.equal(shared.keepsake,gift.keepsake);
  assert.equal(shared.blessing,gift.blessing);assert.equal(shared.sender,gift.sender);assert.equal(shared.script,'');
  assert.equal(publicCard(gift,'Changed title','Changed line',false).title,'Changed title');
});
test('baby spoken draft is conversational, bounded and quotable without changing the formal card',async()=>{
  const input={preset:'baby',recipient:'Alex',keywords:['tiny toes','peace','joy']};
  const value=await templateProvider.generate(input), original=value.blessing;
  for(const seconds of [15,30]){
    const spoken=await templateProvider.script(input,value,seconds);
    assert.match(spoken,/I'm so happy for you/);assert.doesNotMatch(spoken,/tiny toes|Sending this thought/);
    assert.ok(spoken.split(/\s+/).length<=(seconds===15?30:62));
    assert.equal(scriptQuote(spoken),'“I\'m so happy for you and your growing family.”');
  }
  assert.equal(value.blessing,original);assert.equal(scriptQuote('x'.repeat(150)+'.'),'');
});
