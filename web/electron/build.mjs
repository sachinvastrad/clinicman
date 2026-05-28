// Stage everything electron-builder needs into a clean `dist-app/` folder.
//
// Layout produced (this is what process.resourcesPath/app/ looks like inside
// the packaged app):
//
//   dist-app/
//     .next/
//       standalone/   ← Next.js server bundle (has its own node_modules)
//         server.js
//         public/     ← copied from web/public
//         .next/static/   ← copied from web/.next/static
//         prisma/     ← schema (some Prisma engines look for this at runtime)
//     prisma/
//       seed.db       ← starter SQLite DB (used as template on first launch)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const out = path.join(webRoot, "dist-app");
const standaloneSrc = path.join(webRoot, ".next", "standalone");
const standaloneDst = path.join(out, ".next", "standalone");

if (!fs.existsSync(standaloneSrc)) {
  console.error(`Run "pnpm build" first — missing ${standaloneSrc}`);
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, ".next"), { recursive: true });

// 1. Copy the standalone server bundle (server.js + its node_modules tree).
fs.cpSync(standaloneSrc, standaloneDst, { recursive: true });

// 1b. Hoist any pnpm-stored packages that didn't make it to the top of
//     node_modules. Next.js's standalone copier normally symlinks each
//     hoisted dep from `.pnpm/<pkg>@<ver>/node_modules/<pkg>` to
//     `node_modules/<pkg>`. When fs.symlink falls back to copy on accounts
//     without symlink privilege, some of those top-level entries can come
//     up empty or missing (styled-jsx is the canonical offender). Replicate
//     pnpm's hoisted layout by hand: for every `.pnpm/<dir>/node_modules/<x>`
//     that exists, ensure `node_modules/<x>` is a real copy of it.
const standaloneNm = path.join(standaloneDst, "node_modules");
const pnpmDir = path.join(standaloneNm, ".pnpm");
if (fs.existsSync(pnpmDir)) {
  let hoistedCount = 0;
  for (const pkgVer of fs.readdirSync(pnpmDir)) {
    const inner = path.join(pnpmDir, pkgVer, "node_modules");
    if (!fs.existsSync(inner)) continue;
    for (const name of fs.readdirSync(inner)) {
      if (name.startsWith(".")) continue; // .bin etc.
      const src = path.join(inner, name);
      // Scoped packages: name is "@scope", we walk one level deeper.
      if (name.startsWith("@")) {
        for (const scoped of fs.readdirSync(src)) {
          const scopedSrc = path.join(src, scoped);
          const scopedDst = path.join(standaloneNm, name, scoped);
          if (!fs.existsSync(scopedDst) || isEmptyDir(scopedDst)) {
            fs.rmSync(scopedDst, { recursive: true, force: true });
            fs.mkdirSync(path.dirname(scopedDst), { recursive: true });
            fs.cpSync(scopedSrc, scopedDst, { recursive: true });
            hoistedCount++;
          }
        }
      } else {
        const dst = path.join(standaloneNm, name);
        if (!fs.existsSync(dst) || isEmptyDir(dst)) {
          fs.rmSync(dst, { recursive: true, force: true });
          fs.cpSync(src, dst, { recursive: true });
          hoistedCount++;
        }
      }
    }
  }
  console.log(`Hoisted ${hoistedCount} packages from .pnpm into top-level node_modules.`);
}

function isEmptyDir(p) {
  try { return fs.statSync(p).isDirectory() && fs.readdirSync(p).length === 0; }
  catch { return false; }
}

// 2. Static assets — the standalone server.js serves these from
//    `<standalone>/public` and `<standalone>/.next/static` if present.
const publicSrc = path.join(webRoot, "public");
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, path.join(standaloneDst, "public"), { recursive: true });
}
const staticSrc = path.join(webRoot, ".next", "static");
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, path.join(standaloneDst, ".next", "static"), { recursive: true });
}

// 3. Prisma schema next to the standalone bundle. Some engines look here.
const prismaSchemaSrc = path.join(webRoot, "prisma", "schema.prisma");
if (fs.existsSync(prismaSchemaSrc)) {
  fs.mkdirSync(path.join(standaloneDst, "prisma"), { recursive: true });
  fs.copyFileSync(prismaSchemaSrc, path.join(standaloneDst, "prisma", "schema.prisma"));
}

// 3b. Copy migrations folder next to standalone bundle for startup database upgrades.
const migrationsSrc = path.join(webRoot, "prisma", "migrations");
if (fs.existsSync(migrationsSrc)) {
  fs.cpSync(migrationsSrc, path.join(standaloneDst, "prisma", "migrations"), { recursive: true });
}

// 4. Starter DB. The current dev.db has been seeded with the demo clinic +
//    users + yoga library; ship that as the template DB for first launch.
const seedDb = path.join(webRoot, "prisma", "dev.db");
if (fs.existsSync(seedDb)) {
  fs.mkdirSync(path.join(out, "prisma"), { recursive: true });
  fs.copyFileSync(seedDb, path.join(out, "prisma", "seed.db"));
}

console.log(`Desktop bundle staged at ${out}`);
