import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/shared/header";
import { formatDate, calculateAge } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, FileText,
  Stethoscope, Activity, MessageCircle, Edit,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientProfilePage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: user.clinic_id },
    include: {
      caseHistory: true,
      visits: {
        orderBy: { visitDate: "desc" },
        take: 5,
        include: { prescription: { include: { items: true } }, vitals: true },
      },
    },
  });

  if (!patient) notFound();

  const age = calculateAge(patient.dateOfBirth);

  return (
    <>
      <Header title={patient.fullName} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Back nav */}
        <div className="flex items-center gap-3">
          <Link href="/patients" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Profile header */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0">
              {patient.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{patient.fullName}</h2>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">{patient.patientCode}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {patient.caseType && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      patient.caseType === "chronic" ? "bg-orange-100 text-orange-700"
                      : patient.caseType === "acute" ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                    }`}>
                      {patient.caseType}
                    </span>
                  )}
                  <Link href={`/patients/${id}/edit`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors">
                    <Edit className="w-3 h-3" /> Edit
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {patient.phone && (
                  <InfoChip icon={Phone} text={patient.phone} />
                )}
                {patient.email && (
                  <InfoChip icon={Mail} text={patient.email} />
                )}
                {age !== null && patient.gender && (
                  <InfoChip icon={Calendar} text={`${age} yrs · ${patient.gender}`} />
                )}
                {patient.address && (
                  <InfoChip icon={MapPin} text={patient.address} />
                )}
              </div>

              {patient.allergies && (
                <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <span className="font-medium">⚠ Allergies:</span> {patient.allergies}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2">
            <ActionButton href={`/visits/new?patientId=${id}`} icon={Stethoscope} label="New Visit" primary />
            <ActionButton href={`/appointments?patientId=${id}`} icon={Calendar} label="Book Appointment" />
            <ActionButton href={`/billing/new?patientId=${id}`} icon={FileText} label="New Invoice" />
            <ActionButton href={`/whatsapp?patientId=${id}`} icon={MessageCircle} label="WhatsApp" />
          </div>
        </div>

        {/* Tabs-like sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visit History */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Visit History</h3>
              <Link href={`/patients/${id}/visits`} className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {patient.visits.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No visits yet</div>
            ) : (
              <div className="divide-y divide-border">
                {patient.visits.map((v) => (
                  <div key={v.id} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize">{v.visitType?.replace("_", " ") ?? "Visit"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(v.visitDate)}</p>
                        {v.chiefComplaint && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{v.chiefComplaint}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {v.improvementScore !== null && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.improvementScore >= 7 ? "bg-green-100 text-green-700"
                            : v.improvementScore >= 4 ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                          }`}>
                            Score: {v.improvementScore}/10
                          </span>
                        )}
                        <span className={`block mt-1 text-xs px-2 py-0.5 rounded-full text-center ${
                          v.status === "completed" ? "bg-green-100 text-green-700"
                          : v.status === "locked" ? "bg-gray-100 text-gray-600"
                          : "bg-blue-100 text-blue-700"
                        }`}>
                          {v.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Case History Summary */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Case Summary</h3>
              <Link href={`/patients/${id}/case-history`} className="text-xs text-primary hover:underline">
                {patient.caseHistory ? "Edit" : "Add"}
              </Link>
            </div>
            {!patient.caseHistory ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No case history recorded</p>
                <Link href={`/patients/${id}/case-history`}
                  className="mt-3 inline-block text-sm text-primary hover:underline">
                  Add case history →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border text-sm">
                {patient.caseHistory.hopi && (
                  <SumRow label="Presenting Complaint" value={patient.caseHistory.hopi} />
                )}
                {patient.caseHistory.mentalGenerals && (
                  <SumRow label="Mental Generals" value={patient.caseHistory.mentalGenerals} />
                )}
                {patient.caseHistory.constitutionType && (
                  <SumRow label="Constitution" value={patient.caseHistory.constitutionType} />
                )}
                {patient.caseHistory.dominantMiasm && (
                  <SumRow label="Dominant Miasm" value={patient.caseHistory.dominantMiasm} />
                )}
                {patient.caseHistory.thermalState && (
                  <SumRow label="Thermal State" value={patient.caseHistory.thermalState} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoChip({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function ActionButton({ href, icon: Icon, label, primary }: {
  href: string; icon: React.ElementType; label: string; primary?: boolean;
}) {
  return (
    <Link href={href} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      primary
        ? "bg-primary text-primary-foreground hover:bg-primary/90"
        : "border border-border hover:bg-muted"
    }`}>
      <Icon className="w-3.5 h-3.5" />{label}
    </Link>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm line-clamp-2">{value}</p>
    </div>
  );
}
