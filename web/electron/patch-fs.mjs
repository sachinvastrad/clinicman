// Preloaded with `node --import` before `next build` runs.
//
// Next.js's standalone copy step calls fs.symlink to clone traced files. On
// Windows that needs admin or Developer Mode active in the calling process
// token. When neither applies fs.symlink throws EPERM. This patch falls back
// to a recursive copy so the standalone bundle is still produced — just with
// duplicated files instead of links.

import fs from "node:fs";

const fallback = (target, path) => {
  fs.cpSync(target, path, { recursive: true, dereference: true });
};

const origSync = fs.symlinkSync;
fs.symlinkSync = function (target, path, type) {
  try { return origSync.call(this, target, path, type); }
  catch (err) {
    if (err && (err.code === "EPERM" || err.code === "EACCES")) return fallback(target, path);
    throw err;
  }
};

const origCb = fs.symlink;
fs.symlink = function (target, path, typeOrCb, maybeCb) {
  const cb = typeof typeOrCb === "function" ? typeOrCb : maybeCb;
  const type = typeof typeOrCb === "function" ? undefined : typeOrCb;
  origCb.call(this, target, path, type, (err) => {
    if (err && (err.code === "EPERM" || err.code === "EACCES")) {
      try { fallback(target, path); cb(null); } catch (e) { cb(e); }
      return;
    }
    cb(err);
  });
};

const origPromise = fs.promises.symlink;
fs.promises.symlink = async function (target, path, type) {
  try { return await origPromise.call(this, target, path, type); }
  catch (err) {
    if (err && (err.code === "EPERM" || err.code === "EACCES")) return fallback(target, path);
    throw err;
  }
};
