import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { PackagePlus } from "lucide-react";

export default async function StockInPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const stockIns = await prisma.stockIn.findMany({
    where: { clinicId: user.clinic_id },
    orderBy: { purchaseDate: "desc" },
    take: 50,
    include: {
      vendor: { select: { name: true } },
      items: {
        include: { inventory: { select: { name: true, unit: true } } },
      },
    },
  });

  return (
    <>
      <Header title="Stock-In History" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Stock-In Records</h2>
            <p className="text-sm text-muted-foreground">Inventory received from vendors</p>
          </div>
          <Link href="/inventory/stock-in/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <PackagePlus className="w-4 h-4" /> Record Stock-In
          </Link>
        </div>

        {stockIns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackagePlus className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No stock-in records yet</p>
            <Link href="/inventory/stock-in/new" className="mt-4 text-sm text-primary hover:underline">Record first stock-in</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {stockIns.map((si) => (
              <div key={si.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium text-sm">{formatDate(si.purchaseDate)}</p>
                    {si.vendor && <p className="text-xs text-muted-foreground">Vendor: {si.vendor.name}</p>}
                    {si.invoiceNo && <p className="text-xs text-muted-foreground">Invoice: {si.invoiceNo}</p>}
                    {si.notes && <p className="text-xs text-muted-foreground mt-0.5">{si.notes}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{si.items.length} item{si.items.length !== 1 ? "s" : ""}</span>
                    {si.totalAmount && <p className="text-xs text-muted-foreground">Total: {formatCurrency(si.totalAmount)}</p>}
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-1.5">
                  {si.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.inventory.name}</span>
                      <div className="flex items-center gap-3 text-right">
                        <span>+{item.quantity} {item.inventory.unit}</span>
                        <span className="text-muted-foreground">{formatCurrency(item.costPrice)}/unit</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
