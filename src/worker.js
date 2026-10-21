import {normalizeCode,sessionCookie,invitationSession,giftToken} from './invitations.js';
const EVENTS = new Set(['invite_landing','created', 'script_requested', 'card_saved', 'wallpaper_saved']);
const encoder = new TextEncoder();
export async function digest(value) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), b => b.toString(16).padStart(2, '0')).join(''); }
function json(value, status = 200, headers={}) { return new Response(JSON.stringify(value), {status, headers:{'Content-Type':'application/json', 'Cache-Control':'no-store',...headers}}); }
function randomToken() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''); }
async function body(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('Invalid request');
  // Stream with a hard limit, including chunked requests without Content-Length.
  const reader = request.body?.getReader(); if (!reader) throw new Error('Invalid request');
  let text = '', size = 0; const decoder = new TextDecoder();
  while (true) { const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > 24000) {await reader.cancel(); throw new Error('Too large');} text += decoder.decode(value, {stream:true}); }
  return JSON.parse(text + decoder.decode());
}
async function count(env, event) {
  await env.DB.prepare('INSERT INTO metrics(day,event,count) VALUES(?,?,1) ON CONFLICT(day,event) DO UPDATE SET count=count+1').bind(new Date().toISOString().slice(0,10), event).run();
}
async function rate(request, env, action, now) {
  if (!env.RATE_SALT) return false; // fail closed until configured
  const window = Math.floor(now / 600);
  const bucket = await digest(`${env.RATE_SALT}:${window}:${request.headers.get('CF-Connecting-IP') || 'local'}:${action}`);
  const row = await env.DB.prepare('INSERT INTO limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket, now + 1200).first();
  return row.count <= (['share','invite'].includes(action) ? 10 : 60);
}
export async function api(request, env) {
  const url = new URL(request.url), path = url.pathname;
  // GET/HEAD/preview requests never read or mutate a gift.
  if (request.method !== 'POST') return json({error:'Use an explicit open action.'}, 405);
  if (request.headers.get('Origin') !== url.origin) return json({error:'Origin rejected.'}, 403);
  if (!env.DB || !env.RATE_SALT) return json({error:'Sharing is not configured yet.'}, 503);
  if (!['/api/share','/api/redeem','/api/revoke','/api/event','/api/invite','/api/session','/api/logout'].includes(path)) return json({error:'Not found.'},404);
  const now = Math.floor(Date.now()/1000);
  if (!await rate(request, env, path === '/api/share' ? 'share' : path==='/api/invite'?'invite':'other', now)) return json({error:'Please try again later.'},429);
  const data = await body(request);
  if(path==='/api/invite'){
    const code=normalizeCode(data.code);
    const invite=/^LL[A-F0-9]{24}$/.test(code)?await env.DB.prepare('SELECT code_hash,credits_remaining,expires_at FROM invitations WHERE code_hash=? AND expires_at>? AND revoked=0').bind(await digest(code),now).first():null;
    if(!invite){await count(env,'invite_rejected').catch(()=>{});return json({error:'This invitation is invalid, expired or no longer available.'},403);}
    const token=randomToken(),seconds=Math.min(7*86400,invite.expires_at-now);
    await env.DB.prepare('INSERT INTO invite_sessions VALUES(?,?,?)').bind(await digest(token),invite.code_hash,now+seconds).run();
    await count(env,'invite_accepted').catch(()=>{});
    return json({active:true,remaining:invite.credits_remaining,expiresAt:invite.expires_at},200,{'Set-Cookie':sessionCookie(token,seconds)});
  }
  const invite=await invitationSession(request,env,digest,now);
  if(path==='/api/session')return json(invite?{active:true,remaining:invite.credits_remaining,expiresAt:invite.expires_at}:{active:false});
  if(path==='/api/logout'){
    const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-ll_invite=([a-f0-9]{64})(?:;|$)/)?.[1];
    if(token)await env.DB.prepare('DELETE FROM invite_sessions WHERE session_hash=?').bind(await digest(token)).run();
    return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
  }
  if (path === '/api/event') {
    if (Object.keys(data).length !== 1 || !EVENTS.has(data.event)) return json({error:'Invalid event.'},400);
    if(!invite && !['invite_landing','card_saved','wallpaper_saved'].includes(data.event))return json({error:'Invitation required.'},401);
    await count(env, data.event); return json({ok:true});
  }
  if (path === '/api/share') {
    if(!invite)return json({error:'Please enter your invitation code to create a gift link.'},401);
    // Optional server-side bot verification hook; client supplies a token only when an integrator enables Turnstile.
    if (env.TURNSTILE_SECRET) {
      const form = new FormData(); form.set('secret',env.TURNSTILE_SECRET); form.set('response',data.botToken || '');
      const check = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form})).json();
      if (!check.success || check.hostname !== url.hostname || check.action !== 'share') return json({error:'Bot verification required.'},403);
    }
    if (typeof data.payload !== 'string' || !/^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{20,22000}$/.test(data.payload)) return json({error:'Invalid card.'},400);
    if(typeof data.requestId!=='string'||!/^[a-f0-9]{32}$/.test(data.requestId))return json({error:'Invalid delivery request.'},400);
    const token=await giftToken(env.RATE_SALT,invite.code_hash,data.requestId),tokenHash=await digest(token),payloadHash=await digest(data.payload),expiresAt=now+7*86400;
    let receipt=await env.DB.prepare('SELECT * FROM share_receipts WHERE invitation_hash=? AND request_id=?').bind(invite.code_hash,data.requestId).first();
    if(!receipt){
      try{await env.DB.prepare('INSERT INTO gifts(token_hash,payload,expires_at,invitation_hash,request_id,payload_hash) VALUES(?,?,?,?,?,?)').bind(tokenHash,data.payload,expiresAt,invite.code_hash,data.requestId,payloadHash).run();}
      catch(error){if(String(error).includes('invitation_unavailable')){await count(env,'credit_blocked').catch(()=>{});return json({error:'No gift-link credits remain, or this invitation has expired. Drafts and downloads are still available.'},403);}throw error;}
      receipt=await env.DB.prepare('SELECT * FROM share_receipts WHERE invitation_hash=? AND request_id=?').bind(invite.code_hash,data.requestId).first();
    }
    if(!receipt||receipt.payload_hash!==payloadHash)return json({error:'This delivery request belongs to a different draft. Please create a new link.'},409);
    const balance=await env.DB.prepare('SELECT credits_remaining FROM invitations WHERE code_hash=?').bind(invite.code_hash).first();
    const exists=await env.DB.prepare('SELECT 1 AS present FROM gifts WHERE token_hash=? AND expires_at>?').bind(receipt.token_hash,now).first();
    return json({token,expiresAt:receipt.expires_at,remaining:balance.credits_remaining,alreadyOpened:!exists});
  }
  if (typeof data.token !== 'string' || !/^[a-f0-9]{64}$/.test(data.token)) return json({error:'Invalid link.'},400);
  if (path === '/api/revoke') {
    // Possession of the bearer link already permits consuming/deleting its contents.
    // A separate explicit action erases the message without returning/decrypting it.
    await env.DB.prepare('DELETE FROM gifts WHERE token_hash=?').bind(await digest(data.token)).run();
    return json({ok:true});
  }
  // Single atomic SQL statement: concurrent opens have exactly one winner; consume by deletion.
  const gift = await env.DB.prepare('DELETE FROM gifts WHERE token_hash=? AND expires_at>? RETURNING payload').bind(await digest(data.token),now).first();
  if (!gift) return json({error:'This link has expired or has already been opened.'},410);
  await count(env,'redeemed').catch(()=>{}); return json({payload:gift.payload});
}
function secure(response) {
  const headers = new Headers(response.headers);
  headers.set('Referrer-Policy','no-referrer'); headers.set('X-Content-Type-Options','nosniff');
  headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  headers.set('Permissions-Policy','camera=(self), microphone=(self), geolocation=()');
  headers.set('X-Robots-Tag','noindex, nofollow');
  return new Response(response.body,{status:response.status,headers});
}
export default {
  async fetch(request, env) {
    try { return secure(new URL(request.url).pathname.startsWith('/api/') ? await api(request,env) : await env.ASSETS.fetch(request)); }
    catch { return secure(json({error:'Unable to complete this request. Please try again.'},400)); }
  },
  async scheduled(_event, env) {
    const now = Math.floor(Date.now()/1000);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM gifts WHERE expires_at<=?').bind(now),
      env.DB.prepare('DELETE FROM limits WHERE expires_at<=?').bind(now),
      env.DB.prepare('DELETE FROM invite_sessions WHERE expires_at<=?').bind(now),
      env.DB.prepare('DELETE FROM share_receipts WHERE expires_at<=?').bind(now),
      env.DB.prepare("DELETE FROM metrics WHERE day < date('now','-90 days')")
    ]);
  }
};
