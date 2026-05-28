"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/shared/header";
import {
  ArrowLeft,
  Database,
  Loader2,
  Download,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  RefreshCw,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
}

interface DatabaseDetails {
  databasePath: string;
  databaseSize: number;
  backups: BackupFile[];
}

export default function DatabaseBackupPage() {
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [details, setDetails] = useState<DatabaseDetails | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  // Diagnostic Logs States
  const [logContent, setLogContent] = useState("");
  const [logPath, setLogPath] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/settings/database?logs=true");
      const json = await res.json();
      if (json.data) {
        setLogContent(json.data.logContent);
        setLogPath(json.data.logPath);
      } else {
        setLogContent("Failed to load logs: " + (json.error?.message ?? "unknown error"));
      }
    } catch {
      setLogContent("Failed to load logs from server.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (showLogs) {
      fetchLogs();
    }
  }, [showLogs]);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logContent);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const fetchDetails = () => {
    setError("");
    fetch("/api/settings/database")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setDetails(json.data);
        } else {
          setError(json.error?.message ?? "Failed to load database details.");
        }
      })
      .catch(() => setError("Failed to connect to database settings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleBackup = async () => {
    setBackingUp(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings/database", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Failed to perform database backup.");
      } else {
        setSuccess("Database backup created successfully!");
        fetchDetails();
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      setError("Failed to trigger database backup.");
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (filename: string) => {
    setRestoring(filename);
    setShowConfirm(null);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings/database", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Failed to restore database backup.");
      } else {
        setSuccess("Database restored successfully! Reloading page in 3 seconds...");
        fetchDetails();
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch {
      setError("Failed to restore database backup.");
    } finally {
      setRestoring(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <>
        <Header title="Database Settings" />
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Reading database statistics...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Database Settings" />
      <div className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
        <div className="max-w-4xl mx-auto">
          {/* Header section */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/settings" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold flex items-center gap-2 text-lg">
                <Database className="w-5 h-5 text-primary" /> Database Backup & Restore
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage data security, perform manual backups, or roll back clinic files
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats section */}
            <div className="md:col-span-2 space-y-6">
              {/* Active DB Stats */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
                <h3 className="font-semibold text-sm flex items-center gap-2 border-b border-border pb-3 uppercase tracking-wider text-muted-foreground">
                  <HardDrive className="w-4 h-4 text-primary" /> Active Database Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground font-medium">Database File:</span>
                    <span className="col-span-2 font-mono text-xs bg-muted p-2 rounded break-all select-all">
                      {details?.databasePath}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm items-center">
                    <span className="text-muted-foreground font-medium">Active Size:</span>
                    <span className="col-span-2 font-semibold">
                      {details ? formatSize(details.databaseSize) : "Unknown"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm items-center">
                    <span className="text-muted-foreground font-medium">Auto-Backups:</span>
                    <span className="col-span-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active (Runs every 30 minutes)
                    </span>
                  </div>
                </div>
              </div>

              {/* Backups List */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                    <RefreshCw className="w-4 h-4 text-primary" /> Available Backups
                  </h3>
                  <span className="text-xs text-muted-foreground font-medium">
                    Limit: Last 10 backups kept
                  </span>
                </div>

                {!details?.backups.length ? (
                  <div className="text-center py-8 text-muted-foreground text-sm space-y-1">
                    <Database className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p>No backups available yet.</p>
                    <p className="text-xs text-muted-foreground/80">
                      Auto-backups run every 30 minutes while using the clinic app.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                          <th className="py-2.5">Backup Time</th>
                          <th className="py-2.5">File Size</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {details.backups.map((b) => (
                          <tr key={b.filename} className="hover:bg-muted/10 group">
                            <td className="py-3 font-medium">
                              {formatTimestamp(b.createdAt)}
                            </td>
                            <td className="py-3 text-muted-foreground font-mono text-xs">
                              {formatSize(b.size)}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                disabled={!!restoring || backingUp}
                                onClick={() => setShowConfirm(b.filename)}
                                className="px-3 py-1 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 transition-colors text-xs font-medium rounded-lg"
                              >
                                Restore
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Logs Viewer section */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                    <FileText className="w-4 h-4 text-primary" /> Application Diagnostic Logs
                  </h3>
                  <div className="flex items-center gap-2">
                    {showLogs && (
                      <>
                        <button
                          onClick={handleCopyLogs}
                          disabled={!logContent || loadingLogs}
                          className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground transition-colors text-[11px] font-medium rounded-lg flex items-center gap-1 border border-border"
                        >
                          {copiedLogs ? "Copied!" : "Copy Logs"}
                        </button>
                        <button
                          onClick={fetchLogs}
                          disabled={loadingLogs}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-lg"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowLogs(!showLogs)}
                      className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-medium rounded-lg"
                    >
                      {showLogs ? "Hide Logs" : "View Logs"}
                    </button>
                  </div>
                </div>

                {!showLogs ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The application maintains a secure, local diagnostic server log stream inside Windows AppData. View recent diagnostic entries here for effortless debugging and system troubleshooting.
                  </p>
                ) : (
                  <div className="space-y-3 animate-in fade-in-50 duration-200">
                    {logPath && (
                      <div className="text-[11px] text-muted-foreground font-mono bg-muted/50 p-2 rounded border border-border break-all">
                        <span className="font-semibold">Log File Location: </span>
                        {logPath}
                      </div>
                    )}

                    {loadingLogs ? (
                      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Loading log file content...
                      </div>
                    ) : (
                      <div className="relative">
                        <pre className="bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-lg p-4 font-mono text-[11px] max-h-72 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed scrollbar-thin scrollbar-thumb-muted">
                          {logContent}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Manual actions column */}
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
                <h3 className="font-semibold text-sm border-b border-border pb-3 uppercase tracking-wider text-muted-foreground">
                  Manual Backup
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Trigger an immediate snapshot copy of your current clinic database. This is highly recommended before performing staff revisions or inventory uploads.
                </p>
                <button
                  onClick={handleBackup}
                  disabled={backingUp || !!restoring}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors text-sm"
                >
                  {backingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {backingUp ? "Creating Backup…" : "Backup Database Now"}
                </button>
              </div>

              {/* Danger zone advice */}
              <div className="bg-card rounded-xl border border-destructive/20 p-6 space-y-3 shadow-sm bg-destructive/5">
                <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" /> Important Notice
                </div>
                <ul className="text-xs text-destructive/80 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Restoring overwrites active clinic records completely.</li>
                  <li>Any records saved after the backup time will be lost.</li>
                  <li>Ensure all other screens are saved before restoring.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feedback section */}
          {(error || success) && (
            <div className="mt-6">
              {error && (
                <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              )}
              {success && (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>{success}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-destructive border-b border-border pb-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground">Confirm Database Restore</h3>
                <p className="text-xs text-muted-foreground">High-risk action</p>
              </div>
            </div>

            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                You are about to restore the database to the snapshot created on:
              </p>
              <p className="font-semibold text-foreground bg-muted p-2 rounded text-center">
                {formatTimestamp(
                  details?.backups.find((b) => b.filename === showConfirm)?.createdAt ?? ""
                )}
              </p>
              <p className="text-xs text-destructive font-medium bg-destructive/5 p-2 rounded border border-destructive/10">
                WARNING: Overwriting is permanent. All clinic activity registered after this backup timestamp will be erased.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={!!restoring}
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-2 border border-border hover:bg-muted transition-colors rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                disabled={!!restoring}
                onClick={() => handleRestore(showConfirm)}
                className="flex-1 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60 transition-colors rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
              >
                {restoring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {restoring ? "Restoring…" : "Confirm & Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
