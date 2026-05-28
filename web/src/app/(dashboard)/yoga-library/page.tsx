"use client";

import { Header } from "@/components/shared/header";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Activity, Image as ImageIcon } from "lucide-react";

interface Asana {
  id: string;
  name: string;
  sanskritName?: string;
  category?: string;
  duration?: string;
  description?: string;
  benefits?: string;
  contraindications?: string;
  imageUrl?: string;
}

const CATEGORIES = ["Standing", "Sitting", "Supine", "Prone", "Balancing", "Twisting", "Breathing", "Meditation", "Other"];

export default function YogaLibraryPage() {
  const [asanas, setAsanas]     = useState<Asana[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [filter, setFilter]     = useState("");
  const [form, setForm]         = useState<Partial<Asana>>({});
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const r = await fetch("/api/yoga-asanas");
      const d = await r.json();
      setAsanas(d.data ?? []);
    } catch {
      // network error — keep existing list
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startAdd() { setForm({}); setEditId(null); setShowForm(true); setError(null); }
  function startEdit(asana: Asana) {
    setForm({
      name: asana.name, sanskritName: asana.sanskritName, category: asana.category,
      duration: asana.duration, description: asana.description, benefits: asana.benefits,
      contraindications: asana.contraindications, imageUrl: asana.imageUrl,
    });
    setEditId(asana.id); setShowForm(true); setError(null);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/yoga-image", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
      } else {
        setError(data.error ?? "Image upload failed");
      }
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.name?.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const url    = editId ? `/api/yoga-asanas/${editId}` : "/api/yoga-asanas";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, sanskritName: form.sanskritName, category: form.category,
          duration: form.duration, description: form.description, benefits: form.benefits,
          contraindications: form.contraindications, imageUrl: form.imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? data?.error ?? "Save failed. Please try again.");
        return;
      }
      setShowForm(false); setForm({}); setEditId(null); load();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this asana?")) return;
    await fetch(`/api/yoga-asanas/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = asanas.filter((a) =>
    !filter || a.name.toLowerCase().includes(filter.toLowerCase()) || a.category?.toLowerCase().includes(filter.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Asana[]>>((acc, a) => {
    const cat = a.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <>
      <Header title="Yoga Library" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Yoga Asana Library</h2>
            <p className="text-sm text-muted-foreground">{asanas.length} asana{asanas.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search asanas…"
              className="text-sm px-3 py-2 rounded-lg border border-input bg-background w-48" />
            <button onClick={startAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Asana
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-medium text-sm">{editId ? "Edit Asana" : "New Asana"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Name *</label>
                <input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Sanskrit Name</label>
                <input value={form.sanskritName ?? ""} onChange={(e) => setForm((f) => ({ ...f, sanskritName: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Category</label>
                <select value={form.category ?? ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background">
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Duration (e.g. "5 min", "10 breaths")</label>
                <input value={form.duration ?? ""} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
            </div>

            {/* Pose Image */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Pose Image</label>
              <div className="flex items-center gap-3">
                {form.imageUrl ? (
                  <div className="relative">
                    <img src={form.imageUrl} alt="Pose" className="w-20 h-20 object-cover rounded-lg border border-border" />
                    <button onClick={() => setForm((f) => ({ ...f, imageUrl: undefined }))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">
                    {uploading ? "Uploading…" : "Upload Image"}
                  </button>
                  <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5 MB</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Description</label>
              <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Benefits</label>
                <textarea value={form.benefits ?? ""} onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
                  rows={2} className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Contraindications</label>
                <textarea value={form.contraindications ?? ""} onChange={(e) => setForm((f) => ({ ...f, contraindications: e.target.value }))}
                  rows={2} className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-2">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Check className="w-4 h-4" />{saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setShowForm(false); setForm({}); setEditId(null); setError(null); }}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No asanas yet</p>
            <button onClick={startAdd} className="mt-4 text-sm text-primary hover:underline">Add first asana</button>
          </div>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catAsanas]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{cat}</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {catAsanas.map((asana, idx) => (
                  <div key={asana.id} className={`flex items-start gap-4 p-4 ${idx < catAsanas.length - 1 ? "border-b border-border" : ""}`}>
                    {/* Pose image */}
                    {asana.imageUrl ? (
                      <img src={asana.imageUrl} alt={asana.name} className="w-20 h-20 object-cover rounded-lg border border-border shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{asana.name}</span>
                        {asana.sanskritName && <span className="text-xs text-muted-foreground italic">{asana.sanskritName}</span>}
                        {asana.duration && <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{asana.duration}</span>}
                      </div>
                      {asana.description && <p className="text-xs text-muted-foreground mt-1">{asana.description}</p>}
                      {asana.benefits && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground">Benefits:</span> {asana.benefits}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(asana)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(asana.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
