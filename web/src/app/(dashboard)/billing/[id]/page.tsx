import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/shared/header";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { PaymentForm } from "./payment-form";

interface Props { params: Promise<{ id: string }> }

export default async function InvoiceDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where:   { id, clinicId: user.clinic_id },
    include: {
      patient:  { select: { fullName: true, patientCode: true, phone: true, id: true } },
      items:    true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!invoice) notFound();

  const totalPaid      = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalAmount    = Number(invoice.totalAmount);
  const balanceDue     = Math.max(0, totalAmount - totalPaid);
  const isPaid         = balanceDue === 0;

  const statusColor: Record<string, string> = {
    draft:          "bg-gray-100 text-gray-600",
    sent:           "bg-blue-100 text-blue-700",
    paid:           "bg-green-100 text-green-700",
    partially_paid: "bg-yellow-100 text-yellow-700",
    overdue:        "bg-red-100 text-red-700",
    cancelled:      "bg-gray-100 text-gray-400",
    refunded:       "bg-orange-100 text-orange-700",
  };

  return (
    <>
      <Header title={invoice.invoiceNumber} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Back */}
          <div className="flex items-center gap-3">
            <Link href="/billing" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold font-mono">{invoice.invoiceNumber}</h2>
              <p className="text-sm text-muted-foreground">{formatDate(invoice.createdAt)}</p>
            </div>
            <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[invoice.status] ?? "bg-gray-100 text-gray-600"}`}>
              {invoice.status.replace("_", " ")}
            </span>
            <Link href={`/billing/${id}/print`}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </Link>
          </div>

          {/* Patient */}
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Patient</p>
            <Link href={`/patients/${invoice.patient.id}`} className="font-semibold hover:text-primary transition-colors">
              {invoice.patient.fullName}
            </Link>
            <p className="text-sm text-muted-foreground font-mono">{invoice.patient.patientCode}</p>
            <p className="text-sm text-muted-foreground">{invoice.patient.phone}</p>
          </div>

          {/* Line items */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Items</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">Description</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground">Unit Price</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3">{item.description}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 border-t border-border bg-muted/20 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{formatCurrency(invoice.subtotalAmount)}</span>
              </div>
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>−{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
                <span>Total</span><span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Paid</span><span className="text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Balance Due</span>
                <span className={balanceDue > 0 ? "text-destructive" : "text-green-600"}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          {invoice.payments.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Payments Received</p>
              </div>
              <div className="divide-y divide-border">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <span className="font-medium capitalize">{p.method.replace("_", " ")}</span>
                      {p.referenceNo && <span className="text-xs text-muted-foreground ml-2">#{p.referenceNo}</span>}
                      <p className="text-xs text-muted-foreground">{formatDate(p.paidAt)}</p>
                    </div>
                    <span className="font-semibold text-green-600">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Record payment */}
          {!isPaid && (
            <PaymentForm invoiceId={invoice.id} balanceDue={balanceDue} />
          )}

          {isPaid && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center text-sm text-green-700 font-medium">
              Invoice fully paid
            </div>
          )}

          {invoice.notes && (
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
