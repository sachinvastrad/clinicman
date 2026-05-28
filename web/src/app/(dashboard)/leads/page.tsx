import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, Users2, Kanban, BarChart2 } from "lucide-react";

export default async function LeadsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const leads = await prisma.lead.findMany({
    where:   { clinicId: user.clinic_id },
    orderBy: { createdAt: "desc" },
    take:    100,
  });

  const statusColor: Record<string, string> = {
    new:          "bg-blue-100 text-blue-700",
    contacted:    "bg-yellow-100 text-yellow-700",
    interested:   "bg-teal-100 text-teal-700",
    converted:    "bg-green-100 text-green-700",
    not_interested:"bg-gray-100 text-gray-600",
    lost:         "bg-red-100 text-red-700",
  };

  return (
    <>
      <Header title="Leads" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Lead Pipeline</h2>
            <p className="text-sm text-muted-foreground">{leads.length} lead{leads.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/leads/analytics"
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              <BarChart2 className="w-4 h-4" /> Analytics
            </Link>
            <Link href="/leads/kanban"
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              <Kanban className="w-4 h-4" /> Kanban
            </Link>
            <Link href="/leads/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Lead
            </Link>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No leads yet</p>
            <Link href="/leads/new" className="mt-4 text-sm text-primary hover:underline">Add first lead</Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Interest</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/leads/${lead.id}`} className="hover:text-primary transition-colors">{lead.fullName}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{lead.source?.replace("_", " ") ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.interestedIn ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
