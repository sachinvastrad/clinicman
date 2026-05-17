"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/header";
import { ArrowLeft, Receipt, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewExpensePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [form, setForm] = useState({
    description:  "",
    amount:       "",
    category:     "supplies",
    expenseDate:  new Date().toISOString().slice(0, 10),
    notes:        "",
    receiptUrl:   "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError("");
    const res = await fetch("/api/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error?.message ?? "Failed to add expense"); setSubmitting(false); return; }
    router.push("/finance");
  }

  const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors";

  return (
    <>
      <Header title="Add Expense" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/finance" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Record Expense</h2>
              <p className="text-sm text-muted-foreground">Log a clinic expense</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-sm font-medium">Description *</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className={cls} placeholder="e.g., Remedy stock, Office supplies…" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Amount (₹) *</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className={cls} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={cls}>
                    <option value="supplies">Supplies</option>
                    <option value="equipment">Equipment</option>
                    <option value="rent">Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="staff">Staff</option>
                    <option value="marketing">Marketing</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Date</label>
                  <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className={cls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={cls + " resize-none"} placeholder="Optional notes…" />
              </div>
            </section>

            {serverError && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>}

            <div className="flex gap-3 pt-2">
              <Link href="/finance"
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                {submitting ? "Saving…" : "Save Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
