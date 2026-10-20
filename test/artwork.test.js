import {test} from 'node:test';
import assert from 'node:assert/strict';
import {titleLines,wallpaperLines,fitText,draw} from '../public/artwork.js';
function context() {
  return {font:'30px Georgia',calls:[],measureText(text){return {width:[...text].length*Number(this.font.match(/(\d+)px/)?.[1]||30)*.5};},
    drawImage(){},beginPath(){},roundRect(){},fill(){},fillText(text){this.calls.push(text);}};
}
test('titles use measured one-line or balanced two-line layouts',()=>{
  const ctx=context();
  assert.deepEqual(titleLines(ctx,'Close, wherever you are.',500),['Close, wherever you are.']);
  assert.deepEqual(titleLines(ctx,'A little light, sent to you',240),['A little light,','sent to you']);
  assert.equal(titleLines(ctx,'unbreakable'.repeat(50),100),undefined);
});
test('wallpaper line pairs are intentional; long card copy is never truncated',()=>{
  const ctx=context();
  assert.deepEqual(wallpaperLines(ctx,'A little peace. A little light.',820),['A little peace.','A little light.']);
  assert.deepEqual(wallpaperLines(ctx,'A little warmth. A little wonder.',820),['A little warmth.','A little wonder.']);
  assert.deepEqual(wallpaperLines(ctx,'May love find its way home.',820),['May love find its way home.']);
  const text='Full message with a final sentence. '.repeat(20).trim();
  assert.equal(fitText(ctx,text,800,700).lines.join(' '),text);
  assert.throws(()=>fitText(ctx,'message '.repeat(1000),300,100),/too long/);
});
test('card exports retain full message and signature; wallpapers contain only keepsake',async()=>{
  globalThis.Image=class {width=1080;height=1920;set src(value){queueMicrotask(()=>this.onload());}};
  const value={title:'A title',blessing:'The complete message stays here.',keepsake:'A little peace. A little light.',sender:'Test sender',theme:'halloween'};
  const ctx=context(),canvas={getContext:()=>ctx};
  await draw(canvas,value);assert.equal(canvas.height,1920);
  assert.ok(ctx.calls.includes(value.blessing));assert.ok(ctx.calls.includes('With love, Test sender'));
  ctx.calls=[];await draw(canvas,value,true);
  assert.deepEqual(ctx.calls,['A little peace.','A little light.']);
  assert.equal(canvas.width,1080);assert.equal(canvas.height,1920);
});
