"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";

interface Props {
  invoiceId:  string;
  balanceDue: number;
}

const cls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors bg-background";

export function PaymentForm({ invoiceId, balanceDue }: Props) {
  const router = useRouter();
  const [amount,      setAmount]      = useState(String(balanceDue));
  const [method,      setMethod]      = useState("cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res  = await fetch("/api/payments", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        invoiceId,
        amount:      Number(amount),
        method,
        referenceNo: referenceNo || null,
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error?.message ?? "Failed to record payment.");
      setSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Record Payment</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Amount (₹)</label>
            <input type="number" min="0.01" step="0.01" max={balanceDue} value={amount}
              onChange={(e) => setAmount(e.target.value)} className={cls} required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={cls}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        {method !== "cash" && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Reference / Transaction ID</label>
            <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)}
              className={cls} placeholder="UPI ref / Cheque no / Transaction ID" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {submitting ? "Recording…" : "Record Payment"}
        </button>
      </form>
    </div>
  );
}
