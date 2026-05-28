import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/shared/header";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SecurityAuditPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "admin") redirect("/settings");

  const auditLogs = await prisma.auditLog.findMany({
    where:   { clinicId: user.clinic_id },
    orderBy: { createdAt: "desc" },
    take:    100,
    include: { user: { select: { fullName: true, role: true } } },
  });

  const actionColor: Record<string, string> = {
    "patient.create":  "bg-blue-100 text-blue-700",
    "patient.update":  "bg-yellow-100 text-yellow-700",
    "patient.delete":  "bg-red-100 text-red-700",
    "user.create":     "bg-purple-100 text-purple-700",
    "user.update":     "bg-yellow-100 text-yellow-700",
  };

  return (
    <>
      <Header title="Security & Audit" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Security & Audit Log
              </h2>
              <p className="text-sm text-muted-foreground">
                Last {auditLogs.length} actions in your clinic
              </p>
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
              No audit log entries yet.
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Performed By</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">IP</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map((log) => (
                    <tr key={String(log.id)} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {log.entityType && <span>{log.entityType}</span>}
                        {log.entityId   && <span className="ml-1 truncate max-w-[80px] inline-block align-bottom">{log.entityId.slice(0, 8)}…</span>}
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <p className="font-medium">{log.user.fullName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{log.user.role}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{log.ipAddress ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
