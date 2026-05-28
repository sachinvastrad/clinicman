import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const rawPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"] });

let migrationPromise: Promise<void> | null = null;

function getMigrationPromise(client: PrismaClient): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = ensureDbMigrations(client);
  }
  return migrationPromise;
}

// Check and automatically run migrations on startup
async function ensureDbMigrations(client: PrismaClient) {
  try {
    // 1. Check if patients table already has height_cm column
    const tableInfo: any[] = await client.$queryRawUnsafe(`PRAGMA table_info(patients);`);
    const hasHeightCm = tableInfo.some((col: any) => col.name === "height_cm");

    if (!hasHeightCm) {
      console.log("[Migration] SQLite database schema is outdated. Applying additive migrations...");
      
      // Determine the path to migration file
      // In production packaged apps, process.cwd() is the standalone directory
      const migrationFile = path.join(process.cwd(), "prisma", "migrations", "20260521120000_diet_gen_v1", "migration.sql");
      
      if (fs.existsSync(migrationFile)) {
        console.log(`[Migration] Reading migration SQL from ${migrationFile}`);
        const sqlContent = fs.readFileSync(migrationFile, "utf8");
        
        // Clean comments and split SQL statements.
        // SQLite does not support executing multiple statements in a single queryRaw,
        // so we must split on semicolon and execute them one-by-one.
        const lines = sqlContent.split(/\r?\n/);
        const cleanLines = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith("--")) {
            return "";
          }
          return line;
        });
        const cleanSql = cleanLines.join("\n");

        // Strip multi-line comments /* ... */
        const noMultiLineComments = cleanSql.replace(/\/\*[\s\S]*?\*\//g, "");

        // Split on semicolon
        const statements = noMultiLineComments
          .split(";")
          .map(s => s.trim())
          .filter(s => s.length > 0);

        console.log(`[Migration] Running ${statements.length} migration statements...`);
        for (const stmt of statements) {
          try {
            await client.$executeRawUnsafe(stmt);
          } catch (stmtErr: any) {
            // Ignore "duplicate column name" or similar errors just in case, but print general errors
            if (!stmtErr?.message?.includes("duplicate column") && !stmtErr?.message?.includes("already exists")) {
              console.warn(`[Migration] Statement warning:`, stmtErr?.message);
            }
          }
        }
        console.log("[Migration] Migration completed successfully!");
      } else {
        console.error(`[Migration] Migration file not found at ${migrationFile}.`);
      }
    } else {
      console.log("[Migration] SQLite database is up-to-date with current schema.");
    }
  } catch (err) {
    console.error("[Migration] Error checking/applying database migrations:", err);
  }
}

// Start migrations immediately in the background
getMigrationPromise(rawPrisma);

// Wrap Prisma Client in a Proxy that intercepts all method calls to wait for migrations to complete
const prismaProxy = new Proxy(rawPrisma, {
  get(target, prop, receiver) {
    const val = Reflect.get(target, prop, receiver);

    // If it's a function on the client itself (e.g. $queryRaw, $executeRaw, $connect, $disconnect)
    if (typeof val === "function") {
      return function (this: any, ...args: any[]) {
        const boundFn = val.bind(target);
        return getMigrationPromise(rawPrisma).then(() => boundFn(...args));
      };
    }

    // If it is a model delegate (like prisma.patient, prisma.visit, etc.)
    if (val && typeof val === "object" && typeof prop === "string" && !prop.startsWith("$") && !prop.startsWith("_")) {
      return new Proxy(val, {
        get(modelTarget, modelProp, modelReceiver) {
          const modelVal = Reflect.get(modelTarget, modelProp, modelReceiver);
          if (typeof modelVal === "function") {
            return function (this: any, ...args: any[]) {
              const boundModelFn = modelVal.bind(modelTarget);
              return getMigrationPromise(rawPrisma).then(() => boundModelFn(...args));
            };
          }
          return modelVal;
        }
      });
    }

    return val;
  }
}) as unknown as PrismaClient;

export const prisma = prismaProxy;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

