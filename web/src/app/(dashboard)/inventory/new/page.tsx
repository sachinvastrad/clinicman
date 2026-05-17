"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/header";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewInventoryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [form, setForm] = useState({
    name:         "",
    category:     "medicine",
    potency:      "",
    unit:         "vial",
    currentStock: "",
    reorderLevel: "5",
    costPrice:    "",
    sellingPrice: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError("");
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        currentStock: Number(form.currentStock),
        reorderLevel: Number(form.reorderLevel),
        costPrice:    form.costPrice ? Number(form.costPrice) : null,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error?.message ?? "Failed to add item"); setSubmitting(false); return; }
    router.push("/inventory");
  }

  const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors";

  return (
    <>
      <Header title="Add Inventory Item" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/inventory" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Add Inventory Item</h2>
              <p className="text-sm text-muted-foreground">Add a remedy or supply to inventory</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Item Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-sm font-medium">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={cls} placeholder="e.g., Sulphur, Nux Vomica…" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={cls}>
                    <option value="medicine">Medicine</option>
                    <option value="remedy">Remedy</option>
                    <option value="consumable">Consumable</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Potency</label>
                  <input value={form.potency} onChange={(e) => setForm({ ...form, potency: e.target.value })} className={cls} placeholder="30C, 200C, 1M…" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={cls}>
                    <option value="vial">Vial</option>
                    <option value="bottle">Bottle</option>
                    <option value="strip">Strip</option>
                    <option value="tablet">Tablet</option>
                    <option value="ml">ml</option>
                    <option value="gm">gm</option>
                    <option value="unit">Unit</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Current Stock *</label>
                  <input type="number" min="0" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} required className={cls} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Reorder Level</label>
                  <input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} className={cls} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Cost Price (₹)</label>
                  <input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className={cls} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Selling Price (₹)</label>
                  <input type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} className={cls} placeholder="0.00" />
                </div>
              </div>
            </section>

            {serverError && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>}

            <div className="flex gap-3 pt-2">
              <Link href="/inventory"
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                {submitting ? "Adding…" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
