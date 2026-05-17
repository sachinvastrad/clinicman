"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/shared/header";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const TEMPLATES = [
  { id: "appointment_reminder", label: "Appointment Reminder" },
  { id: "prescription_sent", label: "Prescription Sent" },
  { id: "follow_up_reminder", label: "Follow-up Reminder" },
  { id: "custom", label: "Custom Message" },
];

function SendWhatsAppForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(patientId);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [patients, setPatients] = useState<{ id: string; fullName: string; phone: string }[]>([]);
  const [template, setTemplate] = useState("appointment_reminder");
  const [customMessage, setCustomMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  async function searchPatients(q: string) {
    setPatientSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}&limit=5`);
    const json = await res.json();
    setPatients(json.data ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId) { setServerError("Please select a patient"); return; }
    setSubmitting(true);
    setServerError("");
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatientId,
        templateName: template !== "custom" ? template : null,
        messageBody: template === "custom" ? customMessage : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error?.message ?? "Failed to send message"); setSubmitting(false); return; }
    router.push("/whatsapp");
  }

  const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors";

  return (
    <>
      <Header title="Send WhatsApp" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/whatsapp" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Send WhatsApp Message</h2>
              <p className="text-sm text-muted-foreground">Send a template or custom message</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-card rounded-xl border border-border p-6 space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Patient</h3>
              {selectedPatientId && selectedPatientName ? (
                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-sm font-medium">{selectedPatientName}</span>
                  <button type="button" onClick={() => { setSelectedPatientId(""); setSelectedPatientName(""); }}
                    className="text-xs text-muted-foreground hover:text-destructive">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <input value={patientSearch} onChange={(e) => searchPatients(e.target.value)}
                    placeholder="Search patient…" className={cls} />
                  {patients.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      {patients.map((p) => (
                        <button key={p.id} type="button"
                          onClick={() => { setSelectedPatientId(p.id); setSelectedPatientName(p.fullName); setPatients([]); setPatientSearch(""); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-muted border-b border-border last:border-0">
                          <p className="text-sm font-medium">{p.fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Message</h3>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Template</label>
                <select value={template} onChange={(e) => setTemplate(e.target.value)} className={cls}>
                  {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              {template === "custom" && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Message *</label>
                  <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4} className={cls + " resize-none"} placeholder="Type your message…" required />
                </div>
              )}
            </section>

            {serverError && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>}

            <div className="flex gap-3 pt-2">
              <Link href="/whatsapp"
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Sending…" : "Send Message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function SendWhatsAppPage() {
  return <Suspense><SendWhatsAppForm /></Suspense>;
}
