"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/shared/header";
import { ArrowLeft, Stethoscope, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function NewVisitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [form, setForm] = useState({
    visitType:        "consultation",
    chiefComplaint:   "",
    clinicalFindings: "",
    diagnosis:        "",
    planOfAction:     "",
    followUpDate:     "",
    improvementScore: "",
    // Vitals
    bp:          "",
    pulse:       "",
    temperature: "",
    weight:      "",
    height:      "",
    spo2:        "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) { setServerError("Patient ID is missing"); return; }
    setSubmitting(true);
    setServerError("");

    const vitals = (form.bp || form.pulse || form.temperature || form.weight) ? {
      bp:          form.bp || null,
      pulse:       form.pulse ? Number(form.pulse) : null,
      temperature: form.temperature ? Number(form.temperature) : null,
      weight:      form.weight ? Number(form.weight) : null,
      height:      form.height ? Number(form.height) : null,
      spo2:        form.spo2 ? Number(form.spo2) : null,
    } : null;

    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        visitType:        form.visitType,
        chiefComplaint:   form.chiefComplaint || null,
        clinicalFindings: form.clinicalFindings || null,
        diagnosis:        form.diagnosis || null,
        planOfAction:     form.planOfAction || null,
        followUpDate:     form.followUpDate || null,
        improvementScore: form.improvementScore ? Number(form.improvementScore) : null,
        vitals,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error?.message ?? "Failed to create visit"); setSubmitting(false); return; }
    router.push(`/patients/${patientId}`);
  }

  const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors";

  return (
    <>
      <Header title="New Visit" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href={patientId ? `/patients/${patientId}` : "/patients"} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Record Visit</h2>
              <p className="text-sm text-muted-foreground">Document today&apos;s consultation</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Visit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Visit Type</label>
                  <select value={form.visitType} onChange={(e) => setForm({ ...form, visitType: e.target.value })} className={cls}>
                    <option value="consultation">Consultation</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="teleconsultation">Teleconsultation</option>
                    <option value="case_taking">Case Taking</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Improvement Score (0–10)</label>
                  <input type="number" min="0" max="10" value={form.improvementScore}
                    onChange={(e) => setForm({ ...form, improvementScore: e.target.value })}
                    className={cls} placeholder="Patient-reported improvement" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Chief Complaint</label>
                <textarea value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                  rows={2} className={cls + " resize-none"} placeholder="Main reason for today's visit…" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Clinical Findings</label>
                <textarea value={form.clinicalFindings} onChange={(e) => setForm({ ...form, clinicalFindings: e.target.value })}
                  rows={3} className={cls + " resize-none"} placeholder="Observations, examination findings…" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Diagnosis</label>
                <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className={cls} placeholder="Clinical / homeopathic diagnosis…" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Plan of Action / Instructions</label>
                <textarea value={form.planOfAction} onChange={(e) => setForm({ ...form, planOfAction: e.target.value })}
                  rows={2} className={cls + " resize-none"} placeholder="Treatment plan, diet advice, lifestyle instructions…" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Follow-up Date</label>
                <input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} className={cls} />
              </div>
            </section>

            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Vitals (optional)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Blood Pressure", key: "bp", placeholder: "120/80" },
                  { label: "Pulse (bpm)", key: "pulse", placeholder: "72", type: "number" },
                  { label: "Temperature (°F)", key: "temperature", placeholder: "98.6", type: "number" },
                  { label: "Weight (kg)", key: "weight", placeholder: "65", type: "number" },
                  { label: "Height (cm)", key: "height", placeholder: "165", type: "number" },
                  { label: "SpO₂ (%)", key: "spo2", placeholder: "98", type: "number" },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-sm font-medium">{label}</label>
                    <input type={type ?? "text"} value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className={cls} placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </section>

            {serverError && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>}

            <div className="flex gap-3 pt-2">
              <Link href={patientId ? `/patients/${patientId}` : "/patients"}
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
                {submitting ? "Saving…" : "Save Visit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function NewVisitPage() {
  return (
    <Suspense>
      <NewVisitForm />
    </Suspense>
  );
}
