import {themeName} from './themes.js';
export const artwork = {
  awaiting:'/art/awaiting.webp', newborn:'/art/newborn-smiling.webp',
  spring:'/art/spring.webp', summer:'/art/summer.webp', autumn:'/art/autumn.webp',
  winter:'/art/winter.webp', halloween:'/art/halloween.webp', christmas:'/art/christmas.webp'
};
const images=new Map(), revisions=new WeakMap();
function load(name) {
  if(!images.has(name)) images.set(name,new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(image);
    image.onerror=()=>{images.delete(name);reject(new Error('The artwork could not load. Please try again before saving.'));};
    image.src=artwork[name];
  }));
  return images.get(name);
}
export function wrapText(ctx,text,width) {
  const lines=[];
  for(const paragraph of String(text).replace(/\n{3,}/g,'\n\n').split('\n')) {
    let line='';
    for(const word of paragraph.split(/ +/)) {
      if(ctx.measureText(line?line+' '+word:word).width<=width){line=line?line+' '+word:word;continue;}
      if(line)lines.push(line);line='';
      for(const char of word){if(ctx.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}
    }
    lines.push(line);
  }
  return lines;
}
// One line when it fits; otherwise choose two lines by measured visual balance.
export function titleLines(ctx,text,width) {
  text=String(text).replace(/\s+/g,' ').trim();
  if(ctx.measureText(text).width<=width)return [text];
  const words=text.split(' ');let best,score=Infinity;
  for(let i=1;i<words.length;i++) {
    const a=words.slice(0,i).join(' '),b=words.slice(i).join(' ');
    const wa=ctx.measureText(a).width,wb=ctx.measureText(b).width;
    if(Math.max(wa,wb)>width)continue;
    const next=Math.abs(wa-wb)-(a.endsWith(',')?width*.12:0);
    if(next<score){best=[a,b];score=next;}
  }
  return best;
}
export function fitText(ctx,text,width,height,{max=36,min=18,italic=false,bold=false}={}) {
  for(let size=max;size>=min;size--) {
    ctx.font=`${italic?'italic ':''}${bold?'600 ':''}${size}px Georgia`;
    const lines=wrapText(ctx,text,width),step=size*1.5;
    if(lines.length*step<=height)return {lines,size,step,font:ctx.font};
  }
  throw new Error('This text is too long for a readable card. Please shorten it before saving.');
}
export function wallpaperLines(ctx,text,width) {
  const preferred={
    'You are close to my heart.':['You are close','to my heart.'],
    'A little peace. A little light.':['A little peace.','A little light.'],
    'A little warmth. A little wonder.':['A little warmth.','A little wonder.']
  }[text];
  if(preferred?.every(line=>ctx.measureText(line).width<=width))return preferred;
  return titleLines(ctx,text,width) || wrapText(ctx,text,width);
}
export async function draw(canvas,value,wallpaper=false) {
  const revision=(revisions.get(canvas)||0)+1;revisions.set(canvas,revision);
  const name=themeName(value.theme),image=await load(name);
  if(revisions.get(canvas)!==revision)return false;
  const holiday=['halloween','christmas'].includes(name);
  const baby=['awaiting','newborn'].includes(name);
  canvas.width=1080;canvas.height=wallpaper||holiday||baby?1920:1350;
  const ctx=canvas.getContext('2d'),h=canvas.height;
  const scale=Math.max(1080/image.width,h/image.height);
  ctx.drawImage(image,(1080-image.width*scale)/2,(h-image.height*scale)/2,image.width*scale,image.height*scale);
  ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='#292333';
  if(wallpaper) {
    let size=54,lines;
    do {ctx.font=`italic ${size}px Georgia`;lines=wallpaperLines(ctx,value.keepsake,820);if(lines.length<=2)break;size--;}while(size>=28);
    if(lines.length>2)throw new Error('Please shorten the keepsake line to fit the wallpaper.');
    ctx.shadowColor=name==='halloween'?'#f4e6ff':'#fff8';ctx.shadowBlur=3;
    let y=h*.37;for(const line of lines){ctx.fillText(line,540,y);y+=size*1.5;}
    return true;
  }
  const left=holiday?200:100,width=1080-left*2,top=holiday?510:115;
  const bottom=baby?1000:holiday?1320:1145;
  if(holiday){ctx.fillStyle='rgba(255,250,240,0.88)';ctx.beginPath();ctx.roundRect(left-36,top-38,width+72,bottom-top+76,24);ctx.fill();}
  ctx.fillStyle='#292333';
  let size=58,heading;
  do {ctx.font=`${size}px Georgia`;heading=titleLines(ctx,value.title,width);if(heading)break;size--;}while(size>=26);
  if(!heading)throw new Error('Please shorten the card title to fit two lines.');
  let y=top;for(const line of heading){ctx.fillText(line,540,y);y+=size*1.25;}y+=40;
  const signature=value.sender?`With love, ${value.sender}`:'';
  const footer=fitText(ctx,signature,width,95,{max:30,min:22,bold:true});
  const keepsake=fitText(ctx,value.keepsake,width,130,{max:32,min:24,italic:true});
  const message=fitText(ctx,value.blessing,width,bottom-y-100-footer.lines.length*footer.step-keepsake.lines.length*keepsake.step,{max:36,min:18});
  ctx.font=message.font;for(const line of message.lines){ctx.fillText(line,540,y);y+=message.step;}
  y=holiday?bottom-footer.lines.length*footer.step-keepsake.lines.length*keepsake.step-30:y+40;
  ctx.font=keepsake.font;for(const line of keepsake.lines){ctx.fillText(line,540,y);y+=keepsake.step;}
  y=holiday?bottom-footer.lines.length*footer.step:y+30;ctx.font=footer.font;
  for(const line of footer.lines){ctx.fillText(line,540,y);y+=footer.step;}
  return true;
}
