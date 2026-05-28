// Electron main process for Sachi Homeopathic Clinic desktop app.
// Dev mode  : waits for `next dev` on http://localhost:3000 and loads it.
// Production: spawns the bundled Next.js standalone server, then loads it.

const { app, BrowserWindow, dialog, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { spawn } = require("child_process");

const isDev = !app.isPackaged;

let mainWindow = null;
let serverProcess = null;
let serverPort = null;

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = require("http").get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for ${url}`));
        setTimeout(tick, 300);
      });
    };
    tick();
  });
}

// Perform database backup, keeping up to 10 backups
function runAutoBackup(dbPath, userData) {
  try {
    const backupsDir = path.join(userData, "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `clinicman_backup_${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupName);

    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`[Auto-Backup] Database backed up to ${backupPath}`);

      // Keep only last 10 backups
      const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith("clinicman_backup_") && f.endsWith(".db"))
        .map(f => ({ name: f, time: fs.statSync(path.join(backupsDir, f)).mtime.getTime() }))
        .sort((a, b) => a.time - b.time);

      while (files.length > 10) {
        const oldest = files.shift();
        if (oldest) {
          fs.unlinkSync(path.join(backupsDir, oldest.name));
          console.log(`[Auto-Backup] Deleted oldest backup ${oldest.name}`);
        }
      }
    }
  } catch (err) {
    console.error("[Auto-Backup] Error performing backup:", err);
  }
}

// On first launch, copy the bundled starter DB into userData so the user has a
// writable copy that survives upgrades / uninstalls.
function ensureUserDb() {
  const userData = app.getPath("userData");
  const userDbPath = path.join(userData, "clinicman.db");
  if (!fs.existsSync(userDbPath)) {
    const bundledDb = path.join(process.resourcesPath, "app", "prisma", "seed.db");
    if (fs.existsSync(bundledDb)) {
      fs.mkdirSync(userData, { recursive: true });
      fs.copyFileSync(bundledDb, userDbPath);
    }
  }

  // Ensure the database file is always writable, even if copied from a read-only installer path
  if (fs.existsSync(userDbPath)) {
    try {
      fs.chmodSync(userDbPath, 0o666);
    } catch (err) {
      console.error("Failed to make database writable:", err);
    }
  }

  return userDbPath;
}

async function startNextServer() {
  // In a packaged app, the standalone Next.js build is at:
  //   <resources>/app/.next/standalone/server.js
  // with its own minimal node_modules next to it.
  const standaloneDir = path.join(process.resourcesPath, "app", ".next", "standalone");
  const serverEntry = path.join(standaloneDir, "server.js");

  if (!fs.existsSync(serverEntry)) {
    throw new Error(`server.js not found at ${serverEntry}`);
  }

  const port = await findFreePort();
  const dbPath = ensureUserDb();
  const userData = app.getPath("userData");

  // Create/append server logs in AppData for easy remote diagnostics
  const logPath = path.join(userData, "clinicman.log");
  const logStream = fs.createWriteStream(logPath, { flags: "a" });
  logStream.write(`\n--- Session started at ${new Date().toISOString()} ---\n`);

  // Normalize Windows backslashes to forward slashes and percent-encode spaces for Prisma SQLite URL parsing
  const normalizedDbPath = dbPath.replace(/\\/g, "/").replace(/ /g, "%20");

  // Trigger database auto-backup immediately on boot, then every 30 minutes
  runAutoBackup(dbPath, userData);
  setInterval(() => {
    runAutoBackup(dbPath, userData);
  }, 30 * 60 * 1000);

  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      // Tell Electron's bundled Node to run the script directly (not as Electron).
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: `file:${normalizedDbPath}`,
      // SESSION_SECRET should be stable across launches.
      SESSION_SECRET: process.env.SESSION_SECRET ?? "drman-super-secret-session-key-min-32-chars!!",
      // We serve over plain http://127.0.0.1, so cookies must not be Secure-only.
      INSECURE_COOKIES: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (b) => {
    process.stdout.write(`[next] ${b}`);
    logStream.write(`[STDOUT] ${b}`);
  });
  serverProcess.stderr.on("data", (b) => {
    process.stderr.write(`[next!] ${b}`);
    logStream.write(`[STDERR] ${b}`);
  });
  serverProcess.on("exit", (code) => {
    logStream.write(`[EXIT] Next.js server exited with code ${code}\n`);
    if (code !== 0 && code !== null) {
      console.error(`Next.js server exited with code ${code}`);
    }
  });

  await waitForServer(`http://127.0.0.1:${port}/`);
  serverPort = port;
  return port;
}

function createWindow(targetUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "Sachi Homeopathic Clinic",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // Open external http(s) links in the user's default browser, not inside Electron.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.loadURL(targetUrl);
}

app.whenReady().then(async () => {
  // Strip the default menu in production for a cleaner look.
  if (!isDev) Menu.setApplicationMenu(null);

  try {
    const url = isDev
      ? (await waitForServer("http://localhost:3000/"), "http://localhost:3000/")
      : `http://127.0.0.1:${await startNextServer()}/`;
    createWindow(url);
  } catch (err) {
    dialog.showErrorBox("Failed to start clinic app", String(err?.stack ?? err));
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) {
    try { serverProcess.kill(); } catch { /* ignore */ }
  }
});
