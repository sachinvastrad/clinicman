"use client";

import { Header } from "@/components/shared/header";
import { useEffect, useState } from "react";
import { Plus, Layers, Check, X, Edit2, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  description?: string;
  sessionCount: number;
  validityDays?: number;
  price: number | string;
  isActive: boolean;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Package>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/treatment-packages");
    const d = await r.json();
    setPackages(d.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startAdd() { setForm({}); setEditId(null); setShowForm(true); }
  function startEdit(p: Package) { setForm({ ...p, price: Number(p.price) }); setEditId(p.id); setShowForm(true); }

  async function save() {
    if (!form.name?.trim()) { alert("Name is required"); return; }
    if (!form.sessionCount) { alert("Session count is required"); return; }
    if (form.price === undefined || form.price === "") { alert("Price is required"); return; }
    setSaving(true);
    const payload = { ...form, sessionCount: Number(form.sessionCount), price: Number(form.price) };
    if (editId) {
      await fetch(`/api/treatment-packages/${editId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/treatment-packages", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowForm(false);
    setForm({});
    setEditId(null);
    load();
  }

  async function deactivate(id: string) {
    if (!confirm("Deactivate this package?")) return;
    await fetch(`/api/treatment-packages/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <Header title="Treatment Packages" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Treatment Packages</h2>
            <p className="text-sm text-muted-foreground">{packages.length} active package{packages.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={startAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Package
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-medium text-sm">{editId ? "Edit Package" : "New Package"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Package Name *</label>
                <input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Monthly Wellness Plan"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Description</label>
                <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Session Count *</label>
                <input type="number" min="1" value={form.sessionCount ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, sessionCount: Number(e.target.value) }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Validity (days)</label>
                <input type="number" min="1" value={form.validityDays ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, validityDays: Number(e.target.value) || undefined }))}
                  placeholder="e.g. 90"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Price (₹) *</label>
                <input type="number" min="0" step="0.01" value={form.price ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Check className="w-4 h-4" />{saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setShowForm(false); setForm({}); setEditId(null); }}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No packages yet</p>
            <button onClick={startAdd} className="mt-4 text-sm text-primary hover:underline">Create first package</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{pkg.name}</p>
                    {pkg.description && <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(pkg)}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deactivate(pkg.id)}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{formatCurrency(pkg.price)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pkg.sessionCount} sessions
                    {pkg.validityDays ? ` · ${pkg.validityDays} days validity` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
