import { clearSessionCookie, errorReply, makeSessionCookie, readJson, readSession, rejectCrossOrigin, reply, runWps } from '../_utils/wps.js';

const PBKDF2_ITERATIONS = 210000;
const DUMMY_SALT = '6b1b36cbb04b41490bfc0ab2f4ad6e5c';
const DUMMY_HASH = '9e88c7b28fc64ad3d44876ba3baf0e1124cbe0a3c9a6d117f7aa151938aace11';

function bytesFromHex(value) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index++) bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

function hexFromBytes(bytes) {
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
}

function randomHex(size) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return hexFromBytes(bytes);
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytesFromHex(salt), iterations: PBKDF2_ITERATIONS }, key, 256);
  return hexFromBytes(new Uint8Array(bits));
}

function sameHash(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function validateCredentials(body) {
  const username = String(body.username || '').trim();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(username)) throw new Error('用户名使用 3–32 位英文字母、数字、下划线或短横线。');
  if (password.length < 8 || password.length > 128) throw new Error('密码长度需要为 8–128 位。');
  return { username, usernameKey: username.toLowerCase(), password };
}

async function handle(request, env) {
  const method = request.method.toUpperCase();
  if (method === 'GET') {
    const user = await readSession(request, env);
    return user ? reply(200, { authenticated: true, user }) : reply(401, { authenticated: false });
  }
  if (method !== 'POST') return reply(405, { error: '仅支持 GET 和 POST。' });
  rejectCrossOrigin(request);
  const body = await readJson(request, 12000);
  const action = String(body.action || '');
  if (action === 'logout') return reply(200, { ok: true }, { 'set-cookie': clearSessionCookie(request) });
  if (!['register', 'login'].includes(action)) return reply(400, { error: '未知的账号操作。' });
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    const error = new Error('本站登录服务尚未配置会话密钥。'); error.status = 503; throw error;
  }

  const { username, usernameKey, password } = validateCredentials(body);
  let user;
  if (action === 'register') {
    const id = crypto.randomUUID();
    const salt = randomHex(16);
    const passwordHash = await hashPassword(password, salt);
    const result = await runWps(env, { operation: 'register', userId: id, username, usernameKey, passwordSalt: salt, passwordHash });
    if (!result.ok) throw new Error('WPS 用户表写入失败，请检查字段名和共享脚本。');
    if (result.exists) return reply(409, { error: '这个用户名已被注册。' });
    user = { id, username };
  } else {
    const result = await runWps(env, { operation: 'lookup', usernameKey });
    const stored = result.user;
    const storedSalt = typeof stored?.password_salt === 'string' ? stored.password_salt : DUMMY_SALT;
    const actualHash = await hashPassword(password, storedSalt);
    const expectedHash = typeof stored?.password_hash === 'string' ? stored.password_hash : DUMMY_HASH;
    if (!stored || !sameHash(actualHash, expectedHash)) return reply(401, { error: '用户名或密码不正确。' });
    user = { id: stored.user_id, username: stored.username };
  }

  return reply(200, { ok: true, user }, { 'set-cookie': await makeSessionCookie(request, env, user) });
}

export async function onRequest({ request, env }) {
  try { return await handle(request, env); }
  catch (error) { return errorReply(error); }
}
