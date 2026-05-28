import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/shared/header";
import { LeadAnalyticsCharts } from "@/components/leads/analytics-charts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function LeadAnalyticsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const leads = await prisma.lead.findMany({
    where: { clinicId: user.clinic_id },
    select: { status: true, source: true, createdAt: true },
  });

  // --- group by status ---
  const statusMap: Record<string, number> = {};
  for (const l of leads) {
    statusMap[l.status] = (statusMap[l.status] ?? 0) + 1;
  }
  const ALL_STATUSES = ["new", "contacted", "interested", "not_interested", "converted", "lost"];
  const byStatus = ALL_STATUSES.map((s) => ({ status: s, count: statusMap[s] ?? 0 }));

  // --- group by source ---
  const sourceMap: Record<string, number> = {};
  for (const l of leads) {
    const src = l.source ?? "unknown";
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
  }
  const bySource = Object.entries(sourceMap).map(([source, count]) => ({ source, count }));

  // --- group by month (last 6) ---
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
    });
  }
  const monthCountMap: Record<string, number> = {};
  for (const l of leads) {
    const d = new Date(l.createdAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthCountMap[k] = (monthCountMap[k] ?? 0) + 1;
  }
  const byMonth = months.map(({ key, label }) => ({ month: label, count: monthCountMap[key] ?? 0 }));

  // --- summary ---
  const totalLeads = leads.length;
  const converted = statusMap["converted"] ?? 0;
  const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;
  const recentMonthTotal = byMonth.reduce((s, m) => s + m.count, 0);
  const avgPerMonth = recentMonthTotal / 6;

  return (
    <>
      <Header title="Lead Analytics" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/leads" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="font-semibold">Lead Analytics</h2>
            <p className="text-sm text-muted-foreground">Performance overview and trends</p>
          </div>
        </div>

        <LeadAnalyticsCharts
          byStatus={byStatus}
          bySource={bySource}
          byMonth={byMonth}
          totalLeads={totalLeads}
          converted={converted}
          conversionRate={conversionRate}
          avgPerMonth={avgPerMonth}
        />
      </div>
    </>
  );
}
