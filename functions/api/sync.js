const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const MAX_PAYLOAD = 95000;

function reply(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function config(env) {
  if (!env.WPS_SYNC_URL || !env.WPS_SCRIPT_TOKEN) {
    throw new Error('WPS 同步尚未配置：请在 Cloudflare Pages 设置 WPS 环境变量。');
  }
  let url;
  try { url = new URL(env.WPS_SYNC_URL); } catch { throw new Error('WPS webhook 地址无效。'); }
  if (url.protocol !== 'https:' || !['www.kdocs.cn', 'www.wps.com'].includes(url.hostname)) {
    throw new Error('WPS webhook 必须是官方 HTTPS 地址。');
  }
  return { url: url.toString(), token: env.WPS_SCRIPT_TOKEN };
}

async function hashSyncKey(key) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function syncKey(request) {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.get('authorization') || '');
  if (!match) {
    const error = new Error('同步码无效。'); error.status = 401; throw error;
  }
  return match[1].toLowerCase();
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
      const error = new Error('同步数据太大。请导出本地 JSON 备份。'); error.status = 413; throw error;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function unwrapScriptResult(body) {
  if (!body || body.status !== 'finished' || body.error) {
    throw new Error('WPS AirScript 执行失败。请检查脚本、表格字段和 WPS 凭据。');
  }
  let result = body.data?.result;
  if (typeof result === 'string') {
    try { result = JSON.parse(result); } catch { /* keep non-JSON result for a clear error below */ }
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('WPS AirScript 返回格式不正确。请检查表格中的共享脚本。');
  }
  return result;
}

async function runAirScript(configured, argv) {
  const response = await fetch(configured.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'AirScript-Token': configured.token },
    body: JSON.stringify({ Context: { argv } })
  });
  let body;
  try { body = await response.json(); } catch { throw new Error('WPS API 返回了无法识别的响应。'); }
  if (!response.ok) {
    const error = new Error(`WPS API 请求失败（HTTP ${response.status}）。请检查 webhook 和脚本令牌。`);
    error.status = 502; throw error;
  }
  return unwrapScriptResult(body);
}

async function handle(request, env) {
  const configured = config(env);
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'PUT') return reply(405, { error: '仅支持 GET 和 PUT。' });
  const keyHash = await hashSyncKey(syncKey(request));

  if (method === 'GET') {
    const result = await runAirScript(configured, { operation: 'get', keyHash });
    if (!result.ok) throw new Error('WPS AirScript 查询失败。请检查表格配置。');
    return reply(200, { record: result.payload ? { payload: result.payload } : null });
  }

  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_PAYLOAD + 1024) return reply(413, { error: '同步数据太大。请导出本地 JSON 备份。' });
  const body = await readLimitedJson(request);
  if (typeof body.payload !== 'string' || body.payload.length > MAX_PAYLOAD) {
    return reply(413, { error: '同步数据超过 WPS 单条记录支持的大小。请减少个人笔记后再试。' });
  }
  const result = await runAirScript(configured, { operation: 'put', keyHash, payload: body.payload });
  if (!result.ok) throw new Error('WPS AirScript 写入失败。请检查表格配置。');
  return reply(200, { ok: true });
}

export async function onRequest({ request, env }) {
  try {
    return await handle(request, env);
  } catch (error) {
    const message = error.message || 'WPS 同步失败。';
    const status = /尚未配置/.test(message) ? 503 : error.status || 502;
    return reply(status, { error: message });
  }
}
