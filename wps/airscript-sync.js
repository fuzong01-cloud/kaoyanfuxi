// Copy this code into a WPS AirScript "文档共享脚本" attached to your multidimensional table.
// Create one table named “学习记录” with exactly two text fields: sync_hash and payload.

function main() {
  var args = Context.argv || {};
  var operation = args.operation;
  var keyHash = String(args.keyHash || '');
  if (!/^[a-f0-9]{64}$/.test(keyHash)) return { ok: false, error: 'invalid_key' };

  var sheets = Application.Sheet.GetSheets();
  var sheet = sheets.find(function (item) { return item.name === '学习记录'; });
  if (!sheet) return { ok: false, error: 'table_not_found' };

  var records = Application.Record.GetRecords({
    SheetId: sheet.id,
    Fields: ['sync_hash', 'payload'],
    MaxRecords: 2,
    Filter: {
      mode: 'AND',
      criteria: [{ field: 'sync_hash', op: 'Equals', values: [keyHash] }]
    }
  });
  var list = Array.isArray(records) ? records : (records && (records.records || records.Records)) || [];
  var record = list.find(function (item) {
    var fields = item.fields || item.Fields || {};
    return fields.sync_hash === keyHash;
  });

  if (operation === 'get') {
    var recordFields = record && (record.fields || record.Fields);
    return { ok: true, payload: record ? String(recordFields.payload || '') : null };
  }
  if (operation !== 'put' || typeof args.payload !== 'string' || args.payload.length > 95000) {
    return { ok: false, error: 'invalid_payload' };
  }

  var fields = { sync_hash: keyHash, payload: args.payload };
  if (record) {
    Application.Record.UpdateRecords({
      SheetId: sheet.id,
      Records: [{ id: record.id || record.Id, fields: fields }]
    });
  } else {
    Application.Record.CreateRecords({
      SheetId: sheet.id,
      Records: [{ fields: fields }]
    });
  }
  return { ok: true };
}

return main();
