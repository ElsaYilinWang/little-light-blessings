export function publicCard(result, hidePersonal, title, line) {
  return {...result,title,keepsake:line,blessing:hidePersonal?'':result.blessing,sender:hidePersonal?'':result.sender,script:''};
}
export function installSharing(getResult, draw, status) {
  const $=id=>document.getElementById(id);let selected, file;
  let revision=0;
  async function preview() {
    const current=++revision;
    selected=publicCard(getResult(),$('hidePersonal').checked,$('publicTitle').value,$('publicLine').value);
    draw($('sharePreview'),selected);file=undefined;$('sendSocial').disabled=true;
    const blob=await new Promise(resolve=>$('sharePreview').toBlob(resolve,'image/png'));
    if(current!==revision || !blob)return;
    file=new File([blob],'little-light-keepsake.png',{type:'image/png'});$('sendSocial').disabled=false;
  }
  $('socialShare').onclick=()=>{
    $('hidePersonal').checked=true;$('publicTitle').value='A little light for you';$('publicLine').value=getResult().keepsake;
    $('shareDialog').showModal();preview();
  };
  for(const id of ['hidePersonal','publicTitle','publicLine'])$(id).addEventListener('input',preview);
  $('closeSocial').onclick=()=>{$('shareDialog').close();};
  function download() {
    if(!file)return;const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status('Download requested. Share the saved image in your chosen app.');
  }
  $('downloadSocial').onclick=download;
  $('sendSocial').onclick=async()=>{
    // File is prepared before the click to retain the user activation required by native sharing.
    if(!file)return;
    if(!navigator.share || !navigator.canShare?.({files:[file]})){download();return;}
    try {await navigator.share({files:[file]});$('shareDialog').close();status('Sharing handed to your device.');}
    catch(error){if(error.name!=='AbortError')status('Sharing is unavailable here. Use Download image instead.');}
  };
}
