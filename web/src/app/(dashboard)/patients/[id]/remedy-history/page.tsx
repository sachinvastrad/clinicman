import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FlaskConical, Pill } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default async function RemedyHistoryPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: user.clinic_id },
    select: { fullName: true, patientCode: true },
  });
  if (!patient) notFound();

  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: id, doctor: { clinicId: user.clinic_id } },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      visit: { select: { visitDate: true, diagnosis: true, chiefComplaint: true } },
    },
  });

  return (
    <>
      <Header title={`${patient.fullName} — Remedy History`} />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <Link href={`/patients/${id}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="font-semibold">{patient.fullName}</h2>
            <p className="text-sm text-muted-foreground font-mono">{patient.patientCode}</p>
          </div>
        </div>

        {prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FlaskConical className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No prescriptions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="bg-card rounded-xl border border-border p-5">
                {/* Prescription header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(rx.createdAt)}</p>
                    {rx.visit?.visitDate && (
                      <p className="text-xs text-muted-foreground">Visit: {formatDate(rx.visit.visitDate)}</p>
                    )}
                    {rx.visit?.diagnosis && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">Dx:</span> {rx.visit.diagnosis}
                      </p>
                    )}
                    {rx.visit?.chiefComplaint && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">C/C:</span> {rx.visit.chiefComplaint}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {rx.whatsappSent && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">WhatsApp Sent</span>
                    )}
                  </div>
                </div>

                {/* Remedy items */}
                <div className="space-y-1.5">
                  {rx.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <Pill className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                      <div>
                        <span className="font-medium">{item.remedyName}</span>
                        {item.potency && <span className="text-muted-foreground ml-1">{item.potency}</span>}
                        {item.dose && <span className="text-muted-foreground"> · {item.dose}</span>}
                        {item.frequency && <span className="text-muted-foreground"> · {item.frequency}</span>}
                        {item.duration && <span className="text-muted-foreground"> · {item.duration}</span>}
                        {item.instructions && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.instructions}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {rx.dietaryNotes && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    <span className="font-medium text-foreground">Dietary Notes:</span> {rx.dietaryNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
