"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/header";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const leadSchema = z.object({
  fullName:     z.string().min(2, "Name required"),
  phone:        z.string().min(10, "Phone required"),
  email:        z.string().email().optional().or(z.literal("")),
  interestedIn: z.string().optional(),
  source:       z.string().optional(),
  notes:        z.string().optional(),
});
type LeadInput = z.infer<typeof leadSchema>;

export default function NewLeadPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
  });

  async function onSubmit(data: LeadInput) {
    setServerError("");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, email: data.email || undefined }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error?.message ?? "Failed to add lead"); return; }
    router.push("/leads");
  }

  const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors";

  return (
    <>
      <Header title="Add Lead" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/leads" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Add New Lead</h2>
              <p className="text-sm text-muted-foreground">Track a prospective patient</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Full Name *</label>
                  <input {...register("fullName")} className={cls} placeholder="Priya Mehta" />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Phone *</label>
                  <input {...register("phone")} type="tel" className={cls} placeholder="+919876543210" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Email</label>
                  <input {...register("email")} type="email" className={cls} placeholder="optional" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Source</label>
                  <select {...register("source")} className={cls}>
                    <option value="">Select…</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="referral">Referral</option>
                    <option value="google">Google</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-sm font-medium">Interested In (condition/treatment)</label>
                  <input {...register("interestedIn")} className={cls} placeholder="e.g., Arthritis, Skin allergy, Hair fall…" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Notes</label>
                <textarea {...register("notes")} rows={2} className={cls + " resize-none"} placeholder="Additional context…" />
              </div>
            </section>

            {serverError && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>}

            <div className="flex gap-3 pt-2">
              <Link href="/leads"
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {isSubmitting ? "Adding…" : "Add Lead"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
