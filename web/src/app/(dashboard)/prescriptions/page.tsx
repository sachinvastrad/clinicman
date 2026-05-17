import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default async function PrescriptionsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const prescriptions = await prisma.prescription.findMany({
    where:   { doctor: { clinicId: user.clinic_id } },
    orderBy: { createdAt: "desc" },
    take:    50,
    include: {
      visit: {
        include: {
          patient: { select: { fullName: true, patientCode: true, id: true } },
        },
      },
      items: true,
    },
  });

  return (
    <>
      <Header title="Prescriptions" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Prescriptions</h2>
            <p className="text-sm text-muted-foreground">{prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No prescriptions yet</p>
            <p className="text-sm text-muted-foreground mt-1">Prescriptions are created during patient visits</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/patients/${rx.visit.patient.id}`}
                      className="font-medium hover:text-primary transition-colors">
                      {rx.visit.patient.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{rx.visit.patient.patientCode}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(rx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rx.whatsappSent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {rx.whatsappSent ? "Sent via WhatsApp" : "Not sent"}
                    </span>
                    {rx.pdfUrl && (
                      <a href={rx.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="block mt-1 text-xs text-primary hover:underline">View PDF</a>
                    )}
                  </div>
                </div>
                {rx.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {rx.items.map((item) => (
                        <span key={item.id} className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-xs font-medium">
                          {item.remedyName} {item.potency}
                          {item.dose && <span className="text-muted-foreground ml-1">· {item.dose}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {rx.dietaryNotes && (
                  <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium">Diet:</span> {rx.dietaryNotes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
