"use client";

import { Header } from "@/components/shared/header";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

interface Template { id: string; name: string; description?: string; content: string; tags?: string }
interface Visit { id: string; patientId: string; patient?: { fullName: string } }

export default function DietChartPage() {
  const params = useParams<{ visitId: string }>();
  const router = useRouter();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customContent, setCustomContent] = useState("");
  const [notes, setNotes] = useState("");
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/visits/${params.visitId}`)
      .then((r) => r.json())
      .then((d) => setVisit(d.data));
    fetch("/api/diet-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.data ?? []));
  }, [params.visitId]);

  function loadTemplate(templateId: string) {
    const t = templates.find((t) => t.id === templateId);
    if (!t) return;
    setCustomContent(t.content);
    setSelectedTemplateId(templateId);
  }

  async function save() {
    if (!visit) return;
    if (!customContent.trim()) { alert("Please enter diet chart content"); return; }
    setSaving(true);
    const r = await fetch("/api/patient-diet-charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: visit.patientId,
        visitId: visit.id,
        date: documentDate,
        dietTemplateId: selectedTemplateId || undefined,
        customContent,
        notes,
      }),
    });
    const d = await r.json();
    setSaving(false);
    if (d.data) {
      router.push(`/patients/${visit.patientId}`);
    } else {
      alert(d.error?.message ?? "Failed to save");
    }
  }

  if (!visit) return <><Header title="Diet Chart" /><div className="p-6 text-muted-foreground">Loading…</div></>;

  return (
    <>
      <Header title="Diet Chart" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${visit.patientId}/visits`} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="font-semibold">Create Diet Chart</h2>
        </div>

        {/* Load from template */}
        {templates.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm font-medium mb-2">Load from Template</p>
            <div className="flex gap-2">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Select a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.tags ? ` [${t.tags}]` : ""}</option>
                ))}
              </select>
              <button
                onClick={() => loadTemplate(selectedTemplateId)}
                disabled={!selectedTemplateId}
                className="px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                Load
              </button>
            </div>
            {selectedTemplateId && templates.find((t) => t.id === selectedTemplateId)?.description && (
              <p className="text-xs text-muted-foreground mt-2">
                {templates.find((t) => t.id === selectedTemplateId)?.description}
              </p>
            )}
          </div>
        )}

        {/* Diet content */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="font-medium text-sm">Diet Plan</h3>
          <p className="text-xs text-muted-foreground">
            Enter the complete diet plan. You can include meal timings, food items, quantities, and restrictions.
          </p>
          <textarea
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder={"Breakfast (8am): Oats with fruits, nuts\nMid-morning (11am): Buttermilk or fruit\nLunch (1pm): Rice, dal, vegetables, salad\nEvening (5pm): Green tea, light snack\nDinner (8pm): Chapati, cooked vegetables\n\nAvoid: Sugar, fried foods, dairy..."}
            rows={12}
            className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none font-mono"
          />
        </div>

        {/* Notes & Date */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Document Date</label>
            <input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specific instructions, restrictions, patient preferences…"
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none"
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Diet Chart"}
        </button>
      </div>
    </>
  );
}
