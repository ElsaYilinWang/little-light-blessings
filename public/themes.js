// Predefined canvas art: no downloads, image-generation fees, or personal data.
export const themes = {
  awaiting: {label:'Baby · Awaiting You (before birth)', colors:['#faf2e2','#f0dfc4','#493b30']},
  newborn: {label:'Baby · Welcome, Little One (0–3 months)', colors:['#faf2e2','#e3e4cc','#493b30']},
  spring: {label:'Spring · Morning Garden', colors:['#dce6d8','#f2e8d7','#414d42']},
  summer: {label:'Summer · Quiet Horizon', colors:['#f3dfd0','#fff0cd','#514452']},
  autumn: {label:'Autumn · Autumn Glow', colors:['#efd8bd','#ead4ca','#593e35']},
  winter: {label:'Winter · Moonlit Calm', colors:['#ded8ef','#e7eef4','#4b425d']},
  halloween: {label:'Halloween · Boo Night', colors:['#e3d8ef','#f5d9bd','#45334e']},
  christmas: {label:'Christmas · Santa & Lights', colors:['#dce6df','#f4e8d0','#354c40']}
};
export function themeName(name) {
  return ({dawn:'summer',twilight:'winter',sage:'spring'})[name] || (themes[name] ? name : 'spring');
}
export function paintBackground(ctx, name, height) {
  name=themeName(name);
  const colors=themes[name].colors;
  const gradient=ctx.createLinearGradient(0,0,1080,height);
  gradient.addColorStop(0,colors[0]);gradient.addColorStop(1,colors[1]);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,height);
  const circle=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
  const star=(x,y,r,color)=>{ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.stroke();};
  circle(540,185,90,'#ffffff55');
  if(name==='spring') {
    for(const x of [100,980])for(const y of [110,220]) {
      for(let i=0;i<5;i++)circle(x+Math.cos(i*Math.PI*2/5)*18,y+Math.sin(i*Math.PI*2/5)*18,13,'#fff7edaa');
      circle(x,y,7,'#b59b5d99');
    }
  } else if(name==='summer') {
    circle(540,185,67,'#efbc5766');
    for(let i=0;i<12;i++)star(540+Math.cos(i*Math.PI/6)*115,185+Math.sin(i*Math.PI/6)*115,5,'#c9954666');
  } else if(name==='autumn') {
    for(const x of [105,975])for(const y of [110,210]) {
      ctx.save();ctx.translate(x,y);ctx.rotate(x<540?-.6:.6);ctx.fillStyle='#b7724270';ctx.beginPath();ctx.ellipse(0,0,16,33,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  } else if(name==='winter') {
    for(const [x,y] of [[110,110],[970,190],[180,250],[880,90]]) {
      star(x,y,19,'#ffffffcc');ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);star(0,0,14,'#ffffffcc');ctx.restore();
    }
  } else if(name==='halloween') {
    circle(540,185,64,'#fff4c8cc');circle(565,165,55,colors[0]);
    for(const x of [110,970]) {
      circle(x,190,38,'#ce884b99');circle(x-21,190,29,'#d9955488');circle(x+21,190,29,'#d9955488');
      ctx.fillStyle='#65714a';ctx.fillRect(x-5,140,10,18);star(x,95,9,'#73577a88');
    }
  } else if(name==='christmas') {
    for(const x of [115,965]) {
      ctx.fillStyle='#54765d88';
      for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x,90+i*34);ctx.lineTo(x-34-i*5,155+i*34);ctx.lineTo(x+34+i*5,155+i*34);ctx.closePath();ctx.fill();}
      star(x,78,10,'#b8914a');circle(x-15,175,6,'#b45e5777');circle(x+15,209,6,'#b45e5777');
    }
    star(540,185,25,'#b8914aaa');
  }
  return colors;
}
