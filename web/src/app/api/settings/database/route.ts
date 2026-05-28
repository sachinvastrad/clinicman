import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

// Extract raw file path from DATABASE_URL
function getDbDetails() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const dbPath = path.resolve(decodeURIComponent(dbUrl.replace(/^file:/, "")));
  const dbDir = path.dirname(dbPath);
  const backupsDir = path.join(dbDir, "backups");
  return { dbPath, backupsDir };
}

// GET: list current DB info and all backups or retrieve diagnostic logs
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    }

    const { dbPath, backupsDir } = getDbDetails();
    const dbDir = path.dirname(dbPath);
    const logPath = path.join(dbDir, "clinicman.log");

    // Check if query is specifically requesting diagnostic logs
    const searchParams = req.nextUrl.searchParams;
    if (searchParams.get("logs") === "true") {
      let logContent = "No logs recorded yet.";
      let exists = false;
      if (fs.existsSync(logPath)) {
        exists = true;
        try {
          const stats = fs.statSync(logPath);
          const maxReadBytes = 200000; // ~200KB
          if (stats.size > maxReadBytes) {
            const buffer = Buffer.alloc(maxReadBytes);
            const fd = fs.openSync(logPath, "r");
            fs.readSync(fd, buffer, 0, maxReadBytes, stats.size - maxReadBytes);
            fs.closeSync(fd);
            logContent = "[... Truncated for display ...]\n" + buffer.toString("utf8");
          } else {
            logContent = fs.readFileSync(logPath, "utf8");
          }
        } catch (logReadErr: any) {
          logContent = `Failed to read log file: ${logReadErr?.message}`;
        }
      }
      return NextResponse.json({
        data: {
          exists,
          logPath,
          logContent,
        },
      });
    }

    let databaseSize = 0;
    if (fs.existsSync(dbPath)) {
      databaseSize = fs.statSync(dbPath).size;
    }

    let backups: { filename: string; size: number; createdAt: string }[] = [];
    if (fs.existsSync(backupsDir)) {
      const files = fs.readdirSync(backupsDir);
      backups = files
        .filter((f) => f.startsWith("clinicman_backup_") && f.endsWith(".db"))
        .map((f) => {
          const p = path.join(backupsDir, f);
          const stat = fs.statSync(p);
          return {
            filename: f,
            size: stat.size,
            createdAt: stat.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // newest first
    }

    return NextResponse.json({
      data: {
        databasePath: dbPath,
        databaseSize,
        backups,
      },
    });
  } catch (err: any) {
    console.error("[settings/database] GET error:", err);
    return NextResponse.json({ error: { message: err?.message ?? "Failed to read database details." } }, { status: 500 });
  }
}

// POST: Trigger manual backup immediately
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    }

    const { dbPath, backupsDir } = getDbDetails();
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: { message: "Database file not found." } }, { status: 404 });
    }

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `clinicman_backup_${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupName);

    fs.copyFileSync(dbPath, backupPath);

    // Keep last 10 backups
    const files = fs.readdirSync(backupsDir)
      .filter((f) => f.startsWith("clinicman_backup_") && f.endsWith(".db"))
      .map((f) => ({ name: f, time: fs.statSync(path.join(backupsDir, f)).mtime.getTime() }))
      .sort((a, b) => a.time - b.time);

    while (files.length > 10) {
      const oldest = files.shift();
      if (oldest) {
        fs.unlinkSync(path.join(backupsDir, oldest.name));
      }
    }

    const stat = fs.statSync(backupPath);
    return NextResponse.json({
      data: {
        success: true,
        backup: {
          filename: backupName,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
        },
      },
    });
  } catch (err: any) {
    console.error("[settings/database] POST error:", err);
    return NextResponse.json({ error: { message: err?.message ?? "Failed to perform database backup." } }, { status: 500 });
  }
}

// PUT: Restore a database from a specific backup
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    }

    const { filename } = await req.json();
    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: { message: "Backup filename is required." } }, { status: 400 });
    }

    // Safety: prevent directory traversal
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename) || !filename.startsWith("clinicman_backup_") || !filename.endsWith(".db")) {
      return NextResponse.json({ error: { message: "Invalid backup filename format." } }, { status: 400 });
    }

    const { dbPath, backupsDir } = getDbDetails();
    const backupPath = path.join(backupsDir, filename);

    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: { message: "Backup file does not exist." } }, { status: 404 });
    }

    // Safely copy backup over the live database
    try {
      fs.copyFileSync(backupPath, dbPath);
      // Ensure the database file remains fully writable after restore
      fs.chmodSync(dbPath, 0o666);
    } catch (writeErr: any) {
      console.error("[settings/database] File lock / write error during restore:", writeErr);
      return NextResponse.json({
        error: {
          message: "Database is currently busy or locked by active operations. Please try again in a few seconds.",
        },
      }, { status: 503 });
    }

    return NextResponse.json({
      data: {
        success: true,
      },
    });
  } catch (err: any) {
    console.error("[settings/database] PUT error:", err);
    return NextResponse.json({ error: { message: err?.message ?? "Failed to restore database backup." } }, { status: 500 });
  }
}
