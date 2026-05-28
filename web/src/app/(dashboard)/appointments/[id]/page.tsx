import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Header } from "@/components/shared/header";
import { formatDate, calculateAge } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, Clock, Calendar, Stethoscope, FileText,
  FlaskConical, Printer, User, Phone, Activity,
} from "lucide-react";
import { AppointmentActions } from "@/components/shared/appointment-actions";

interface Props { params: Promise<{ id: string }> }

const STATUS_COLOR: Record<string, string> = {
  scheduled:   "bg-blue-100 text-blue-700",
  confirmed:   "bg-green-100 text-green-700",
  arrived:     "bg-teal-100 text-teal-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed:   "bg-gray-100 text-gray-600",
  cancelled:   "bg-red-100 text-red-700",
  no_show:     "bg-orange-100 text-orange-700",
};

export default async function AppointmentDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;

  const appt = await prisma.appointment.findFirst({
    where:   { id, clinicId: user.clinic_id },
    include: {
      patient: {
        select: {
          id: true, fullName: true, phone: true, patientCode: true,
          dateOfBirth: true, gender: true, allergies: true,
        },
      },
      doctor: { select: { fullName: true } },
    },
  });

  if (!appt) notFound();

  // Recent visits for this patient (to show past consultations)
  const recentVisits = await prisma.visit.findMany({
    where:   { patientId: appt.patientId, clinicId: user.clinic_id },
    orderBy: { visitDate: "desc" },
    take:    5,
    include: { prescription: { select: { id: true } } },
  });

  const age  = calculateAge(appt.patient.dateOfBirth);
  const time = new Date(appt.scheduledAt).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const canAct = !["completed", "cancelled", "no_show"].includes(appt.status);

  return (
    <>
      <Header title="Appointment" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Back */}
          <div className="flex items-center gap-3">
            <Link href="/appointments" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Appointment Detail</h2>
              <p className="text-sm text-muted-foreground">{formatDate(appt.scheduledAt)} at {time}</p>
            </div>
            <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[appt.status] ?? "bg-gray-100 text-gray-600"}`}>
              {appt.status.replace(/_/g, " ")}
            </span>
          </div>

          {/* Appointment info */}
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{formatDate(appt.scheduledAt)} · {time}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{appt.duration} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground capitalize">
                <Activity className="w-4 h-4 shrink-0" />
                <span>{appt.appointmentType.replace(/_/g, " ")}</span>
              </div>
            </div>
            {appt.notes && (
              <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">{appt.notes}</p>
            )}
            {appt.doctor && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Doctor:</span> {appt.doctor.fullName}
              </p>
            )}
            {canAct && (
              <div className="pt-2 border-t border-border flex justify-end">
                <AppointmentActions id={appt.id} status={appt.status} />
              </div>
            )}
          </div>

          {/* Patient card */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                {appt.patient.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/patients/${appt.patient.id}`}
                    className="font-semibold hover:text-primary transition-colors">
                    {appt.patient.fullName}
                  </Link>
                  <span className="text-xs font-mono text-muted-foreground">{appt.patient.patientCode}</span>
                </div>
                <div className="flex gap-4 mt-1 flex-wrap">
                  {appt.patient.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />{appt.patient.phone}
                    </span>
                  )}
                  {(age !== null || appt.patient.gender) && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {age !== null ? `${age} yrs` : ""}{age !== null && appt.patient.gender ? " · " : ""}
                      {appt.patient.gender && <span className="capitalize">{appt.patient.gender}</span>}
                    </span>
                  )}
                </div>
                {appt.patient.allergies && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    ⚠ Allergies: {appt.patient.allergies}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Consultation tab */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" /> Consultation
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start a new consultation or open an existing prescription
              </p>
            </div>
            <div className="p-5 flex flex-wrap gap-3">
              <Link
                href={`/visits/new?patientId=${appt.patientId}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                <Stethoscope className="w-4 h-4" /> Start Consultation
              </Link>
              <Link
                href={`/visits/new?patientId=${appt.patientId}`}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                <FlaskConical className="w-4 h-4" /> New Prescription
              </Link>
              <Link
                href={`/billing/new?patientId=${appt.patientId}`}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                <FileText className="w-4 h-4" /> New Invoice
              </Link>
            </div>
          </div>

          {/* Past visits */}
          {recentVisits.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <h3 className="font-semibold text-sm">Past Visits</h3>
                <Link href={`/patients/${appt.patientId}/visits`}
                  className="text-xs text-primary hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-border">
                {recentVisits.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium capitalize">{v.visitType?.replace("_", " ") ?? "Visit"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(v.visitDate)}</p>
                      {v.chiefComplaint && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{v.chiefComplaint}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.status === "completed" ? "bg-green-100 text-green-700"
                        : v.status === "locked"   ? "bg-gray-100 text-gray-600"
                        : "bg-blue-100 text-blue-700"
                      }`}>{v.status}</span>
                      {v.prescription && (
                        <Link href={`/visits/${v.id}/prescription/print`}
                          className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Printer className="w-3 h-3" /> Print Rx
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
