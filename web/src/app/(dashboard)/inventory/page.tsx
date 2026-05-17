import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Plus, Package, AlertTriangle } from "lucide-react";

export default async function InventoryPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const items = await prisma.inventory.findMany({
    where:   { clinicId: user.clinic_id },
    orderBy: { name: "asc" },
  });

  const lowStock = items.filter((i) => i.currentStock <= i.reorderLevel);

  return (
    <>
      <Header title="Inventory" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Inventory</h2>
            <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/inventory/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </Link>
        </div>

        {lowStock.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Low stock alert</p>
              <p className="text-xs text-amber-700 mt-0.5">{lowStock.map((i) => i.name).join(", ")} {lowStock.length === 1 ? "is" : "are"} below reorder level</p>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No inventory items</p>
            <Link href="/inventory/new" className="mt-4 text-sm text-primary hover:underline">Add first item</Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Selling Price</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const isLow = item.currentStock <= item.reorderLevel;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>
                        {item.potency && <p className="text-xs text-muted-foreground">{item.potency}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{item.category?.replace("_", " ") ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isLow ? "text-red-600" : ""}`}>{item.currentStock}</span>
                        <span className="text-muted-foreground text-xs"> / {item.reorderLevel} min</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                      <td className="px-4 py-3">{item.sellingPrice ? formatCurrency(item.sellingPrice) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
