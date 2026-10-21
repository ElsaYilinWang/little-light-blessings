// Local icons only: no third-party widgets, tracking pixels or platform SDKs.
export const platforms = ['WhatsApp','Instagram','Facebook','TikTok','WeChat'];
const paths={
  WhatsApp:'<path d="M20 11.5a8 8 0 0 1-11.8 7L3 20l1.5-5.1A8 8 0 1 1 20 11.5Z"/><path d="m8 7 2 3-1 1c1 2 2 3 4 3l1-1 3 2c-1 3-4 2-6 1-3-2-6-6-3-9Z"/>',
  Instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>',
  Facebook:'<path d="M14 21v-8h3l.5-4H14V7c0-1 .5-2 2-2h2V2h-3c-4 0-5 2-5 5v2H7v4h3v8"/>',
  TikTok:'<path d="M14 3v12a4 4 0 1 1-4-4h1v3h-1a1 1 0 1 0 1 1V3h3c0 3 2 5 5 5v3c-2 0-4-1-5-2"/>',
  WeChat:'<path d="M13 15c-1 .5-3 1-4 1H6l-3 2 1-4a6 6 0 1 1 11-6"/><path d="M21 15c0 1-.5 2-1 3l1 3-3-1h-2a5 5 0 1 1 5-5Z"/><path d="M7 7h.1M11 7h.1M14 14h.1M18 14h.1"/>'
};
export function installPlatformButtons(container,onChoose) {
  for(const name of platforms){
    const button=document.createElement('button');button.type='button';button.className='socialButton';
    button.setAttribute('aria-label',`Share with ${name}`);
    button.title=`Choose ${name} in your device’s share menu, or attach the downloaded image in that app.`;
    button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg><span>${name}</span>`;
    button.onclick=()=>onChoose(name);container.append(button);
  }
}
