const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const MAX_PAYLOAD = 95000;
let cachedToken = '';
let tokenExpiresAt = 0;

function reply(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function config(env) {
  const names = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'FEISHU_APP_TOKEN', 'FEISHU_TABLE_ID'];
  const missing = names.filter(name => !env[name]);
  if (missing.length) throw new Error('飞书同步尚未配置：请在 Cloudflare Pages 设置飞书环境变量。');
  return env;
}

function syncHash(key) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
    .then(bytes => [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join(''));
}

function syncKey(request) {
  const value = request.headers.get('authorization') || '';
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(value);
  if (!match) throw new Error('同步码无效。');
  return match[1].toLowerCase();
}

async function tenantToken(env) {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;
  const response = await fetch('https://accounts.feishu.cn/oauth/v3/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: env.FEISHU_APP_ID, client_secret: env.FEISHU_APP_SECRET })
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error('无法取得飞书访问令牌，请检查应用 ID 和密钥。');
  cachedToken = body.access_token;
  tokenExpiresAt = Date.now() + Math.max(60, Number(body.expires_in) || 7200) * 1000;
  return cachedToken;
}

function recordUrl(env, keyHash) {
  const url = new URL(`https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(env.FEISHU_APP_TOKEN)}/tables/${encodeURIComponent(env.FEISHU_TABLE_ID)}/records`);
  url.searchParams.set('page_size', '2');
  url.searchParams.set('filter', `CurrentValue.[sync_hash] = "${keyHash}"`);
  url.searchParams.set('field_names', JSON.stringify(['sync_hash', 'payload']));
  return url;
}

function textValue(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(part => typeof part === 'string' ? part : part?.text || '').join('');
  return '';
}

async function bitable(env, url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${await tenantToken(env)}`, 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) }
  });
  const body = await response.json();
  if (!response.ok || body.code !== 0) {
    const error = new Error('飞书多维表格请求失败。请检查应用权限、表格授权和字段名称。');
    error.status = response.status;
    throw error;
  }
  return body.data;
}

async function findRecord(env, keyHash) {
  const data = await bitable(env, recordUrl(env, keyHash));
  return (data.items || []).find(item => textValue(item.fields?.sync_hash) === keyHash) || null;
}

async function readLimitedJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('请求内容为空。');
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_PAYLOAD + 1024) {
      await reader.cancel();
      const error = new Error('同步数据太大。请导出本地 JSON 备份。');
      error.status = 413;
      throw error;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function handle(request, env) {
  config(env);
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'PUT') return reply(405, { error: '仅支持 GET 和 PUT。' });
  const key = syncKey(request);
  const keyHash = await syncHash(key);
  const endpoint = recordUrl(env, keyHash);

  if (method === 'GET') {
    const record = await findRecord(env, keyHash);
    return reply(200, { record: record ? { payload: textValue(record.fields?.payload) } : null });
  }

  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_PAYLOAD + 1024) return reply(413, { error: '同步数据太大。请导出本地 JSON 备份。' });
  const body = await readLimitedJson(request);
  if (typeof body.payload !== 'string' || body.payload.length > MAX_PAYLOAD) {
    return reply(413, { error: '同步数据超过飞书单元格支持的大小。请减少个人笔记后再试。' });
  }
  const record = await findRecord(env, keyHash);
  const fields = { sync_hash: keyHash, payload: body.payload };
  if (record) {
    const url = new URL(`${endpoint.origin}${endpoint.pathname}/${encodeURIComponent(record.record_id)}`);
    await bitable(env, url, { method: 'PUT', body: JSON.stringify({ fields }) });
  } else {
    await bitable(env, endpoint, { method: 'POST', body: JSON.stringify({ fields }) });
  }
  return reply(200, { ok: true });
}

export async function onRequest({ request, env }) {
  try {
    return await handle(request, env);
  } catch (error) {
    const message = error.message || '飞书同步失败。';
    const status = /同步码无效/.test(message) ? 401 : /尚未配置/.test(message) ? 503 : error.status || 502;
    return reply(status, { error: message });
  }
}
