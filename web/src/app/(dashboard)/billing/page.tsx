import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const invoices = await prisma.invoice.findMany({
    where:   { clinicId: user.clinic_id },
    orderBy: { createdAt: "desc" },
    take:    50,
    include: { patient: { select: { fullName: true, patientCode: true } } },
  });

  const statusColor: Record<string, string> = {
    draft:           "bg-gray-100 text-gray-600",
    sent:            "bg-blue-100 text-blue-700",
    paid:            "bg-green-100 text-green-700",
    partially_paid:  "bg-yellow-100 text-yellow-700",
    overdue:         "bg-red-100 text-red-700",
    cancelled:       "bg-gray-100 text-gray-400",
    refunded:        "bg-orange-100 text-orange-700",
  };

  return (
    <>
      <Header title="Billing" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Invoices</h2>
            <p className="text-sm text-muted-foreground">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/billing/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Invoice
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No invoices yet</p>
            <Link href="/billing/new" className="mt-4 text-sm text-primary hover:underline">Create first invoice</Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <Link href={`/patients/${inv.patientId}`} className="font-medium hover:text-primary transition-colors">
                        {inv.patient.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{inv.patient.patientCode}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {inv.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
