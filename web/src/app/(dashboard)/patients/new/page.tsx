"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPatientSchema, type CreatePatientInput } from "@/lib/validations/patient";
import { Header } from "@/components/shared/header";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewPatientPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const form = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      caseType: "new",
      whatsappOptin: true,
      gender: undefined,
    },
  });

  async function onSubmit(data: CreatePatientInput) {
    setServerError("");
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error?.message ?? "Failed to register patient");
      return;
    }
    router.push(`/patients/${json.data.id}`);
  }

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = form;

  return (
    <>
      <Header title="Register New Patient" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/patients" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">New Patient Registration</h2>
              <p className="text-sm text-muted-foreground">Fill in the details to create a patient record</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Info */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name *" error={errors.fullName?.message}>
                  <input {...register("fullName")} placeholder="Priyanka Sharma" className={inputCls(!!errors.fullName)} />
                </Field>

                <Field label="Phone Number *" error={errors.phone?.message}>
                  <input {...register("phone")} type="tel" placeholder="+919876543210" className={inputCls(!!errors.phone)} />
                </Field>

                <Field label="Email" error={errors.email?.message}>
                  <input {...register("email")} type="email" placeholder="patient@email.com" className={inputCls(!!errors.email)} />
                </Field>

                <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                  <input {...register("dateOfBirth")} type="date" className={inputCls(!!errors.dateOfBirth)} />
                </Field>

                <Field label="Gender" error={errors.gender?.message}>
                  <select {...register("gender")} className={inputCls(!!errors.gender)}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>

                <Field label="Occupation" error={errors.occupation?.message}>
                  <input {...register("occupation")} placeholder="Teacher, Software Engineer…" className={inputCls(false)} />
                </Field>
              </div>

              <Field label="Address" error={errors.address?.message}>
                <textarea {...register("address")} rows={2} placeholder="Street, City, State, PIN" className={inputCls(!!errors.address) + " resize-none"} />
              </Field>
            </section>

            {/* Clinical Info */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Clinical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Case Type" error={errors.caseType?.message}>
                  <select {...register("caseType")} className={inputCls(false)}>
                    <option value="new">New Case</option>
                    <option value="chronic">Chronic</option>
                    <option value="acute">Acute</option>
                  </select>
                </Field>

                <Field label="Referred By" error={errors.referredBy?.message}>
                  <input {...register("referredBy")} placeholder="Dr. / Patient name" className={inputCls(false)} />
                </Field>
              </div>

              <Field label="Known Allergies / Sensitivities" error={errors.allergies?.message}>
                <input {...register("allergies")} placeholder="Penicillin, Sulphur, Dust…" className={inputCls(false)} />
              </Field>
            </section>

            {/* Consent */}
            <section className="bg-card rounded-xl border border-border p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  {...register("whatsappOptin")}
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 w-4 h-4 rounded border-input text-primary focus:ring-ring"
                />
                <div>
                  <p className="text-sm font-medium">WhatsApp Communication Consent</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Patient consents to receive appointment reminders, prescriptions, and health tips via WhatsApp. They can opt-out anytime by replying STOP.
                  </p>
                </div>
              </label>
            </section>

            {serverError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {serverError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link href="/patients"
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {isSubmitting ? "Registering…" : "Register Patient"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
    hasError ? "border-destructive focus:ring-destructive/20" : "border-input focus:border-ring"
  } focus:ring-2 focus:ring-ring/20`;
}
