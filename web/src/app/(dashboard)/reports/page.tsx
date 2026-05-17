import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, Users, Calendar, DollarSign } from "lucide-react";

export default async function ReportsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalPatients, newPatientsThisMonth, appointmentsThisMonth, revenueThisMonth] = await Promise.all([
    prisma.patient.count({ where: { clinicId: user.clinic_id } }),
    prisma.patient.count({ where: { clinicId: user.clinic_id, createdAt: { gte: start } } }),
    prisma.appointment.count({ where: { clinicId: user.clinic_id, scheduledAt: { gte: start } } }),
    prisma.payment.aggregate({ where: { clinicId: user.clinic_id, paidAt: { gte: start } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: null } })),
  ]);

  const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

  const stats = [
    { label: "Total Patients",       value: totalPatients.toLocaleString("en-IN"), icon: Users,      color: "text-blue-600",  bg: "bg-blue-50" },
    { label: "New Patients (Month)", value: newPatientsThisMonth.toLocaleString("en-IN"), icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Appointments (Month)", value: appointmentsThisMonth.toLocaleString("en-IN"), icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
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

        <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">Detailed charts coming in v1.1</p>
          <p className="text-sm text-muted-foreground mt-1">Revenue trends, patient growth, and appointment analytics will be available in the next release.</p>
        </div>
      </div>
    </>
  );
}
