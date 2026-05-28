"use client";

import { Header } from "@/components/shared/header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface Vendor { id: string; name: string }
interface InventoryItem { id: string; name: string; unit: string; currentStock: number }
interface StockItem {
  inventoryId: string;
  quantity: number;
  costPrice: number;
}

export default function NewStockInPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<StockItem[]>([{ inventoryId: "", quantity: 1, costPrice: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/vendors").then((r) => r.json()).then((d) => setVendors(d.data ?? []));
    fetch("/api/inventory").then((r) => r.json()).then((d) => setInventory(d.data ?? []));
  }, []);

  function addItem() { setItems((p) => [...p, { inventoryId: "", quantity: 1, costPrice: 0 }]); }
  function removeItem(idx: number) { setItems((p) => p.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: keyof StockItem, value: string | number) {
    setItems((p) => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function save() {
    const validItems = items.filter((i) => i.inventoryId && i.quantity > 0);
    if (validItems.length === 0) { alert("Add at least one inventory item"); return; }
    setSaving(true);
    const r = await fetch("/api/stock-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId: vendorId || undefined,
        invoiceNo: invoiceNo || undefined,
        purchaseDate,
        notes: notes || undefined,
        items: validItems,
      }),
    });
    const d = await r.json();
    setSaving(false);
    if (d.data) {
      router.push("/inventory/stock-in");
    } else {
      alert(d.error?.message ?? "Failed to record stock-in");
    }
  }

  return (
    <>
      <Header title="Record Stock-In" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Link href="/inventory/stock-in" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="font-semibold">Record Stock-In</h2>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Vendor</label>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background">
                <option value="">No vendor / Manual</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Invoice Number</label>
              <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="INV-001"
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Purchase Date</label>
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Items Received</h3>
            <button onClick={addItem}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
              <div className="flex gap-2">
                <select
                  value={item.inventoryId}
                  onChange={(e) => updateItem(idx, "inventoryId", e.target.value)}
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-input bg-background"
                >
                  <option value="">Select medicine…</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>{inv.name} (stock: {inv.currentStock} {inv.unit})</option>
                  ))}
                </select>
                <button onClick={() => removeItem(idx)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-0.5">Quantity *</label>
                  <input type="number" min="1" value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    className="w-full text-sm px-2 py-1.5 rounded border border-input bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-0.5">Cost Price (₹) *</label>
                  <input type="number" min="0" step="0.01" value={item.costPrice}
                    onChange={(e) => updateItem(idx, "costPrice", Number(e.target.value))}
                    className="w-full text-sm px-2 py-1.5 rounded border border-input bg-background" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" />{saving ? "Recording…" : "Record Stock-In"}
        </button>
      </div>
    </>
  );
}
