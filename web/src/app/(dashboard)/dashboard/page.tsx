import { getSessionUser } from "@/lib/supabase/server";
import { Header } from "@/components/shared/header";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Users, Calendar, TrendingUp, UserPlus, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const clinicId = user.clinic_id;
  const today    = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalPatients,
    todayAppointments,
    pendingFollowups,
    newLeads,
  ] = await Promise.all([
    prisma.patient.count({ where: { clinicId } }),
    prisma.appointment.count({
      where: { clinicId, scheduledAt: { gte: today }, status: { not: "cancelled" } },
    }),
    prisma.appointment.count({
      where: { clinicId, status: "confirmed", scheduledAt: { lt: today } },
    }),
    prisma.lead.count({ where: { clinicId, status: "new" } }),
  ]);

  const kpis = [
    { label: "Total Patients",        value: totalPatients,    icon: Users,        color: "bg-blue-50 text-blue-600" },
    { label: "Appointments Today",    value: todayAppointments,icon: Calendar,     color: "bg-green-50 text-green-600" },
    { label: "Pending Follow-ups",    value: pendingFollowups, icon: AlertCircle,  color: "bg-orange-50 text-orange-600" },
    { label: "New Leads",             value: newLeads,         icon: TrendingUp,   color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-lg font-semibold">
            Good {getGreeting()}, {user.full_name.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-5 space-y-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <a href="/patients/new" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <UserPlus className="w-4 h-4" /> Register Patient
            </a>
            <a href="/appointments" className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
              <Calendar className="w-4 h-4" /> Book Appointment
            </a>
            <a href="/patients" className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
              <Users className="w-4 h-4" /> View All Patients
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
