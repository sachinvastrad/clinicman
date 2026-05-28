"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/shared/header";
import { ArrowLeft, Building2, Loader2, Save } from "lucide-react";
import Link from "next/link";

const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors bg-background";

interface ClinicData {
  id:             string;
  name:           string;
  address:        string | null;
  phone:          string | null;
  email:          string | null;
  gstin:          string | null;
  whatsappNumber: string | null;
  timezone:       string;
}

export default function ClinicSettingsPage() {
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");
  const [form, setForm] = useState<ClinicData>({
    id: "", name: "", address: "", phone: "", email: "", gstin: "", whatsappNumber: "", timezone: "Asia/Kolkata",
  });

  useEffect(() => {
    fetch("/api/clinic")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setForm(json.data);
      })
      .catch(() => setError("Failed to load clinic details."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const res  = await fetch("/api/clinic", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        name:           form.name,
        address:        form.address || null,
        phone:          form.phone   || null,
        email:          form.email   || null,
        gstin:          form.gstin   || null,
        whatsappNumber: form.whatsappNumber || null,
        timezone:       form.timezone,
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error?.message ?? "Failed to save.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <>
        <Header title="Clinic Settings" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  const field = (label: string, key: keyof ClinicData, opts?: { placeholder?: string; type?: string }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={opts?.type ?? "text"}
        value={(form[key] as string) ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={cls}
        placeholder={opts?.placeholder}
      />
    </div>
  );

  return (
    <>
      <Header title="Clinic Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/settings" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Clinic Settings
              </h2>
              <p className="text-sm text-muted-foreground">Update clinic information and contact details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h3>
              {field("Clinic Name *", "name", { placeholder: "DrMan Homeopathy Clinic" })}
              {field("Address", "address", { placeholder: "123 Health Street, Mumbai, Maharashtra 400001" })}
            </section>

            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {field("Phone", "phone", { placeholder: "+912212345678" })}
                {field("Email", "email", { placeholder: "clinic@example.com", type: "email" })}
              </div>
              {field("WhatsApp Number", "whatsappNumber", { placeholder: "+919876543210" })}
            </section>

            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Billing & Tax</h3>
              {field("GSTIN", "gstin", { placeholder: "27AABCU9603R1ZX" })}
            </section>

            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Regional Settings</h3>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Timezone</label>
                <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className={cls}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </section>

            {error   && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">Clinic settings saved successfully.</div>}

            <div className="flex gap-3">
              <Link href="/settings" className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
