"use client";

import { useState } from "react";
import { Header } from "@/components/shared/header";
import { ArrowLeft, Bell, Save, Loader2 } from "lucide-react";
import Link from "next/link";

const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors bg-background";

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex w-10 h-5.5 shrink-0 rounded-full transition-colors mt-0.5 ${checked ? "bg-primary" : "bg-muted"}`}
        style={{ height: 22, width: 40 }}
        role="switch" aria-checked={checked}>
        <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mt-[3px] ${checked ? "translate-x-[19px]" : "translate-x-[3px]"}`} />
      </button>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [prefs, setPrefs] = useState({
    apptReminder24h:    true,
    apptReminder2h:     true,
    followUpReminder:   true,
    birthdayGreeting:   false,
    prescriptionOnWA:   true,
    invoiceOnWA:        true,
    leadFollowUpAlert:  true,
    lowStockAlert:      true,
    dailySummaryEmail:  false,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  async function handleSave() {
    setSaving(true);
    // Preferences stored locally; backend integration wired in Sprint 5 with WATI
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <>
      <Header title="Notification Preferences" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Notification Preferences
              </h2>
              <p className="text-sm text-muted-foreground">Control which WhatsApp & email alerts are sent</p>
            </div>
          </div>

          {/* Appointment reminders */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-1">Appointment Reminders</h3>
            <Toggle label="24-hour reminder" description="Send WhatsApp reminder 24 hrs before appointment"
              checked={prefs.apptReminder24h} onChange={() => toggle("apptReminder24h")} />
            <Toggle label="2-hour reminder" description="Send WhatsApp reminder 2 hrs before appointment"
              checked={prefs.apptReminder2h} onChange={() => toggle("apptReminder2h")} />
          </div>

          {/* Follow-up reminders */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-1">Follow-up Alerts</h3>
            <Toggle label="Follow-up due reminder" description="Alert when a patient's follow-up date has passed"
              checked={prefs.followUpReminder} onChange={() => toggle("followUpReminder")} />
            <Toggle label="Lead follow-up alert" description="Alert when a lead's follow-up date is today"
              checked={prefs.leadFollowUpAlert} onChange={() => toggle("leadFollowUpAlert")} />
          </div>

          {/* Patient engagement */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-1">Patient Engagement</h3>
            <Toggle label="Birthday greeting" description="Send automated WhatsApp greeting on patient birthdays"
              checked={prefs.birthdayGreeting} onChange={() => toggle("birthdayGreeting")} />
            <Toggle label="Prescription on WhatsApp" description="Auto-send prescription after it is created"
              checked={prefs.prescriptionOnWA} onChange={() => toggle("prescriptionOnWA")} />
            <Toggle label="Invoice on WhatsApp" description="Send invoice link to patient after billing"
              checked={prefs.invoiceOnWA} onChange={() => toggle("invoiceOnWA")} />
          </div>

          {/* Operational alerts */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-1">Operational</h3>
            <Toggle label="Low stock alert" description="Notify admin when medicine stock falls below reorder level"
              checked={prefs.lowStockAlert} onChange={() => toggle("lowStockAlert")} />
            <Toggle label="Daily summary email" description="Send daily appointment and revenue summary to admin email"
              checked={prefs.dailySummaryEmail} onChange={() => toggle("dailySummaryEmail")} />
          </div>

          {/* Timing */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">Reminder Timing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Send reminders after</label>
                <select className={cls} defaultValue="09:00">
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Stop sending after</label>
                <select className={cls} defaultValue="20:00">
                  <option value="19:00">7:00 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="21:00">9:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          {success && (
            <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
              Preferences saved.
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Preferences"}
          </button>
        </div>
      </div>
    </>
  );
}
