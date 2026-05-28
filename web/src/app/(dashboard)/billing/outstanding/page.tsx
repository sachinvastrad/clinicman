import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default async function OutstandingPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const invoices = await prisma.invoice.findMany({
    where: {
      clinicId: user.clinic_id,
      status: { in: ["draft", "sent", "partially_paid"] },
    },
    orderBy: { createdAt: "asc" },
    include: {
      patient: { select: { fullName: true, phone: true, patientCode: true } },
      payments: { select: { amount: true } },
    },
  });

  const withDues = invoices.map((inv) => {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    const due = Number(inv.totalAmount) - paid;
    return { ...inv, paid, due };
  }).filter((inv) => inv.due > 0);

  const totalOutstanding = withDues.reduce((s, inv) => s + inv.due, 0);

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    partially_paid: "bg-orange-100 text-orange-700",
  };

  return (
    <>
      <Header title="Outstanding Dues" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Outstanding Dues</h2>
            <p className="text-sm text-muted-foreground">{withDues.length} invoice{withDues.length !== 1 ? "s" : ""} pending</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Outstanding</p>
            <p className="text-xl font-bold text-destructive">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>

        {withDues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No outstanding dues</p>
            <p className="text-sm text-muted-foreground mt-1">All invoices are settled</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Paid</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Due</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withDues.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/patients/${inv.patientId}`} className="font-medium hover:text-primary transition-colors">
                        {inv.patient.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{inv.patient.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/billing/${inv.id}`} className="font-mono text-xs hover:text-primary transition-colors">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {inv.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(inv.paid)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-destructive">{formatCurrency(inv.due)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(inv.createdAt)}</td>
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
