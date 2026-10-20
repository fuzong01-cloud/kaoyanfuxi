// Copy this code into a WPS AirScript “文档共享脚本” attached to the owner-held multidimensional table.
// Create a table named “用户数据” with these six text fields:
// user_id, username, username_key, password_salt, password_hash, payload

function main() {
  var args = Context.argv || {};
  var operation = String(args.operation || '');
  var lookupField = operation === 'lookup' ? 'username_key' : 'user_id';
  var lookupValue = operation === 'lookup' ? String(args.usernameKey || '') : String(args.userId || '');

  var sheets = Application.Sheet.GetSheets();
  var sheet = sheets.find(function (item) { return item.name === '用户数据'; });
  if (!sheet) return { ok: false, error: 'table_not_found' };

  if (operation === 'register') {
    if (!/^[a-f0-9-]{36}$/.test(String(args.userId || '')) || !/^[a-z0-9_-]{3,32}$/.test(String(args.usernameKey || ''))) {
      return { ok: false, error: 'invalid_user' };
    }
    var existing = findRecord(sheet, 'username_key', args.usernameKey);
    if (existing) return { ok: true, exists: true };
    Application.Record.CreateRecords({
      SheetId: sheet.id,
      Records: [{ fields: {
        user_id: String(args.userId),
        username: String(args.username || ''),
        username_key: String(args.usernameKey),
        password_salt: String(args.passwordSalt || ''),
        password_hash: String(args.passwordHash || ''),
        payload: ''
      } }]
    });
    return { ok: true, exists: false };
  }

  if (!['lookup', 'get', 'put'].includes(operation) || !lookupValue) return { ok: false, error: 'invalid_operation' };
  var record = findRecord(sheet, lookupField, lookupValue);
  if (operation === 'lookup') {
    var fields = record && getFields(record);
    return { ok: true, user: fields ? {
      user_id: String(fields.user_id || ''),
      username: String(fields.username || ''),
      password_salt: String(fields.password_salt || ''),
      password_hash: String(fields.password_hash || '')
    } : null };
  }
  if (operation === 'get') {
    var userFields = record && getFields(record);
    return { ok: true, payload: userFields ? String(userFields.payload || '') : null };
  }
  if (!record || typeof args.payload !== 'string' || args.payload.length > 95000) return { ok: false, error: 'invalid_payload' };
  Application.Record.UpdateRecords({
    SheetId: sheet.id,
    Records: [{ id: record.id || record.Id, fields: { payload: args.payload } }]
  });
  return { ok: true };
}

function getFields(record) {
  return record.fields || record.Fields || {};
}

function findRecord(sheet, field, value) {
  var records = Application.Record.GetRecords({
    SheetId: sheet.id,
    Fields: ['user_id', 'username', 'username_key', 'password_salt', 'password_hash', 'payload'],
    MaxRecords: 2,
    Filter: { mode: 'AND', criteria: [{ field: field, op: 'Equals', values: [String(value)] }] }
  });
  var list = Array.isArray(records) ? records : (records && (records.records || records.Records)) || [];
  return list.find(function (item) { return String(getFields(item)[field] || '') === String(value); }) || null;
}

return main();
