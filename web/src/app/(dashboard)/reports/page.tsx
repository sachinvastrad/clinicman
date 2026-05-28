import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { ReportsCharts } from "@/components/shared/reports-charts";

export default async function ReportsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalPatients,
    newPatientsThisMonth,
    appointmentsThisMonth,
    revenueThisMonth,
    recentPayments,
    recentPatients,
    apptTypeGroups,
  ] = await Promise.all([
    prisma.patient.count({ where: { clinicId: user.clinic_id } }),
    prisma.patient.count({ where: { clinicId: user.clinic_id, createdAt: { gte: start } } }),
    prisma.appointment.count({ where: { clinicId: user.clinic_id, scheduledAt: { gte: start } } }),
    prisma.payment.aggregate({
      where: { clinicId: user.clinic_id, paidAt: { gte: start } },
      _sum:  { amount: true },
    }).catch(() => ({ _sum: { amount: null } })),
    prisma.payment.findMany({
      where:   { clinicId: user.clinic_id, paidAt: { gte: sixMonthsAgo } },
      select:  { amount: true, paidAt: true },
    }),
    prisma.patient.findMany({
      where:  { clinicId: user.clinic_id, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.appointment.groupBy({
      by:    ["appointmentType"],
      where: { clinicId: user.clinic_id },
      _count: { id: true },
    }),
  ]);

  // Build last-6-months labels
  const monthLabels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
  });

  // Group payments by month label
  const revenueByLabel = recentPayments.reduce<Record<string, number>>((acc, p) => {
    const label = new Date(p.paidAt).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    acc[label] = (acc[label] ?? 0) + Number(p.amount);
    return acc;
  }, {});

  // Group patients by month label
  const patientsByLabel = recentPatients.reduce<Record<string, number>>((acc, p) => {
    const label = new Date(p.createdAt).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const monthlyData = monthLabels.map((month) => ({
    month,
    revenue:  Math.round(revenueByLabel[month]  ?? 0),
    patients: patientsByLabel[month] ?? 0,
  }));

  const apptTypes = apptTypeGroups.map((g) => ({
    name:  g.appointmentType as string,
    value: g._count.id,
  }));

  const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

  const stats = [
    { label: "Total Patients",       value: totalPatients.toLocaleString("en-IN"),        icon: Users,       color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "New Patients (Month)", value: newPatientsThisMonth.toLocaleString("en-IN"), icon: TrendingUp,  color: "text-teal-600",   bg: "bg-teal-50"   },
    { label: "Appointments (Month)", value: appointmentsThisMonth.toLocaleString("en-IN"),icon: Calendar,    color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Revenue (Month)",      value: formatCurrency(revenueThisMonth._sum.amount ?? 0), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <>
      <Header title="Reports" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h2 className="font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Overview · {monthLabel}</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <ReportsCharts monthlyData={monthlyData} apptTypes={apptTypes} />
      </div>
    </>
  );
}
