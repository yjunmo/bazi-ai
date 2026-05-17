/**
 * 浏览器 WebCrypto 封装的 AES-GCM 字符串加解密。
 * 用于把 API Key 用一个用户输入的"主密码"派生 KDF 后加密落到 localStorage。
 * 注：纯前端无法 100% 防泄漏，但能挡住设备共享 / 开发者面板手快扫一眼的低强度威胁。
 */

const SALT_BYTES = 16;
const IV_BYTES = 12;
const PBKDF2_ITERATIONS = 250_000;

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function encryptString(plain: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return `v1.${toB64(salt)}.${toB64(iv)}.${toB64(new Uint8Array(ciphertext))}`;
}

export async function decryptString(cipher: string, passphrase: string): Promise<string> {
  const parts = cipher.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('密文格式错误');
  }
  const salt = fromB64(parts[1]);
  const iv = fromB64(parts[2]);
  const ct = fromB64(parts[3]);
  const key = await deriveKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return dec.decode(plain);
}

export function isEncrypted(value: string | undefined): boolean {
  return !!value && value.startsWith('v1.');
}
