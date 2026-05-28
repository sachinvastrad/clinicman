"use client";

import { Header } from "@/components/shared/header";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Truck, Phone, Mail, Edit2, Trash2, Check, X } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  isActive: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/vendors");
    const d = await r.json();
    setVendors(d.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startAdd() { setForm({}); setEditId(null); setShowForm(true); }
  function startEdit(v: Vendor) { setForm(v); setEditId(v.id); setShowForm(true); }

  async function save() {
    if (!form.name?.trim()) { alert("Name is required"); return; }
    setSaving(true);
    if (editId) {
      await fetch(`/api/vendors/${editId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/vendors", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShowForm(false);
    setForm({});
    setEditId(null);
    load();
  }

  async function deactivate(id: string) {
    if (!confirm("Deactivate this vendor?")) return;
    await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    load();
  }

  const f = (field: keyof Vendor) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <>
      <Header title="Vendors" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Vendors</h2>
            <p className="text-sm text-muted-foreground">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/inventory/stock-in"
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
              Stock-In History
            </Link>
            <button onClick={startAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-medium text-sm">{editId ? "Edit Vendor" : "New Vendor"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Company Name *</label>
                <input value={form.name ?? ""} onChange={f("name")}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Contact Person</label>
                <input value={form.contactName ?? ""} onChange={f("contactName")}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Phone</label>
                <input value={form.phone ?? ""} onChange={f("phone")}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email</label>
                <input type="email" value={form.email ?? ""} onChange={f("email")}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">GSTIN</label>
                <input value={form.gstin ?? ""} onChange={f("gstin")}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Address</label>
                <textarea value={form.address ?? ""} onChange={f("address")} rows={2}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none" />
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
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Truck className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No vendors yet</p>
            <button onClick={startAdd} className="mt-4 text-sm text-primary hover:underline">Add first vendor</button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {vendor.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{vendor.name}</p>
                  {vendor.contactName && <p className="text-xs text-muted-foreground">{vendor.contactName}</p>}
                  <div className="flex gap-3 mt-1">
                    {vendor.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{vendor.phone}
                      </span>
                    )}
                    {vendor.email && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />{vendor.email}
                      </span>
                    )}
                    {vendor.gstin && (
                      <span className="text-xs text-muted-foreground">GSTIN: {vendor.gstin}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(vendor)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deactivate(vendor.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
