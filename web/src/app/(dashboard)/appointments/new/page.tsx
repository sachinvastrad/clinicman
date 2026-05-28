"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/shared/header";
import { ArrowLeft, CalendarPlus, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring bg-background transition-colors";

function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initPatientId = searchParams.get("patientId") ?? "";

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(initPatientId);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [patients, setPatients] = useState<{ id: string; fullName: string; phone: string; patientCode: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    scheduledAt:     "",
    duration:        "30",
    appointmentType: "consultation",
    notes:           "",
  });

  // Load patient name if pre-filled from URL
  useEffect(() => {
    if (!initPatientId) return;
    fetch(`/api/patients/${initPatientId}`)
      .then((r) => r.json())
      .then((d) => { if (d.data?.fullName) setSelectedPatientName(d.data.fullName); })
      .catch(() => {});
  }, [initPatientId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function searchPatients(q: string) {
    setPatientSearch(q);
    setNoResults(false);
    if (q.length < 2) { setPatients([]); setShowDropdown(false); return; }
    setSearchLoading(true);
    setShowDropdown(true);
    try {
      const res  = await fetch(`/api/patients?q=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json();
      const results = json.data ?? [];
      setPatients(results);
      setNoResults(results.length === 0);
    } catch {
      setPatients([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function selectPatient(p: { id: string; fullName: string; phone: string }) {
    setSelectedPatientId(p.id);
    setSelectedPatientName(p.fullName);
    setPatients([]);
    setPatientSearch("");
    setShowDropdown(false);
    setNoResults(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId) { setServerError("Please select a patient"); return; }
    if (!form.scheduledAt) { setServerError("Please select date and time"); return; }
    setSubmitting(true);
    setServerError("");

    // datetime-local gives "YYYY-MM-DDTHH:MM" — Zod needs seconds appended
    const scheduledAt = form.scheduledAt.length === 16 ? form.scheduledAt + ":00" : form.scheduledAt;

    try {
      const res  = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId:       selectedPatientId,
          scheduledAt,
          duration:        Number(form.duration),
          appointmentType: form.appointmentType,
          notes:           form.notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error?.message ?? "Failed to book appointment");
        return;
      }
      router.push("/appointments");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

            {/* Patient selection */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Patient</h3>

              {selectedPatientId && selectedPatientName ? (
                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-sm font-medium">{selectedPatientName}</span>
                  <button type="button"
                    onClick={() => { setSelectedPatientId(""); setSelectedPatientName(""); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3 h-3" /> Change
                  </button>
                </div>
              ) : (
                <div ref={searchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      value={patientSearch}
                      onChange={(e) => searchPatients(e.target.value)}
                      onFocus={() => { if (patients.length > 0 || noResults) setShowDropdown(true); }}
                      placeholder="Search by name, phone or patient ID…"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring bg-background"
                    />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                      {patients.length > 0 ? (
                        patients.map((p) => (
                          <button key={p.id} type="button"
                            onMouseDown={(e) => { e.preventDefault(); selectPatient(p); }}
                            className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors border-b border-border last:border-0">
                            <p className="text-sm font-medium">{p.fullName}</p>
                            <p className="text-xs text-muted-foreground">{p.patientCode} · {p.phone}</p>
                          </button>
                        ))
                      ) : noResults ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                          No patients found for &quot;{patientSearch}&quot;
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Type at least 2 characters to search</p>
            </section>

            {/* Schedule */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Date &amp; Time *</label>
                  <input type="datetime-local" value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    className={cls} required />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Duration</label>
                  <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className={cls}>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-sm font-medium">Appointment Type</label>
                  <select value={form.appointmentType} onChange={(e) => setForm({ ...form, appointmentType: e.target.value })}
                    className={cls}>
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
                  rows={2} className={`${cls} resize-none`}
                  placeholder="Chief complaint or reason for visit…" />
              </div>
            </section>

            {serverError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>
            )}

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
