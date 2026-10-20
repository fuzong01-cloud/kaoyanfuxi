import { errorReply, MAX_PAYLOAD, readJson, readSession, rejectCrossOrigin, reply, runWps } from '../_utils/wps.js';

async function handle(request, env) {
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'PUT') return reply(405, { error: '仅支持 GET 和 PUT。' });
  if (method === 'PUT') rejectCrossOrigin(request);
  const user = await readSession(request, env);
  if (!user) return reply(401, { error: '登录状态已失效，请重新登录。' });

  if (method === 'GET') {
    const result = await runWps(env, { operation: 'get', userId: user.id });
    if (!result.ok) throw new Error('WPS 学习记录读取失败，请检查表格配置。');
    return reply(200, { record: result.payload ? { payload: result.payload } : null });
  }

  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_PAYLOAD + 1024) return reply(413, { error: '同步数据太大，请导出本地 JSON 备份。' });
  const body = await readJson(request, MAX_PAYLOAD + 1024);
  if (typeof body.payload !== 'string' || body.payload.length > MAX_PAYLOAD) {
    return reply(413, { error: '同步数据超过单个账号记录的容量，请减少个人笔记后再试。' });
  }
  const result = await runWps(env, { operation: 'put', userId: user.id, payload: body.payload });
  if (!result.ok) throw new Error('WPS 学习记录写入失败，请检查表格配置。');
  return reply(200, { ok: true });
}

export async function onRequest({ request, env }) {
  try { return await handle(request, env); }
  catch (error) { return errorReply(error); }
}
