"use client";

import { useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PatientInfo {
  id: string;
  fullName: string;
  patientCode: string;
  dateOfBirth: Date | string | null;
  gender: string | null;
  phone: string | null;
}

interface ClinicInfo {
  name: string;
  address: string | null;
  phone: string | null;
}

interface Props {
  patient: PatientInfo;
  clinic: ClinicInfo;
  doctorName: string;
}

const PURPOSES = [
  { value: "rest", label: "Rest" },
  { value: "fitness", label: "Fitness" },
  { value: "sick_leave", label: "Sick Leave" },
  { value: "custom", label: "Custom" },
];

function calculateAge(dob: Date | string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function formatDateDisplay(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export function MedicalCertificateForm({ patient, clinic, doctorName }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [purpose, setPurpose]             = useState("sick_leave");
  const [customPurpose, setCustomPurpose] = useState("");
  const [fromDate, setFromDate]           = useState(today);
  const [toDate, setToDate]               = useState(today);
  const [diagnosis, setDiagnosis]         = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [doctor, setDoctor]               = useState(doctorName);
  const [issueDate, setIssueDate]         = useState(today);

  const age = calculateAge(patient.dateOfBirth);

  const purposeLabel =
    purpose === "custom"
      ? customPurpose || "_______________"
      : PURPOSES.find((p) => p.value === purpose)?.label ?? purpose;

  function handlePrint() {
    window.print();
  }

  const certBody = buildCertBody(purpose, purposeLabel, fromDate, toDate);

  return (
    <>
      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { size: A4; margin: 20mm; }
          body { background: white; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Back nav — no-print */}
        <div className="flex items-center gap-3 no-print">
          <Link href={`/patients/${patient.id}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="font-semibold">Medical Certificate</h2>
            <p className="text-sm text-muted-foreground">{patient.fullName} · {patient.patientCode}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* ── Form ── */}
          <div className="bg-card rounded-xl border border-border p-6 no-print space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Certificate Details</h3>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium mb-1">Purpose</label>
              <div className="flex flex-wrap gap-2">
                {PURPOSES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPurpose(p.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      purpose === p.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {purpose === "custom" && (
                <input
                  type="text"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="Enter custom purpose…"
                  className="mt-2 w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium mb-1">Diagnosis <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g., Upper respiratory tract infection"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Recommendations */}
            <div>
              <label className="block text-sm font-medium mb-1">Recommendations</label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={3}
                placeholder="e.g., Complete bed rest, avoid strenuous activities…"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Doctor name + Issue date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Download PDF
            </button>
          </div>

          {/* ── Print Preview ── */}
          <div className="xl:col-span-1">
            <p className="text-xs text-muted-foreground mb-2 no-print">Preview</p>
            {/* Certificate card — this IS printed */}
            <div id="certificate" className="bg-white border border-border rounded-xl shadow-sm p-8 font-serif text-gray-900" style={{ minHeight: "700px" }}>
              {/* Letterhead */}
              <div className="flex items-center gap-4 border-b-2 border-gray-800 pb-4 mb-6">
                <img src="/logo.png" alt={clinic.name} className="h-20 w-auto object-contain shrink-0" />
                <div>
                  <h1 className="text-xl font-bold uppercase tracking-widest">{clinic.name}</h1>
                  {clinic.address && <p className="text-sm text-gray-600 mt-0.5">{clinic.address}</p>}
                  {clinic.phone  && <p className="text-sm text-gray-600">Tel: {clinic.phone}</p>}
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold uppercase tracking-[0.2em] underline decoration-2 underline-offset-4">
                  Medical Certificate
                </h2>
              </div>

              {/* Patient details */}
              <div className="mb-6 text-sm space-y-1">
                <p><span className="font-semibold">Patient Name:</span> {patient.fullName}</p>
                <p><span className="font-semibold">Patient ID:</span> {patient.patientCode}</p>
                {age !== null && <p><span className="font-semibold">Age:</span> {age} years</p>}
                {patient.gender && <p><span className="font-semibold">Gender:</span> {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</p>}
              </div>

              {/* Body */}
              <div className="text-sm leading-relaxed space-y-4">
                <p>{certBody}</p>

                {diagnosis && (
                  <p>
                    <span className="font-semibold">Diagnosis:</span> {diagnosis}
                  </p>
                )}

                {fromDate && toDate && (
                  <p>
                    This certificate is valid from <span className="font-semibold">{formatDateDisplay(fromDate)}</span> to{" "}
                    <span className="font-semibold">{formatDateDisplay(toDate)}</span>.
                  </p>
                )}

                {recommendations && (
                  <div>
                    <p className="font-semibold">Recommendations:</p>
                    <p className="mt-1 text-gray-700">{recommendations}</p>
                  </div>
                )}
              </div>

              {/* Signature */}
              <div className="mt-16 flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-600">Date: {formatDateDisplay(issueDate)}</p>
                </div>
                <div className="text-right">
                  <div className="w-48 border-b border-gray-800 mb-1" />
                  <p className="text-sm font-semibold">{doctor || "Doctor Name"}</p>
                  <p className="text-xs text-gray-500">Attending Physician</p>
                  <p className="text-xs text-gray-500">{clinic.name}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300 text-center">
                <p className="text-xs text-gray-400 italic">
                  This certificate is issued on the basis of examination and is valid only for the stated purpose.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function buildCertBody(purpose: string, label: string, from: string, to: string): string {
  const dayCount = from && to
    ? Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1)
    : null;

  switch (purpose) {
    case "rest":
      return `This is to certify that the above-named patient has been examined and is advised complete rest${dayCount ? ` for ${dayCount} day${dayCount > 1 ? "s" : ""}` : ""}. The patient is unfit for any strenuous physical or mental activities during this period.`;
    case "fitness":
      return `This is to certify that the above-named patient has been examined and is medically fit to resume normal duties and activities. No medical restrictions apply at this time.`;
    case "sick_leave":
      return `This is to certify that the above-named patient has been examined and found suffering from an illness. The patient is advised sick leave${dayCount ? ` for ${dayCount} day${dayCount > 1 ? "s" : ""}` : ""} and is unfit to attend work during this period.`;
    default:
      return `This is to certify that the above-named patient has been examined for the purpose of ${label}.`;
  }
}
