"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/shared/header";
import { ArrowLeft, Plus, Trash2, FlaskConical, Loader2, Printer } from "lucide-react";
import Link from "next/link";

interface RemedyItem {
  remedyName:   string;
  potency:      string;
  form:         string;
  dose:         string;
  frequency:    string;
  duration:     string;
  instructions: string;
}

const emptyRemedy = (): RemedyItem => ({
  remedyName: "", potency: "", form: "", dose: "", frequency: "", duration: "", instructions: "",
});

const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors bg-background";

export default function NewPrescriptionPage() {
  const router   = useRouter();
  const { visitId } = useParams<{ visitId: string }>();

  const [patientId,         setPatientId]         = useState<string | null>(null);
  const [visitInfo,         setVisitInfo]         = useState<{ patient: { fullName: string; patientCode: string } } | null>(null);
  const [items,             setItems]             = useState<RemedyItem[]>([emptyRemedy()]);
  const [dietaryNotes,      setDietaryNotes]      = useState("");
  const [followUpDate,      setFollowUpDate]       = useState("");
  const [documentDate,      setDocumentDate]       = useState(() => new Date().toISOString().split("T")[0]);
  const [submitting,        setSubmitting]        = useState(false);
  const [serverError,       setServerError]       = useState("");
  const [loading,           setLoading]           = useState(true);
  const [prescriptionExists, setPrescriptionExists] = useState(false);

  useEffect(() => {
    fetch(`/api/visits/${visitId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setPatientId(json.data.patientId);
          setVisitInfo({ patient: json.data.patient });
          if (json.data.prescription) {
            setPrescriptionExists(true);
          }
        }
      })
      .catch(() => setServerError("Could not load visit info."))
      .finally(() => setLoading(false));
  }, [visitId]);

  function addRemedy() { setItems((prev) => [...prev, emptyRemedy()]); }
  function removeRemedy(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }
  function updateRemedy(idx: number, field: keyof RemedyItem, value: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError("");

    const payload = {
      visitId,
      dietaryNotes: dietaryNotes || null,
      followUpDate: followUpDate || null,
      date: documentDate || null,
      items: items
        .filter((it) => it.remedyName.trim() && it.potency.trim())
        .map((it, idx) => ({ ...it, sortOrder: idx })),
    };

    if (payload.items.length === 0) {
      setServerError("Add at least one remedy with name and potency.");
      setSubmitting(false);
      return;
    }

    const res  = await fetch("/api/prescriptions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error?.message ?? "Failed to save prescription.");
      setSubmitting(false);
      return;
    }

    router.push(patientId ? `/patients/${patientId}` : "/prescriptions");
  }

  if (loading) {
    return (
      <>
        <Header title="New Prescription" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (prescriptionExists) {
    return (
      <>
        <Header title="Prescription Exists" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Link href={patientId ? `/patients/${patientId}` : "/prescriptions"}
                className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h2 className="font-semibold">Write Prescription</h2>
                {visitInfo && (
                  <p className="text-sm text-muted-foreground">
                    {visitInfo.patient.fullName} · <span className="font-mono">{visitInfo.patient.patientCode}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4">
              <FlaskConical className="w-10 h-10 text-amber-500 mx-auto" />
              <div>
                <p className="font-semibold text-amber-800">Prescription already written for this visit</p>
                <p className="text-sm text-amber-700 mt-1">Only one prescription can be created per visit.</p>
              </div>
              <Link href={`/visits/${visitId}/prescription/print`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                <Printer className="w-4 h-4" /> View &amp; Print Prescription
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="New Prescription" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href={patientId ? `/patients/${patientId}` : "/prescriptions"}
              className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Write Prescription</h2>
              {visitInfo && (
                <p className="text-sm text-muted-foreground">
                  {visitInfo.patient.fullName} · <span className="font-mono">{visitInfo.patient.patientCode}</span>
                </p>
              )}
            </div>
          </div>

          {serverError && !submitting && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Remedy items */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Remedies
                </h3>
                <button type="button" onClick={addRemedy}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Remedy
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-border p-4 space-y-3 relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Remedy {idx + 1}</span>
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeRemedy(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Remedy Name *</label>
                      <input value={item.remedyName} onChange={(e) => updateRemedy(idx, "remedyName", e.target.value)}
                        className={cls} placeholder="e.g. Sulphur, Nux Vomica" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Potency *</label>
                      <input value={item.potency} onChange={(e) => updateRemedy(idx, "potency", e.target.value)}
                        className={cls} placeholder="e.g. 30C, 200C, 1M" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Form</label>
                      <select value={item.form} onChange={(e) => updateRemedy(idx, "form", e.target.value)} className={cls}>
                        <option value="">Select form</option>
                        <option value="pills">Pills</option>
                        <option value="drops">Drops</option>
                        <option value="powder">Powder</option>
                        <option value="globules">Globules</option>
                        <option value="liquid">Liquid</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Dose</label>
                      <input value={item.dose} onChange={(e) => updateRemedy(idx, "dose", e.target.value)}
                        className={cls} placeholder="e.g. 4 pills, 10 drops" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Frequency</label>
                      <select value={item.frequency} onChange={(e) => updateRemedy(idx, "frequency", e.target.value)} className={cls}>
                        <option value="">Select frequency</option>
                        <option value="once_daily">Once daily</option>
                        <option value="twice_daily">Twice daily</option>
                        <option value="thrice_daily">Thrice daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="sos">SOS</option>
                        <option value="single_dose">Single dose</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Duration</label>
                      <input value={item.duration} onChange={(e) => updateRemedy(idx, "duration", e.target.value)}
                        className={cls} placeholder="e.g. 15 days, 1 month" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Special Instructions</label>
                    <input value={item.instructions} onChange={(e) => updateRemedy(idx, "instructions", e.target.value)}
                      className={cls} placeholder="e.g. Dissolve in water, avoid coffee" />
                  </div>
                </div>
              ))}
            </section>

            {/* Diet & follow-up */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Diet & Follow-up</h3>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Dietary Notes & Lifestyle Advice</label>
                <textarea value={dietaryNotes} onChange={(e) => setDietaryNotes(e.target.value)}
                  rows={3} className={cls + " resize-none"}
                  placeholder="Avoid onion, garlic, coffee. Prefer light, easily digestible meals…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Document Date</label>
                  <input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} className={cls} required />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Follow-up Date</label>
                  <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={cls} />
                </div>
              </div>
            </section>

            {serverError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>
            )}

            <div className="flex gap-3 pt-2">
              <Link href={patientId ? `/patients/${patientId}` : "/prescriptions"}
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                {submitting ? "Saving…" : "Save Prescription"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
