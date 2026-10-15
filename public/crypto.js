export function encode(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
export function decode(value) { return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0)); }
export async function seal(value) {
  const key = await crypto.subtle.generateKey({name:'AES-GCM', length:256}, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, new TextEncoder().encode(JSON.stringify(value)));
  return {payload: `${encode(iv)}.${encode(ciphertext)}`, key: encode(await crypto.subtle.exportKey('raw', key))};
}
export async function unseal(payload, raw) {
  const [iv, ciphertext] = payload.split('.');
  const key = await crypto.subtle.importKey('raw', decode(raw), 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv:decode(iv)}, key, decode(ciphertext));
  return JSON.parse(new TextDecoder().decode(plain));
}
