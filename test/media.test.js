import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installLocalMedia,recordingType} from '../public/media.js';
test('local camera tracks are stopped, including permission resolved after leaving',async()=>{
  const original={document:globalThis.document,window:globalThis.window,MediaRecorder:globalThis.MediaRecorder,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator'),cancelAnimationFrame:globalThis.cancelAnimationFrame};
  const elements=new Map(), listeners={};let stopped=0,resolveCamera;
  const capture={getTracks:()=>[{stop:()=>{stopped++;}}]};
  const element=id=>{
    if(!elements.has(id))elements.set(id,{value:id==='duration'?'15':'',hidden:true,disabled:false,pause(){},play:async()=>{},load(){},removeAttribute(){}});
    return elements.get(id);
  };
  globalThis.document={getElementById:element,addEventListener:(name,fn)=>{listeners[name]=fn;}};
  globalThis.window={addEventListener:(name,fn)=>{listeners[name]=fn;}};
  globalThis.cancelAnimationFrame=()=>{};
  globalThis.MediaRecorder=class {
    static isTypeSupported(type){return type==='video/webm';}
    constructor(stream,opts){this.mimeType=opts.mimeType;this.state='inactive';}
    start(){this.state='recording';}
    stop(){this.state='inactive';queueMicrotask(()=>this.onstop?.());}
  };
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:()=>new Promise(resolve=>{resolveCamera=resolve;})}}});
  try{
    assert.equal(recordingType(),'video/webm');
    const media=installLocalMedia(()=>({keepsake:'Hello'}));
    const pending=element('recordVideo').onclick();media.reset();resolveCamera(capture);await pending;
    assert.equal(stopped,1,'late camera permission must not leave camera on');
    const next=element('recordVideo').onclick();resolveCamera(capture);await next;
    assert.equal(element('localVideo').srcObject,capture);
    listeners.pagehide();await Promise.resolve();
    assert.equal(stopped,2,'leaving stops camera and microphone tracks');
    assert.equal(element('localVideo').srcObject,null);
    assert.equal(element('localVideo').hidden,true);
  }finally{
    for(const key of ['document','window','MediaRecorder','cancelAnimationFrame'])globalThis[key]=original[key];
    if(original.navigator)Object.defineProperty(globalThis,'navigator',original.navigator);else delete globalThis.navigator;
  }
});
