/*
 * CSInterface (bản rút gọn) — cầu nối CEP panel <-> ExtendScript.
 * Chỉ gồm những gì extension này cần: evalScript, getSystemPath.
 * Nếu cần đầy đủ, tải CSInterface.js chính thức của Adobe (CEP-Resources) đè lên file này.
 */
function CSInterface() {}

CSInterface.prototype.hostEnvironment =
  (typeof window !== 'undefined' && window.__adobe_cep__) ?
  JSON.parse(window.__adobe_cep__.getHostEnvironment()) : null;

CSInterface.prototype.evalScript = function (script, callback) {
  if (typeof window === 'undefined' || !window.__adobe_cep__) {
    if (callback) callback('ERR: không chạy trong CEP (mở trong After Effects).');
    return;
  }
  window.__adobe_cep__.evalScript(script, callback || function () {});
};

CSInterface.prototype.getSystemPath = function (pathType) {
  if (!window.__adobe_cep__) return '';
  var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
  return path;
};

// hằng số hay dùng
CSInterface.prototype.SystemPath = {
  EXTENSION: 'extension',
  USER_DATA: 'userData',
  MY_DOCUMENTS: 'myDocuments'
};
var SystemPath = { EXTENSION: 'extension', USER_DATA: 'userData', MY_DOCUMENTS: 'myDocuments' };
