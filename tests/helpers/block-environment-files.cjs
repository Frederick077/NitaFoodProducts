// Test-process preload: generated Prisma clients can otherwise autoload .env.
// Installed before tsx, Prisma, dotenv or any application import. No file contents
// are inspected to decide whether access is permitted.
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { syncBuiltinESMExports } = require('node:module');
function blocked(value) {
  try {
    const filename = value instanceof URL ? fileURLToPath(value) : Buffer.isBuffer(value) ? value.toString() : value;
    return typeof filename === 'string' && /^\.env(?:\..*)?$/i.test(path.basename(filename));
  } catch { return false; }
}
function refusal() {
  const error = new Error('Environment file access refused by isolated test preload.');
  error.code = 'NITA_ENV_ACCESS_REFUSED';
  return error;
}
const existsSync = fs.existsSync;
fs.existsSync = function(filename) { return blocked(filename) ? false : existsSync.apply(this, arguments); };
for (const name of ['readFileSync', 'openSync']) {
  const original = fs[name];
  fs[name] = function(filename) { if (blocked(filename)) throw refusal(); return original.apply(this, arguments); };
}
for (const name of ['readFile', 'open']) {
  const original = fs[name];
  fs[name] = function(filename, ...args) {
    if (!blocked(filename)) return original.call(this, filename, ...args);
    const callback = args[args.length - 1];
    if (typeof callback === 'function') { process.nextTick(callback, refusal()); return; }
    throw refusal();
  };
}
for (const name of ['readFile', 'open']) {
  const original = fs.promises[name];
  fs.promises[name] = async function(filename, ...args) { if (blocked(filename)) throw refusal(); return original.call(this, filename, ...args); };
}
syncBuiltinESMExports();
