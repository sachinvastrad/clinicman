import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Calendar, Plus, Clock, User, Stethoscope } from "lucide-react";
import { AppointmentActions } from "@/components/shared/appointment-actions";

export default async function AppointmentsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId:    user.clinic_id,
      scheduledAt: { gte: today, lt: tomorrow },
    },
    orderBy: { scheduledAt: "asc" },
    include: { patient: { select: { fullName: true, phone: true, patientCode: true } } },
  });

  const statusColor: Record<string, string> = {
    scheduled:   "bg-blue-100 text-blue-700",
    confirmed:   "bg-green-100 text-green-700",
    arrived:     "bg-teal-100 text-teal-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    completed:   "bg-gray-100 text-gray-600",
    cancelled:   "bg-red-100 text-red-700",
    no_show:     "bg-orange-100 text-orange-700",
  };

  return (
    <>
      <Header title="Appointments" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Today&apos;s Schedule</h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(new Date())} · {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/appointments/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Book Appointment
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No appointments today</p>
            <Link href="/appointments/new" className="mt-4 text-sm text-primary hover:underline">
              Book an appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => (
              <div key={appt.id} className="bg-card rounded-xl border border-border p-4">
                <Link href={`/appointments/${appt.id}`} className="flex items-center gap-4 hover:opacity-90 transition-opacity">
                  <div className="w-16 text-center shrink-0">
                    <p className="text-lg font-bold leading-none">
                      {new Date(appt.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3 inline mr-0.5" />{appt.duration}m
                    </p>
                  </div>
                  <div className="h-10 w-px bg-border shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{appt.patient.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />{appt.patient.patientCode} · {appt.patient.phone}
                    </p>
                    {appt.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{appt.notes}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusColor[appt.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {appt.status.replace("_", " ")}
                  </span>
                </Link>
                {/* Status action buttons */}
                {!["completed", "cancelled", "no_show"].includes(appt.status) && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <Link href={`/appointments/${appt.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" /> Open Consultation
                    </Link>
                    <AppointmentActions id={appt.id} status={appt.status} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
