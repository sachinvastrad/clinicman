import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";
import { Header } from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatDate, cn } from "@/lib/utils";
import { HeroGreeting } from "@/components/dashboard/HeroGreeting";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  Users, Calendar, TrendingUp, UserPlus, AlertCircle,
  Stethoscope, ArrowRight, Receipt, Activity,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const clinicId = user.clinic_id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalPatients, todayAppointments, pendingFollowups, newLeads] = await Promise.all([
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
    { label: "Total Patients",     value: totalPatients,     note: "in your records",   icon: "Users",       href: "/patients" },
    { label: "Appointments Today", value: todayAppointments, note: "scheduled",         icon: "Calendar",    href: "/appointments" },
    { label: "Follow-ups Due",     value: pendingFollowups,  note: "overdue",           icon: "AlertCircle", href: "/appointments", warn: true },
    { label: "New Leads",          value: newLeads,          note: "awaiting contact",  icon: "TrendingUp",  href: "/leads" },
  ] as const;

  const quickActions = [
    { href: "/patients/new",   label: "Register Patient",  description: "Create a new record", icon: "UserPlus"  },
    { href: "/appointments",   label: "Book Appointment",  description: "Schedule a visit",    icon: "Calendar"  },
    { href: "/billing/new",    label: "Create Invoice",    description: "Bill a consultation", icon: "Receipt"   },
    { href: "/leads/new",      label: "Add Lead",          description: "Capture an enquiry",  icon: "TrendingUp" },
  ];

  return (
    <>
      <Header
        title="Dashboard"
        action={
          <Button asChild size="sm" magnetic leadingIcon="Stethoscope">
            <Link href="/visits/new">Start Consultation</Link>
          </Button>
        }
      />

      <div className="relative flex-1 overflow-y-auto bg-mesh bg-grain">
        {/* Ambient aurora behind hero — violet + cyan glow blooming through the dark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[460px] -z-0"
          style={{
            background:
              "radial-gradient(60% 80% at 18% 10%, hsl(var(--primary) / 0.16) 0%, transparent 60%), " +
              "radial-gradient(50% 60% at 85% 0%, hsl(var(--accent-cyan) / 0.10) 0%, transparent 60%), " +
              "radial-gradient(40% 70% at 50% -10%, hsl(var(--primary-glow) / 0.08) 0%, transparent 60%)",
          }}
        />

        <div className="relative max-w-[1280px] mx-auto px-8 py-10">
          {/* Asymmetric Bento-Style Layout Grid */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left Bento Column (Spans 8 columns) */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Highlight greeting panel */}
              <section className="flex items-end justify-between gap-8 flex-wrap bg-card-elevated/20 p-6 rounded-2xl border border-border/40 backdrop-blur-sm">
                <HeroGreeting
                  firstName={user.full_name.split(" ")[0]}
                  todayLabel={formatDate(new Date())}
                  todayAppointments={todayAppointments}
                  pendingFollowups={pendingFollowups}
                />
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="md"
                    magnetic
                    leadingIcon="UserPlus"
                  >
                    <Link href="/patients/new">New Patient</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="md"
                    trailingIcon="ArrowRight"
                  >
                    <Link href="/patients">All Patients</Link>
                  </Button>
                </div>
              </section>

              {/* Asymmetrical KPI layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kpis.map((kpi, i) => (
                  <div key={kpi.label} className={cn(i === 0 && "sm:col-span-2 md:col-span-1")}>
                    <KpiCard
                      index={i}
                      label={kpi.label}
                      value={kpi.value}
                      note={kpi.note}
                      icon={kpi.icon}
                      href={kpi.href}
                      warn={"warn" in kpi ? kpi.warn : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Bento Column (Spans 4 columns) */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Featured Consultation Desk block */}
              <section className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-primary shrink-0 pointer-events-none group-hover:scale-105 transition-transform duration-slow">
                  <Activity className="w-32 h-32" />
                </div>
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                    Consultation Desk
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground-2">
                    Start recording clinical homeopathy metrics.
                  </p>
                </div>
                <Button asChild size="md" className="w-full" magnetic leadingIcon="Stethoscope">
                  <Link href="/visits/new">Start Consultation</Link>
                </Button>
              </section>

              {/* Action grid wrapper */}
              <section className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                    Quick Actions
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground-2">
                    Jump straight to key clinic tasks.
                  </p>
                </div>
                <QuickActions actions={quickActions} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
