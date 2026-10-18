// Local-only media: no fetch, uploads, storage, third-party scripts or analytics.
export function recordingType(video) {
  if (typeof MediaRecorder === 'undefined') return '';
  return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(type => MediaRecorder.isTypeSupported(type) && (!video?.canPlayType || video.canPlayType(type))) || '';
}
export function installLocalMedia(getResult, prepareScript = async()=>{}) {
  const $ = id => document.getElementById(id);
  let photo, recorder, stream, timer, frame, videoURL, blob, operation = 0, discard = false;
  const message = text => { $('mediaStatus').textContent = text; };
  function syncGuide() { $('readingGuideText').textContent=getResult()?.script || ''; }
  function hideGuide() { $('readingGuide').hidden=true; }
  function buttons(active) {
    $('photo').disabled = active; $('animatePhoto').disabled = active || !photo;
    $('recordVideo').disabled = active; $('stopMedia').hidden = !active;
    $('clearPhoto').disabled = active; $('clearVideo').disabled = active; $('saveVideo').disabled = active;
  }
  function revokeVideo() {
    hideGuide();
    $('localVideo').onerror=null;
    $('localVideo').pause(); $('localVideo').srcObject=null; $('localVideo').removeAttribute('src'); $('localVideo').load();
    if (videoURL) URL.revokeObjectURL(videoURL);
    videoURL = undefined; blob = undefined;
    $('localVideo').hidden = true; $('saveVideo').hidden = true; $('clearVideo').hidden = true;
  }
  function releaseTracks() { stream?.getTracks().forEach(track => track.stop()); stream = undefined; }
  function stop(cancel = false) {
    hideGuide();
    discard = cancel; clearTimeout(timer); cancelAnimationFrame(frame);
    if (recorder?.state === 'recording') recorder.stop();
    releaseTracks(); $('motionCanvas').hidden = true; buttons(false);
  }
  function reset() { operation++; stop(true); photo = undefined; $('photo').value = ''; $('clearPhoto').hidden = true; revokeVideo(); message(''); buttons(false); }
  $('photo').onchange = async () => {
    const id = ++operation, file = $('photo').files[0];
    photo = undefined; buttons(false); $('clearPhoto').hidden = true;
    if (!file) return;
    let url;
    try {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024) throw new Error('Choose a JPEG, PNG or WebP photo under 10 MB.');
      url = URL.createObjectURL(file); const image = new Image(); image.src = url; await image.decode();
      if (image.naturalWidth*image.naturalHeight > 25000000) throw new Error('Choose a photo smaller than 25 megapixels.');
      if (id !== operation) return;
      // Repaint pixels into a new canvas; exported frames contain no original EXIF/GPS metadata.
      const ratio = Math.min(1, 1440/Math.max(image.naturalWidth,image.naturalHeight));
      photo = document.createElement('canvas'); photo.width = Math.max(1,Math.round(image.naturalWidth*ratio)); photo.height = Math.max(1,Math.round(image.naturalHeight*ratio));
      photo.getContext('2d').drawImage(image,0,0,photo.width,photo.height);
      $('clearPhoto').hidden = false; buttons(false); message('Photo ready on this device. It will not be uploaded.');
    } catch (error) { message(error.message); $('photo').value = ''; }
    finally { if (url) URL.revokeObjectURL(url); }
  };
  function begin(capture, type, seconds, kind) {
    revokeVideo(); discard = false; stream = capture;
    const chunks = [], active = new MediaRecorder(capture,{mimeType:type,videoBitsPerSecond:2500000}); recorder = active;
    active.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    active.onerror = () => { discard = true; stop(true); message('This browser could not create the video. Try another browser.'); };
    active.onstop = () => {
      hideGuide();
      if (recorder !== active) return;
      recorder = undefined; releaseTracks(); clearTimeout(timer); cancelAnimationFrame(frame); buttons(false); $('motionCanvas').hidden = true;
      if (discard) return;
      blob = new Blob(chunks,{type:active.mimeType || type});
      if (!blob.size) { message('No video was captured. Please try again.'); return; }
      videoURL = URL.createObjectURL(blob); $('localVideo').srcObject=null; $('localVideo').src = videoURL; $('localVideo').muted = false;
      $('localVideo').preload='metadata'; $('localVideo').load();
      $('localVideo').onerror=()=>message('Your video was exported, but this browser cannot preview its format. Save it and try a compatible player.');
      $('localVideo').hidden = false; $('saveVideo').hidden = false; $('clearVideo').hidden = false;
      message('Your video is ready. Preview and save it before leaving this tab. Nothing was uploaded.');
    };
    buttons(true); active.start(250); timer = setTimeout(()=>stop(false),seconds*1000);
    message(`${kind} for ${seconds} seconds. Keep this tab visible. Press Stop to finish early.`);
  }
  $('animatePhoto').onclick = () => {
    if (!photo) return;
    try {
      const type = recordingType($('localVideo')), canvas = $('motionCanvas');
      if (!type || !canvas.captureStream) throw new Error('Video export is not supported in this browser. Try a current Chrome, Edge or Safari.');
      const seconds = Number($('duration').value), ctx = canvas.getContext('2d'), started = performance.now();
      const line = getResult().keepsake; const image = photo;
      function render() {
        const progress = Math.min(1,(performance.now()-started)/(seconds*1000));
        ctx.fillStyle = '#292431'; ctx.fillRect(0,0,720,1280);
        const ratio = Math.min(720/image.width,1000/image.height)*(1+progress*.06);
        ctx.save();ctx.beginPath();ctx.rect(0,0,720,1050);ctx.clip();ctx.drawImage(image,(720-image.width*ratio)/2,(1000-image.height*ratio)/2,image.width*ratio,image.height*ratio);ctx.restore();
        const gradient=ctx.createLinearGradient(0,850,0,1280);gradient.addColorStop(0,'#29243100');gradient.addColorStop(.6,'#292431');ctx.fillStyle=gradient;ctx.fillRect(0,850,720,430);
        ctx.fillStyle='#fff';ctx.font='30px Georgia';ctx.textAlign='center';
        let rows=[''];for(const char of line){let last=rows.length-1;if(ctx.measureText(rows[last]+char).width>600)rows.push(char);else rows[last]+=char;}
        rows.slice(0,5).forEach((row,i)=>ctx.fillText(row,360,1050+i*38));
        frame=requestAnimationFrame(render);
      }
      $('motionCanvas').hidden=false; render();
      begin(canvas.captureStream(24),type,seconds,'Creating a silent animation');
    } catch(error) { stop(true); message(error.message); }
  };
  $('recordVideo').onclick = async () => {
    const id=++operation;
    try {
      const type=recordingType($('localVideo'));
      if (!type || !navigator.mediaDevices?.getUserMedia) throw new Error('Recording is not supported here. Use your phone camera and the script instead.');
      await prepareScript();
      if(id!==operation)return;
      buttons(true);message('Waiting for your camera and microphone permission…');
      const capture=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:720},height:{ideal:1280},facingMode:'user'},audio:true});
      if(id!==operation){capture.getTracks().forEach(track=>track.stop());return;}
      begin(capture,type,Number($('duration').value),'Recording your message');
      $('localVideo').srcObject=capture; $('localVideo').muted=true;$('localVideo').hidden=false; await $('localVideo').play();
      syncGuide();$('readingGuide').hidden=!getResult()?.script;
      $('localVideo').scrollIntoView?.({block:'start'});
    } catch(error) { stop(true);$('localVideo').srcObject=null;message(error.name==='NotAllowedError'?'Camera access was not allowed. You can still use the script or a photo.':error.message); }
  };
  $('stopMedia').onclick=()=>{operation++;stop(false);};
  $('clearPhoto').onclick=()=>{photo=undefined;$('photo').value='';$('clearPhoto').hidden=true;buttons(!!recorder);message('Photo removed from this tab.');};
  $('clearVideo').onclick=()=>{revokeVideo();message('Video removed from this tab. Downloaded copies are unchanged.');};
  $('saveVideo').onclick=()=>{
    if(!blob)return;const a=document.createElement('a');a.href=videoURL;a.download=`little-light-video.${blob.type.includes('mp4')?'mp4':'webm'}`;a.click();message('Download requested. You can share the saved file in another app.');
  };
  // Release camera promptly; do not record a hidden tab or keep devices active after leaving.
  document.addEventListener('visibilitychange',()=>{if(document.hidden){operation++;if($('recordVideo').disabled){stop(true);$('localVideo').srcObject=null;message('Recording cancelled because this tab was hidden. Try again when ready.');}}});
  window.addEventListener('pagehide',reset);
  return {reset,syncGuide};
}
