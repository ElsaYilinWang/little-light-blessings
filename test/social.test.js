import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installPlatformButtons,platforms} from '../public/social.js';
test('social buttons defer destination choice to the device without external widgets',()=>{
  const previous=globalThis.document;
  globalThis.document={createElement(){return {attributes:{},setAttribute(key,value){this.attributes[key]=value;}};}};
  try {
    const buttons=[],selected=[];installPlatformButtons({append(button){buttons.push(button);}},name=>selected.push(name));
    assert.equal(buttons.length,5);
    for(const [i,button] of buttons.entries()){
      assert.equal(button.type,'button');assert.equal(button.attributes['aria-label'],`Share with ${platforms[i]}`);
      assert.match(button.innerHTML,/<svg/);assert.doesNotMatch(button.innerHTML,/https?:|iframe|script|img/);
      button.onclick();
    }
    assert.deepEqual(selected,platforms);
  } finally {globalThis.document=previous;}
});
