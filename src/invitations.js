const encoder=new TextEncoder();
export function normalizeCode(code) {
  return typeof code==='string'?code.trim().toUpperCase().replace(/[\s-]/g,''):'';
}
export function validCodeFormat(code){return /^(?:[A-Z][0-9]|LL[A-F0-9]{24})$/.test(code);}
export function sessionCookie(token,seconds=7*86400) {
  return `__Host-ll_invite=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${seconds}`;
}
export async function invitationSession(request,env,hash,now) {
  const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-ll_invite=([a-f0-9]{64})(?:;|$)/)?.[1];
  if(!token)return null;
  return env.DB.prepare('SELECT i.code_hash,i.credits_remaining,i.expires_at FROM invite_sessions s JOIN invitations i ON i.code_hash=s.invitation_hash WHERE s.session_hash=? AND s.expires_at>? AND i.expires_at>? AND i.revoked=0').bind(await hash(token),now,now).first();
}
export async function giftToken(secret,invitationHash,requestId) {
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',key,encoder.encode(`little-light-gift-v1:${invitationHash}:${requestId}`));
  return [...new Uint8Array(signature)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
