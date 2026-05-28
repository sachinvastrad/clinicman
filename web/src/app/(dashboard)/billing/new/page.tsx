"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/shared/header";
import { ArrowLeft, Plus, Trash2, Loader2, FileText, Search, X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { formatCurrency } from "@/lib/utils";

interface LineItem { description: string; quantity: number; unitPrice: number }

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(patientId);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [patients, setPatients] = useState<{ id: string; fullName: string; phone: string; patientCode: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [items, setItems] = useState<LineItem[]>([{ description: "Consultation Fee", quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Pre-fill patient name when patientId comes from URL
  useEffect(() => {
    if (!patientId) return;
    fetch(`/api/patients/${patientId}`)
      .then((r) => r.json())
      .then((d) => { if (d.data?.fullName) setSelectedPatientName(d.data.fullName); })
      .catch(() => {});
  }, [patientId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function searchPatients(q: string) {
    setPatientSearch(q);
    setNoResults(false);
    if (q.length < 2) { setPatients([]); setShowDropdown(false); return; }
    setShowDropdown(true);
    const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}&limit=8`);
    const json = await res.json();
    const results = json.data ?? [];
    setPatients(results);
    setNoResults(results.length === 0);
  }

  function selectPatient(p: { id: string; fullName: string; phone: string }) {
    setSelectedPatientId(p.id);
    setSelectedPatientName(p.fullName);
    setPatients([]);
    setPatientSearch("");
    setShowDropdown(false);
    setNoResults(false);
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total    = Math.max(0, subtotal - discount);

  function addItem() { setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]); }
  function removeItem(idx: number) { setItems(items.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId) { setServerError("Please select a patient"); return; }
    if (items.length === 0) { setServerError("Add at least one line item"); return; }
    setSubmitting(true);
    setServerError("");
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatientId, items, discount, notes: notes || null, date: documentDate }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error?.message ?? "Failed to create invoice"); setSubmitting(false); return; }
    router.push("/billing");
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors";

  return (
    <>
      <Header title="New Invoice" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/billing" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Create Invoice</h2>
              <p className="text-sm text-muted-foreground">Generate a new patient invoice</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Patient</h3>
              {selectedPatientId && selectedPatientName ? (
                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-sm font-medium">{selectedPatientName}</span>
                  <button type="button" onClick={() => { setSelectedPatientId(""); setSelectedPatientName(""); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" /> Change
                  </button>
                </div>
              ) : (
                <div ref={searchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input value={patientSearch} onChange={(e) => searchPatients(e.target.value)}
                      onFocus={() => { if (patients.length > 0 || noResults) setShowDropdown(true); }}
                      placeholder="Search by name, phone or patient ID…"
                      className={inputCls + " pl-9"} />
                  </div>
                  {showDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                      {patients.length > 0 ? patients.map((p) => (
                        <button key={p.id} type="button"
                          onMouseDown={(e) => { e.preventDefault(); selectPatient(p); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-muted border-b border-border last:border-0">
                          <p className="text-sm font-medium">{p.fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.patientCode} · {p.phone}</p>
                        </button>
                      )) : noResults ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                          No patients found for &quot;{patientSearch}&quot;
                        </div>
                      ) : null}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Type at least 2 characters to search</p>
                </div>
              )}
            </section>

            {/* Line items */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Line Items</h3>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-6">
                      <input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Description" className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                        placeholder="Qty" className={inputCls} />
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                        placeholder="Price" className={inputCls} />
                    </div>
                    <div className="col-span-1 flex justify-center pt-2">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add item
              </button>

              <div className="pt-3 border-t border-border space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <input type="number" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-28 px-3 py-1 text-sm border border-input rounded-lg text-right outline-none focus:ring-2 focus:ring-ring/20" />
                </div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Invoice Date</label>
                <input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Notes</h3>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={2} className={inputCls + " resize-none"} placeholder="Additional notes for the invoice…" />
              </div>
            </section>

            {serverError && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{serverError}</div>}

            <div className="flex gap-3 pt-2">
              <Link href="/billing"
                className="flex-1 text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {submitting ? "Creating…" : "Create Invoice"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function NewInvoicePage() {
  return <Suspense><NewInvoiceForm /></Suspense>;
}
