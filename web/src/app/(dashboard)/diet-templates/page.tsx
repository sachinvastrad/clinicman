"use client";

import { Header } from "@/components/shared/header";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Salad } from "lucide-react";

interface DietTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  tags?: string;
}

export default function DietTemplatesPage() {
  const [templates, setTemplates] = useState<DietTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<DietTemplate>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/diet-templates");
      const d = await r.json();
      setTemplates(d.data ?? []);
    } catch {
      // network error — keep existing list
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startAdd() { setForm({}); setEditId(null); setShowForm(true); setError(null); }
  function startEdit(t: DietTemplate) { setForm({ name: t.name, description: t.description, content: t.content, tags: t.tags }); setEditId(t.id); setShowForm(true); setError(null); }

  async function save() {
    if (!form.name?.trim()) { setError("Name is required"); return; }
    if (!form.content?.trim()) { setError("Diet content is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const url    = editId ? `/api/diet-templates/${editId}` : "/api/diet-templates";
      const method = editId ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description, content: form.content, tags: form.tags }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? data?.error ?? "Save failed. Please try again.");
        return;
      }
      setShowForm(false);
      setForm({});
      setEditId(null);
      load();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/diet-templates/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <Header title="Diet Templates" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Diet Templates</h2>
            <p className="text-sm text-muted-foreground">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={startAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Template
          </button>
        </div>

        {showForm && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-medium text-sm">{editId ? "Edit Template" : "New Template"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Template Name *</label>
                <input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Low-Sugar Diet, Pitta-Balancing"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tags (comma-separated)</label>
                <input value={form.tags ?? ""} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="diabetes, weight-loss"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Description</label>
                <input value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this diet plan"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Diet Content *</label>
              <textarea value={form.content ?? ""} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={8} placeholder={"Breakfast: ...\nLunch: ...\nDinner: ...\n\nAvoid: ..."}
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none font-mono" />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}
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
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Salad className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No templates yet</p>
            <button onClick={startAdd} className="mt-4 text-sm text-primary hover:underline">Create first template</button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
            {templates.map((t) => (
              <div key={t.id}>
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.name}</p>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                    {t.tags && (
                      <div className="flex gap-1 mt-1">
                        {t.tags.split(",").map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-muted rounded">{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(t); }}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {expandedId === t.id && (
                  <div className="px-5 pb-4 bg-muted/20">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{t.content}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
