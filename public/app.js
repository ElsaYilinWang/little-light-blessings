import {templateProvider as provider, faiths, tones, keywords, suggestions, scriptQuote} from './engine.js';
import {seal, unseal} from './crypto.js';
import t from './locales/en.js';
import {translateUI} from './i18n.js';
import {installLocalMedia} from './media.js';
import {installSharing} from './sharing.js';
translateUI();
const $ = id => document.getElementById(id);
let result, input, recipientMode = false;
let sharedToken;
const localMedia = installLocalMedia(()=>result,async()=>{
  if(!result.script && input){$('script').value=await provider.script(input,result,Number($('duration').value));$('scriptWrap').hidden=false;sync();event('script_requested');}
});
installSharing(()=>result,draw,message=>status(message),()=>recipientMode);
const status = message => { $('status').textContent = message; };
for (const [id, values] of [['faith',faiths],['tone',tones]]) for (const value of values) {const option = new Option(value,value); $(id).add(option);}
function chips() {
  const preset=$('form').elements.preset.value, chosen=keywords($('keywords').value);
  $('keywords').placeholder=t.wordExamples[preset];
  $('keywordChips').replaceChildren();
  for(const phrase of suggestions[preset]) {
    const button=document.createElement('button');button.type='button';button.textContent=phrase;button.className='chip';
    const active=chosen.some(word=>word.toLowerCase()===phrase);button.setAttribute('aria-pressed',String(active));
    button.onclick=()=>{if(active)$('keywords').value=chosen.filter(word=>word.toLowerCase()!==phrase).join(', ');else if(chosen.length<5)$('keywords').value=[...chosen,phrase].join(', ');else status('Choose up to five phrases.');chips();};
    $('keywordChips').append(button);
  }
  $('keywordCount').textContent=`${chosen.length} / 5 phrases`;
}
$('keywords').addEventListener('input',chips);
for(const radio of $('form').elements.preset)radio.addEventListener('change',()=>{$('keywords').value='';status('');chips();});
chips();
async function post(path, data) {
  const response = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const value = await response.json(); if (!response.ok) throw new Error(value.error || t.error); return value;
}
function event(name) { if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return; post('/api/event',{event:name}).catch(()=>{}); }
function busy(id, fn) { return async () => {const button=$(id); button.disabled=true; status(''); try {await fn();} catch(e) {status(e.message || t.error);} finally {button.disabled=false;}}; }
const palettes = {dawn:['#f3dfd0','#eee0ed','#514452'],twilight:['#ded8ef','#f1dbe2','#4b425d'],sage:['#dce6d8','#f2e8d7','#414d42']};
function wrap(ctx, text, width) {
  const lines=[];
  for (const paragraph of text.split('\n')) {
    let line='';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? line+' '+word : word;
      if (ctx.measureText(candidate).width <= width) {line=candidate;continue;}
      if (line) lines.push(line); line='';
      // Break long names/URLs as well as ordinary words; supports future CJK text.
      for (const char of word) {if (ctx.measureText(line+char).width > width) {lines.push(line);line='';} line+=char;}
    }
    lines.push(line);
  }
  return lines;
}
export function draw(canvas, value, wallpaper=false) {
  canvas.width=1080;canvas.height=wallpaper?1920:1350;
  const ctx=canvas.getContext('2d'), h=canvas.height, palette=palettes[value.theme] || palettes.dawn;
  const gradient=ctx.createLinearGradient(0,0,1080,h);gradient.addColorStop(0,palette[0]);gradient.addColorStop(1,palette[1]);ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,h);
  ctx.fillStyle='#fff5';ctx.beginPath();ctx.arc(540,wallpaper?350:220,115,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=palette[2]+'44';ctx.lineWidth=2;ctx.strokeRect(48,48,984,h-96);ctx.textAlign='center';ctx.fillStyle=palette[2];
  let titleSize=52, titleLines; do {ctx.font=`${titleSize}px Georgia`;titleLines=wrap(ctx,value.title,860);titleSize-=2;}while(titleLines.length>3 && titleSize>24);
  let y=wallpaper?560:390;
  for(const line of titleLines){ctx.fillText(line,540,y);y+=titleSize*1.3;} y+=45;
  const remaining=h-y-270;
  let size=34, lines;do {ctx.font=`${size}px Georgia`;lines=wrap(ctx,value.blessing,830);if(lines.length*size*1.5<=remaining)break;size-=1;}while(size>12);
  for(const line of lines){ctx.fillText(line,540,y);y+=size*1.5;}
  y=h-195;ctx.font='italic 30px Georgia';
  for(const line of wrap(ctx,value.keepsake,850)){ctx.fillText(line,540,y);y+=36;}
  ctx.font='22px Georgia';ctx.fillText(value.sender ? `With love, ${value.sender}` : '✧',540,h-80);
}
function sync() {if(!result || recipientMode)return;result={title:$('title').value,blessing:$('blessing').value,keepsake:$('keepsake').value,sender:$('signature').value,theme:$('theme').value,script:$('script').value};$('scriptQuote').hidden=!result.script;localMedia.syncGuide();draw($('canvas'),result);$('linkWrap').hidden=true;}
function show(value) {
  localMedia.reset();
  result=recipientMode?Object.freeze({...value}):value;$('compose').hidden=true;$('recipient').hidden=true;$('result').hidden=false;
  document.querySelectorAll('#editor > label, #editor > details').forEach(element=>{element.hidden=recipientMode;});
  $('receivedMessage').hidden=!recipientMode;
  $('receivedTitle').textContent=value.title;
  $('receivedBlessing').textContent=value.blessing;
  $('receivedKeepsake').textContent=value.keepsake;
  $('receivedSender').textContent=value.sender?`With love, ${value.sender}`:'';
  $('resultEyebrow').textContent=recipientMode?'A MESSAGE TO KEEP':'WORDS TO MAKE YOUR OWN';
  $('resultHint').textContent=recipientMode?'Sent with care. Save or share this keepsake just as it was sent.':'Read it aloud. Change a word. Make it feel like you.';
  for(const id of ['title','blessing','keepsake','theme','script'])$(id).value=value[id] || '';
  $('signature').value=value.sender || '';$('scriptWrap').hidden=!value.script;
  $('scriptQuote').hidden=!value.script;
  $('scriptButton').hidden=recipientMode;$('share').hidden=recipientMode;$('back').hidden=recipientMode;
  $('linkWrap').hidden=true;draw($('canvas'),value);$('resultHeading').textContent=recipientMode?'A little light, for you.':'Your little light.';window.scrollTo(0,0);
}
$('form').addEventListener('submit',async e=>{
  e.preventDefault();status('');input=Object.fromEntries(new FormData(e.target));
  const raw=input.keywords.split(/[,;\n]/).map(word=>word.trim()).filter(Boolean);
  if(raw.length>5 || raw.some(word=>word.length>40)){status('Use up to five short phrases, with no more than 40 characters each.');return;}
  input.keywords=keywords(raw);
  try {show(await provider.generate(input));event('created');}catch(error){status(error.message);}
});
for(const id of ['title','blessing','keepsake','signature','theme','script'])$(id).addEventListener('input',sync);
$('scriptButton').onclick=busy('scriptButton',async()=>{if(result.script && !confirm('Replace your current script with a new draft?'))return;$('script').value=await provider.script(input,result,Number($('duration').value));$('scriptWrap').hidden=false;sync();event('script_requested');});
$('scriptQuote').onclick=()=>{const quote=scriptQuote(result.script);if(!quote){status('Choose a shorter complete sentence for the keepsake line.');return;}$('keepsake').value=quote;sync();status('One spoken sentence is now your keepsake line. Your full message is unchanged.');};
async function save(wallpaper) {
  const canvas=document.createElement('canvas');draw(canvas,result,wallpaper);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error(t.error);
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=wallpaper?'little-light-wallpaper.png':'little-light-card.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);event(wallpaper?'wallpaper_saved':'card_saved');status(t.saved);
}
$('cardSave').onclick=busy('cardSave',()=>save(false));$('wallSave').onclick=busy('wallSave',()=>save(true));
$('share').onclick=busy('share',async()=>{const sealed=await seal(result);const gift=await post('/api/share',{payload:sealed.payload});sharedToken=gift.token;$('shareLink').value=`${location.origin}/#gift=${gift.token}&key=${sealed.key}`;$('linkWrap').hidden=false;status(t.linkCreated);});
$('deleteLink').onclick=busy('deleteLink',async()=>{await post('/api/revoke',{token:sharedToken});$('linkWrap').hidden=true;sharedToken=undefined;status('Shared message deleted. This link no longer works. Saved or externally shared copies are unchanged.');});
$('copy').onclick=busy('copy',async()=>{await navigator.clipboard.writeText($('shareLink').value);status(t.copied);});
$('back').onclick=()=>{
  localMedia.reset();$('form').reset();input=undefined;result=undefined;sharedToken=undefined;
  for(const id of ['title','blessing','keepsake','signature','script','shareLink'])$(id).value='';
  $('duration').value='15';$('theme').value='dawn';$('scriptWrap').hidden=true;$('scriptQuote').hidden=true;$('linkWrap').hidden=true;
  document.querySelectorAll('.personalise').forEach(section=>{section.open=false;});
  $('shareDialog').close();chips();$('compose').hidden=false;$('result').hidden=true;status('');window.scrollTo(0,0);
};
const fragment=new URLSearchParams(location.hash.slice(1));
if(fragment.has('gift')) {
  recipientMode=true;$('compose').hidden=true;$('recipient').hidden=false;
  const token=fragment.get('gift'),key=fragment.get('key');
  // Remove credentials from the visible address/history immediately, retaining only in memory.
  history.replaceState(null,'',location.pathname);
  $('deleteUnopened').onclick=busy('deleteUnopened',async()=>{
    await post('/api/revoke',{token});$('redeem').hidden=true;$('deleteUnopened').hidden=true;
    status('Message deleted without opening. Saved or externally shared copies are unchanged.');
  });
  $('redeem').onclick=busy('redeem',async()=>{
    if(!/^[a-f0-9]{64}$/.test(token || '') || !/^[A-Za-z0-9_-]{43}$/.test(key || ''))throw new Error('This link is incomplete. Ask the sender for the full link.');
    // Validate the key before consuming. Ciphertext authentication is possible only after redeem.
    const gift=await post('/api/redeem',{token});
    try {show(await unseal(gift.payload,key));status(t.opened);}catch {throw new Error('This message could not be decrypted. The link has been consumed; ask the sender for a new link.');}
    $('redeem').disabled=true;
  });
}
