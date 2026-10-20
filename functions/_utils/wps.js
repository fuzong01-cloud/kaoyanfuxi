export const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
export const MAX_PAYLOAD = 95000;
export const SESSION_COOKIE = 'zhigeng_session';
export const SESSION_SECONDS = 30 * 24 * 60 * 60;

export function reply(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

export function wpsConfig(env) {
  if (!env.WPS_SYNC_URL || !env.WPS_SCRIPT_TOKEN) {
    const error = new Error('WPS 数据服务尚未配置。'); error.status = 503; throw error;
  }
  let url;
  try { url = new URL(env.WPS_SYNC_URL); } catch { throw new Error('WPS webhook 地址无效。'); }
  if (url.protocol !== 'https:' || !['www.kdocs.cn', 'www.wps.com'].includes(url.hostname)) {
    throw new Error('WPS webhook 必须是官方 HTTPS 地址。');
  }
  return { url: url.toString(), token: env.WPS_SCRIPT_TOKEN };
}

export async function runWps(env, argv) {
  const configured = wpsConfig(env);
  const response = await fetch(configured.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'AirScript-Token': configured.token },
    body: JSON.stringify({ Context: { argv } })
  });
  let body;
  try { body = await response.json(); } catch { throw new Error('WPS API 返回了无法识别的响应。'); }
  if (!response.ok || !body || body.status !== 'finished' || body.error) {
    const error = new Error('WPS AirScript 执行失败，请检查脚本、字段和凭据。'); error.status = 502; throw error;
  }
  let result = body.data?.result;
  if (typeof result === 'string') {
    try { result = JSON.parse(result); } catch { /* preserve the invalid result for the check below */ }
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('WPS AirScript 返回格式不正确。');
  return result;
}

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function sessionKey(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    const error = new Error('本站登录服务尚未配置会话密钥。'); error.status = 503; throw error;
  }
  return crypto.subtle.importKey('raw', new TextEncoder().encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function makeSessionCookie(request, env, user) {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ id: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })));
  const signature = toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', await sessionKey(env), new TextEncoder().encode(payload))));
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${payload}.${signature}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

export async function readSession(request, env) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(item => item.trim()).find(item => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  try {
    if (!await crypto.subtle.verify('HMAC', await sessionKey(env), fromBase64Url(signature), new TextEncoder().encode(payload))) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (typeof data.id !== 'string' || typeof data.username !== 'string' || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return { id: data.id, username: data.username };
  } catch { return null; }
}

export function rejectCrossOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    const error = new Error('跨站请求已拒绝。'); error.status = 403; throw error;
  }
}

export async function readJson(request, maxBytes = 100000) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('请求内容为空。');
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      const error = new Error('请求内容太大。'); error.status = 413; throw error;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function errorReply(error) {
  return reply(error.status || 500, { error: error.message || '服务器暂时无法处理请求。' });
}
