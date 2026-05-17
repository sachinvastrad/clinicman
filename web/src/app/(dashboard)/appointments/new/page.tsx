"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/shared/header";
import { ArrowLeft, CalendarPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(patientId);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [patients, setPatients] = useState<{ id: string; fullName: string; phone: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    scheduledAt: "",
    duration: "30",
    appointmentType: "consultation",
    notes: "",
  });

  async function searchPatients(q: string) {
    setPatientSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    setSearchLoading(true);
    const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}&limit=5`);
    const json = await res.json();
    setPatients(json.data ?? []);
    setSearchLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId) { setServerError("Please select a patient"); return; }
    setSubmitting(true);
    setServerError("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatientId, ...form, duration: Number(form.duration) }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error?.message ?? "Failed to book appointment"); setSubmitting(false); return; }
    router.push("/appointments");
  }

  return (
    <>
      <Header title="Book Appointment" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/appointments" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">New Appointment</h2>
              <p className="text-sm text-muted-foreground">Schedule a patient visit</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Patient</h3>
              {selectedPatientId && selectedPatientName ? (
                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-sm font-medium">{selectedPatientName}</span>
                  <button type="button" onClick={() => { setSelectedPatientId(""); setSelectedPatientName(""); }}
                    className="text-xs text-muted-foreground hover:text-destructive">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={patientSearch}
                    onChange={(e) => searchPatients(e.target.value)}
                    placeholder="Search patient by name or phone…"
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
                  />
                  {searchLoading && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
                  {patients.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      {patients.map((p) => (
                        <button key={p.id} type="button"
                          onClick={() => { setSelectedPatientId(p.id); setSelectedPatientName(p.fullName); setPatients([]); setPatientSearch(""); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors border-b border-border last:border-0">
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
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Date & Time *</label>
                  <input type="datetime-local" value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20" required />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Duration (minutes)</label>
                  <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Appointment Type</label>
                  <select value={form.appointmentType} onChange={(e) => setForm({ ...form, appointmentType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20">
                    <option value="consultation">Consultation</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="teleconsultation">Teleconsultation</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                  placeholder="Chief complaint or reason for visit…" />
              </div>
            </section>

            {serverError && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>}

            <div className="flex gap-3 pt-2">
              <Link href="/appointments"
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                {submitting ? "Booking…" : "Book Appointment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense>
      <NewAppointmentForm />
    </Suspense>
  );
}
