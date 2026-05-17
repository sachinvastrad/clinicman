"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Header } from "@/components/shared/header";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormRegister, Path } from "react-hook-form";

const caseHistorySchema = z.object({
  hopi:                z.string().optional(),
  pastHistory:         z.string().optional(),
  familyHistory:       z.string().optional(),
  personalHistory:     z.string().optional(),
  mentalGenerals:      z.string().optional(),
  physicalGenerals:    z.string().optional(),
  pqrsSymptoms:        z.string().optional(),
  constitutionType:    z.string().optional(),
  thermalState:        z.string().optional(),
  mentalDisposition:   z.string().optional(),
  miasmaticNotes:      z.string().optional(),
  dominantMiasm:       z.string().optional(),
  repertorizationNotes:z.string().optional(),
  selectedRemedy:      z.string().optional(),
  potency:             z.string().optional(),
  clinicalDiagnosis:   z.string().optional(),
  differentialDiagnosis:z.string().optional(),
  investigations:      z.string().optional(),
});

type CaseHistoryInput = z.infer<typeof caseHistorySchema>;

export default function CaseHistoryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CaseHistoryInput>({
    resolver: zodResolver(caseHistorySchema),
  });

  useEffect(() => {
    fetch(`/api/patients/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setPatientName(json.data.fullName);
          const ch = json.data.caseHistory;
          if (ch) reset(ch);
        }
        setLoading(false);
      });
  }, [id, reset]);

  async function onSubmit(data: CaseHistoryInput) {
    setServerError("");
    const res = await fetch(`/api/patients/${id}/case-history`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error?.message ?? "Failed to save case history");
      return;
    }
    router.push(`/patients/${id}`);
  }

  if (loading) return (
    <>
      <Header title="Case History" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    </>
  );

  return (
    <>
      <Header title="Case History" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/patients/${id}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Case History — {patientName}</h2>
              <p className="text-sm text-muted-foreground">Complete homeopathic case taking</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Section title="History of Present Illness">
              <TextArea label="History of Present Illness (HoPI)" name="hopi" register={register} rows={4} placeholder="Describe the presenting complaint, onset, duration, progress, modalities…" />
              <TextArea label="Past History" name="pastHistory" register={register} rows={3} placeholder="Previous illnesses, surgeries, vaccinations, treatments…" />
              <TextArea label="Family History" name="familyHistory" register={register} rows={2} placeholder="Hereditary diseases, family health patterns…" />
              <TextArea label="Personal History" name="personalHistory" register={register} rows={3} placeholder="Diet, sleep, bowel habits, addictions, occupation, lifestyle…" />
            </Section>

            <Section title="Generals">
              <TextArea label="Mental Generals" name="mentalGenerals" register={register} rows={3} placeholder="Temperament, emotions, fears, desires, aversions, memory, sleep…" />
              <TextArea label="Physical Generals" name="physicalGenerals" register={register} rows={3} placeholder="Thermal state, appetite, thirst, sweating, sensitivity…" />
              <TextArea label="PQRS Symptoms" name="pqrsSymptoms" register={register} rows={3} placeholder="Peculiar, Queer, Rare, Strange symptoms…" />
            </Section>

            <Section title="Constitutional Profile">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Constitution Type">
                  <select {...register("constitutionType")} className={inputCls}>
                    <option value="">Select…</option>
                    <option value="carbonitrogenous">Carbonitrogenous</option>
                    <option value="phosphoric">Phosphoric</option>
                    <option value="sulphuric">Sulphuric</option>
                    <option value="fluoric">Fluoric</option>
                    <option value="calcareous">Calcareous</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </Field>
                <Field label="Thermal State">
                  <select {...register("thermalState")} className={inputCls}>
                    <option value="">Select…</option>
                    <option value="hot">Hot Patient</option>
                    <option value="cold">Cold Patient</option>
                    <option value="chilly">Chilly</option>
                    <option value="ambithermal">Ambithermal</option>
                  </select>
                </Field>
                <Field label="Mental Disposition">
                  <input {...register("mentalDisposition")} className={inputCls} placeholder="e.g., Irritable, Anxious, Melancholic…" />
                </Field>
                <Field label="Dominant Miasm">
                  <select {...register("dominantMiasm")} className={inputCls}>
                    <option value="">Select…</option>
                    <option value="psoric">Psoric</option>
                    <option value="sycotic">Sycotic</option>
                    <option value="syphilitic">Syphilitic</option>
                    <option value="tubercular">Tubercular</option>
                    <option value="cancer">Cancer Miasm</option>
                  </select>
                </Field>
              </div>
              <TextArea label="Miasmatic Notes" name="miasmaticNotes" register={register} rows={2} placeholder="Active vs latent miasm, predominance…" />
            </Section>

            <Section title="Repertorization & Prescription">
              <TextArea label="Repertorization Notes" name="repertorizationNotes" register={register} rows={3} placeholder="Rubrics selected, totality, repertorization method…" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Selected Remedy">
                  <input {...register("selectedRemedy")} className={inputCls} placeholder="e.g., Sulphur, Natrum Mur…" />
                </Field>
                <Field label="Potency">
                  <input {...register("potency")} className={inputCls} placeholder="e.g., 30C, 200C, 1M…" />
                </Field>
              </div>
            </Section>

            <Section title="Clinical Assessment">
              <TextArea label="Clinical Diagnosis" name="clinicalDiagnosis" register={register} rows={2} placeholder="Conventional diagnosis if applicable…" />
              <TextArea label="Differential Diagnosis" name="differentialDiagnosis" register={register} rows={2} placeholder="Differential diagnoses considered…" />
              <TextArea label="Investigations / Reports" name="investigations" register={register} rows={2} placeholder="Lab tests, imaging, reports…" />
            </Section>

            {serverError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>
            )}

            <div className="flex gap-3 pt-2">
              <Link href={`/patients/${id}`}
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? "Saving…" : "Save Case History"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-xl border border-border p-6 space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function TextArea({ label, name, register, rows, placeholder }: {
  label: string; name: Path<CaseHistoryInput>;
  register: UseFormRegister<CaseHistoryInput>;
  rows: number; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <textarea
        {...register(name)}
        rows={rows}
        placeholder={placeholder}
        className={inputCls + " resize-y"}
      />
    </div>
  );
}
