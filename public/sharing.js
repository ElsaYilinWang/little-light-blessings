import {installPlatformButtons} from './social.js';
export function publicCard(result, title, line, readOnly = false) {
  return {...result,title:readOnly?result.title:title,keepsake:readOnly?result.keepsake:line,script:''};
}
export function installSharing(getResult, draw, status, isReadOnly = ()=>false) {
  const $=id=>document.getElementById(id);let selected, file;
  let revision=0;
  async function preview() {
    const current=++revision;
    selected=publicCard(getResult(),$('publicTitle').value,$('publicLine').value,isReadOnly());
    file=undefined;$('sendSocial').disabled=true;$('downloadSocial').disabled=true;
    $('socialPlatforms').querySelectorAll('button').forEach(button=>button.disabled=true);
    try {await draw($('sharePreview'),selected);}catch(error){if(current===revision)status(error.message);return;}
    if(current!==revision)return;
    const blob=await new Promise(resolve=>$('sharePreview').toBlob(resolve,'image/png'));
    if(current!==revision || !blob)return;
    file=new File([blob],'little-light-keepsake.png',{type:'image/png'});$('sendSocial').disabled=false;$('downloadSocial').disabled=false;
    $('socialPlatforms').querySelectorAll('button').forEach(button=>button.disabled=false);
  }
  $('socialShare').onclick=()=>{
    $('socialStatus').textContent='';
    for(const id of ['publicTitle','publicLine']){$(id).readOnly=isReadOnly();$(id).closest('label').hidden=isReadOnly();}
    $('publicTitle').value=getResult().title;$('publicLine').value=getResult().keepsake;
    $('shareDialog').showModal();preview();
  };
  for(const id of ['publicTitle','publicLine'])$(id).addEventListener('input',preview);
  $('closeSocial').onclick=()=>{$('shareDialog').close();};
  function feedback(message){$('socialStatus').textContent=message;status(message);}
  function download(platform) {
    if(!file)return;const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);feedback(platform?`Download requested. Open ${platform} and attach the saved card to your message or post.`:'Download requested. Share the saved image in your chosen app.');
  }
  $('downloadSocial').onclick=()=>download();
  async function shareImage(platform){
    // File is prepared before the click to retain the user activation required by native sharing.
    if(!file)return;
    if(!navigator.share || !navigator.canShare?.({files:[file]})){download(platform);return;}
    feedback(platform?`Choose ${platform} if it appears in your device’s share menu. Otherwise, download the card and attach it in that app.`:'Choose an app in your device’s share menu.');
    try {await navigator.share({files:[file]});$('shareDialog').close();status('Sharing handed to your device.');}
    catch(error){if(error.name!=='AbortError')feedback('Sharing is unavailable here. Use Download image instead.');}
  }
  $('sendSocial').onclick=()=>shareImage();
  installPlatformButtons($('socialPlatforms'),shareImage);
}
