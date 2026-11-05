/**
 * Keep Mentor — Google Apps Script 저장소 (Google Sheets를 DB로 사용)
 *
 * Vercel의 Next.js 서버만 호출한다. 요청마다 SECRET을 확인하므로
 * 웹앱 접근 권한을 "모든 사용자"로 배포해도 SECRET 없이는 읽고 쓸 수 없다.
 *
 * 설정:
 *  1. 새 Google 스프레드시트 → 확장 프로그램 → Apps Script → 이 파일 내용을 붙여 넣기
 *  2. 프로젝트 설정 → 스크립트 속성 → SECRET = (긴 임의 문자열, Vercel의 GAS_SECRET과 동일)
 *  3. 배포 → 새 배포 → 유형: 웹 앱, 실행: 나, 액세스: 모든 사용자 → URL을 Vercel의 GAS_URL에 입력
 *  4. 앱의 /api/setup 을 한 번 호출하면 시트와 헤더가 만들어진다 (README 참고)
 */

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || req.secret !== secret) return out_({ ok: false, error: 'unauthorized' });
    var result;
    switch (req.op) {
      case 'setup': result = setup_(req.sheets); break;
      case 'list': result = list_(req.sheet); break;
      case 'insert': result = withLock_(function () { return insert_(req.sheet, req.row, req.headers); }); break;
      case 'update': result = withLock_(function () { return update_(req.sheet, req.id, req.patch, req.headers); }); break;
      default: return out_({ ok: false, error: 'unknown op' });
    }
    return out_({ ok: true, result: result });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return out_({ ok: true, app: 'keepmentor', note: 'POST only' });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// 시트 생성 + 헤더. 모든 셀을 일반 텍스트로 둬서 날짜·숫자 자동 변환을 막는다.
function setup_(sheets) {
  var made = [];
  Object.keys(sheets).forEach(function (name) {
    var sh = ss_().getSheetByName(name) || ss_().insertSheet(name);
    ensureHeaders_(sh, sheets[name]);
    sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).setNumberFormat('@');
    sh.setFrozenRows(1);
    made.push(name);
  });
  var def = ss_().getSheetByName('Sheet1') || ss_().getSheetByName('시트1');
  if (def && def.getLastRow() === 0 && ss_().getSheets().length > 1) ss_().deleteSheet(def);
  return made;
}

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('시트 없음: ' + name + ' (setup을 먼저 실행하세요)');
  return sh;
}

function headers_(sh) {
  if (sh.getLastColumn() === 0) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
}

function ensureHeaders_(sh, wanted) {
  var have = headers_(sh);
  var missing = (wanted || []).filter(function (h) { return have.indexOf(h) < 0; });
  if (missing.length) {
    sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    have = have.concat(missing);
  }
  return have;
}

function encode_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function decode_(v) {
  if (v === '' || v === null) return undefined;
  if (typeof v !== 'string') return v;
  var t = v.trim();
  if ((t.charAt(0) === '{' && t.charAt(t.length - 1) === '}') || (t.charAt(0) === '[' && t.charAt(t.length - 1) === ']')) {
    try { return JSON.parse(t); } catch (e) { return v; }
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(t) && t.length < 15 && !(t.length > 1 && t.charAt(0) === '0' && t.charAt(1) !== '.')) return Number(t);
  return v;
}

function list_(name) {
  var sh = sheet_(name);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var hs = headers_(sh);
  var values = sh.getRange(2, 1, last - 1, hs.length).getValues();
  return values.filter(function (r) { return r[0] !== ''; }).map(function (r) {
    var o = {};
    hs.forEach(function (h, i) { var d = decode_(r[i]); if (d !== undefined) o[h] = d; });
    return o;
  });
}

function insert_(name, row, wanted) {
  var sh = sheet_(name);
  var hs = ensureHeaders_(sh, (wanted || []).concat(Object.keys(row)));
  var values = hs.map(function (h) { return encode_(row[h]); });
  var r = sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, hs.length).setNumberFormat('@').setValues([values]);
  return row;
}

function update_(name, id, patch, wanted) {
  var sh = sheet_(name);
  var hs = ensureHeaders_(sh, (wanted || []).concat(Object.keys(patch)));
  var last = sh.getLastRow();
  if (last < 2) throw new Error(name + '에서 ' + id + '를 찾을 수 없습니다');
  var ids = sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); });
  var idx = ids.indexOf(String(id));
  if (idx < 0) throw new Error(name + '에서 ' + id + '를 찾을 수 없습니다');
  var rowNum = idx + 2;
  var current = sh.getRange(rowNum, 1, 1, hs.length).getValues()[0];
  var obj = {};
  hs.forEach(function (h, i) { obj[h] = current[i]; });
  Object.keys(patch).forEach(function (k) { if (k !== 'id') obj[k] = encode_(patch[k]); });
  sh.getRange(rowNum, 1, 1, hs.length).setNumberFormat('@').setValues([hs.map(function (h) { return obj[h] === undefined ? '' : obj[h]; })]);
  var res = {};
  hs.forEach(function (h) { var d = decode_(obj[h]); if (d !== undefined) res[h] = d; });
  return res;
}
