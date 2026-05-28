"use client";

import { Header } from "@/components/shared/header";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, ChevronDown, Activity } from "lucide-react";

interface Asana {
  id: string;
  name: string;
  sanskritName?: string;
  category?: string;
  duration?: string;
  imageUrl?: string;
}
interface Visit { id: string; patientId: string }

interface PlanItem {
  yogaAsanaId: string;
  duration?: string;
  repetitions?: string;
  instructions?: string;
}

function AsanaCombobox({
  asanas,
  value,
  onChange,
}: {
  asanas: Asana[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = asanas.find((a) => a.id === value);

  const filtered = search
    ? asanas.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          (a.sanskritName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (a.category ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : asanas;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-input bg-background text-left min-h-[40px]"
      >
        {selected ? (
          <>
            {selected.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imageUrl}
                alt={selected.name}
                className="w-8 h-8 object-cover rounded shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
            <span className="flex-1 truncate font-medium">{selected.name}</span>
            {selected.category && (
              <span className="text-xs text-muted-foreground shrink-0">{selected.category}</span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground flex-1">Select asana…</span>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border shrink-0">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search asanas…"
              className="w-full text-sm px-2 py-1.5 rounded border border-input bg-muted focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 text-center">No asanas found</p>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(a.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors ${
                    value === a.id ? "bg-primary/10" : ""
                  }`}
                >
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.imageUrl}
                      alt={a.name}
                      className="w-12 h-12 object-cover rounded border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded border border-border bg-muted flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    {a.sanskritName && (
                      <p className="text-xs text-muted-foreground italic truncate">{a.sanskritName}</p>
                    )}
                    <div className="flex gap-2">
                      {a.category && <span className="text-xs text-muted-foreground">{a.category}</span>}
                      {a.duration && <span className="text-xs text-muted-foreground">· {a.duration}</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function YogaPlanPage() {
  const params = useParams<{ visitId: string }>();
  const router = useRouter();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [asanas, setAsanas] = useState<Asana[]>([]);
  const [items, setItems] = useState<PlanItem[]>([{ yogaAsanaId: "" }]);
  const [notes, setNotes] = useState("");
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/visits/${params.visitId}`)
      .then((r) => r.json())
      .then((d) => setVisit(d.data));
    fetch("/api/yoga-asanas")
      .then((r) => r.json())
      .then((d) => setAsanas(d.data ?? []));
  }, [params.visitId]);

  function addItem() { setItems((prev) => [...prev, { yogaAsanaId: "" }]); }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: keyof PlanItem, value: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function save() {
    const validItems = items.filter((item) => item.yogaAsanaId);
    if (validItems.length === 0) { alert("Add at least one asana"); return; }
    if (!visit) return;
    setSaving(true);
    const r = await fetch("/api/patient-yoga-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: visit.patientId,
        visitId: visit.id,
        date: documentDate,
        notes,
        items: validItems.map((item, idx) => ({ ...item, sortOrder: idx })),
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

  if (!visit) return <><Header title="Yoga Plan" /><div className="p-6 text-muted-foreground">Loading…</div></>;

  return (
    <>
      <Header title="Yoga Plan" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${visit.patientId}/visits`} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="font-semibold">Create Yoga Plan</h2>
        </div>

        {/* Asana items */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Asanas</h3>
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Asana
            </button>
          </div>

          {asanas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No asanas in library yet.{" "}
              <Link href="/yoga-library" className="text-primary hover:underline">Add asanas first.</Link>
            </p>
          )}

          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
              <div className="flex gap-2 items-center">
                <AsanaCombobox
                  asanas={asanas}
                  value={item.yogaAsanaId}
                  onChange={(id) => updateItem(idx, "yogaAsanaId", id)}
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-0.5">Duration</label>
                  <input
                    value={item.duration ?? ""}
                    onChange={(e) => updateItem(idx, "duration", e.target.value)}
                    placeholder="e.g. 5 minutes"
                    className="w-full text-sm px-2 py-1.5 rounded border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-0.5">Repetitions</label>
                  <input
                    value={item.repetitions ?? ""}
                    onChange={(e) => updateItem(idx, "repetitions", e.target.value)}
                    placeholder="e.g. 3 sets, 10 reps"
                    className="w-full text-sm px-2 py-1.5 rounded border border-input bg-background"
                  />
                </div>
              </div>
              <input
                value={item.instructions ?? ""}
                onChange={(e) => updateItem(idx, "instructions", e.target.value)}
                placeholder="Special instructions…"
                className="w-full text-sm px-3 py-1.5 rounded border border-input bg-background"
              />
            </div>
          ))}
        </div>

        {/* Overall notes & Date */}
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
            <label className="text-xs font-medium text-muted-foreground block mb-1">Plan Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="General instructions, frequency, precautions…"
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
          <Save className="w-4 h-4" />{saving ? "Saving…" : "Save Yoga Plan"}
        </button>
      </div>
    </>
  );
}
