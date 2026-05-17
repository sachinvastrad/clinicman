import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Stethoscope } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default async function PatientVisitsPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: user.clinic_id },
    select: { fullName: true, patientCode: true },
  });
  if (!patient) notFound();

  const visits = await prisma.visit.findMany({
    where:   { patientId: id, clinicId: user.clinic_id },
    orderBy: { visitDate: "desc" },
    include: { vitals: true },
  });

  return (
    <>
      <Header title={`${patient.fullName} — Visits`} />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/patients/${id}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">{patient.fullName}</h2>
              <p className="text-sm text-muted-foreground font-mono">{patient.patientCode}</p>
            </div>
          </div>
          <Link href={`/visits/new?patientId=${id}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Stethoscope className="w-4 h-4" /> New Visit
          </Link>
        </div>

        {visits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Stethoscope className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No visits recorded</p>
            <Link href={`/visits/new?patientId=${id}`} className="mt-4 text-sm text-primary hover:underline">
              Record first visit
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <div key={v.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium capitalize">{v.visitType?.replace("_", " ") ?? "Visit"}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(v.visitDate)}</span>
                      {v.improvementScore !== null && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.improvementScore >= 7 ? "bg-green-100 text-green-700"
                          : v.improvementScore >= 4 ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                        }`}>Score {v.improvementScore}/10</span>
                      )}
                    </div>
                    {v.chiefComplaint && <p className="text-sm text-muted-foreground mb-1"><span className="font-medium text-foreground">Complaint:</span> {v.chiefComplaint}</p>}
                    {v.clinicalFindings && <p className="text-sm text-muted-foreground mb-1"><span className="font-medium text-foreground">Findings:</span> {v.clinicalFindings}</p>}
                    {v.diagnosis && <p className="text-sm text-muted-foreground mb-1"><span className="font-medium text-foreground">Diagnosis:</span> {v.diagnosis}</p>}
                    {v.planOfAction && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Plan:</span> {v.planOfAction}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.status === "completed" ? "bg-green-100 text-green-700"
                      : v.status === "locked" ? "bg-gray-100 text-gray-600"
                      : "bg-blue-100 text-blue-700"
                    }`}>{v.status}</span>
                    {v.followUpDate && (
                      <p className="text-xs text-muted-foreground mt-1">Follow-up: {formatDate(v.followUpDate)}</p>
                    )}
                  </div>
                </div>

                {v.vitals && (
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {v.vitals.bp && <span>BP: <strong className="text-foreground">{v.vitals.bp}</strong></span>}
                    {v.vitals.pulse && <span>Pulse: <strong className="text-foreground">{v.vitals.pulse} bpm</strong></span>}
                    {v.vitals.temperature && <span>Temp: <strong className="text-foreground">{v.vitals.temperature}°F</strong></span>}
                    {v.vitals.weight && <span>Weight: <strong className="text-foreground">{v.vitals.weight} kg</strong></span>}
                    {v.vitals.spo2 && <span>SpO₂: <strong className="text-foreground">{v.vitals.spo2}%</strong></span>}
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
