import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PrintButton } from "./print-button";

interface Props { params: Promise<{ id: string }> }

export default async function InvoicePrintPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, clinicId: user.clinic_id },
    include: {
      patient:  { select: { fullName: true, patientCode: true, phone: true, address: true } },
      items:    true,
      payments: { orderBy: { paidAt: "asc" } },
    },
  });

  if (!invoice) notFound();

  const clinic = await prisma.clinic.findFirst({
    where:  { id: user.clinic_id },
    select: { name: true, address: true, phone: true, email: true, gstin: true },
  });

  const totalPaid   = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalAmount = Number(invoice.totalAmount);
  const balanceDue  = Math.max(0, totalAmount - totalPaid);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { size: A4; margin: 15mm 20mm; }
        }
        body { font-family: 'Times New Roman', serif; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm sticky top-0 z-10">
        <a href={`/billing/${id}`} className="text-sm text-primary hover:underline">← Back to Invoice</a>
        <PrintButton />
      </div>

      {/* A4 sheet */}
      <div className="max-w-2xl mx-auto bg-white p-8 print:p-0 print:max-w-none min-h-screen">

        {/* Clinic header */}
        <div className="flex items-center gap-5 border-b-2 border-gray-800 pb-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={clinic?.name ?? "Clinic"} className="h-20 w-auto object-contain shrink-0" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide">{clinic?.name ?? "Sachi Homeopathic Clinic"}</h1>
            {clinic?.address && <p className="text-sm text-gray-600 mt-0.5">{clinic.address}</p>}
            <div className="flex gap-6 text-sm text-gray-600 mt-0.5">
              {clinic?.phone && <span>Tel: {clinic.phone}</span>}
              {clinic?.email && <span>{clinic.email}</span>}
            </div>
            {clinic?.gstin && <p className="text-xs text-gray-500 mt-0.5">GSTIN: {clinic.gstin}</p>}
          </div>
        </div>

        {/* Invoice heading */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-gray-800">Receipt</h2>
            <p className="text-sm text-gray-600 font-mono mt-0.5">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Date: {formatDate(invoice.createdAt)}</p>
            <p className={`font-semibold mt-0.5 ${balanceDue === 0 ? "text-green-700" : "text-red-600"}`}>
              {balanceDue === 0 ? "PAID" : "BALANCE DUE"}
            </p>
          </div>
        </div>

        {/* Patient info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-6 bg-gray-50 rounded p-3 border border-gray-200">
          <div><span className="font-semibold">Patient:</span> {invoice.patient.fullName}</div>
          <div><span className="font-semibold">ID:</span> {invoice.patient.patientCode}</div>
          {invoice.patient.phone && <div><span className="font-semibold">Phone:</span> {invoice.patient.phone}</div>}
          {invoice.patient.address && <div className="col-span-2"><span className="font-semibold">Address:</span> {invoice.patient.address}</div>}
        </div>

        {/* Line items */}
        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 pr-3 font-semibold w-6">#</th>
              <th className="text-left py-2 pr-3 font-semibold">Description</th>
              <th className="text-right py-2 pr-3 font-semibold">Qty</th>
              <th className="text-right py-2 pr-3 font-semibold">Unit Price</th>
              <th className="text-right py-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="py-2 pr-3 text-gray-500">{idx + 1}.</td>
                <td className="py-2 pr-3">{item.description}</td>
                <td className="py-2 pr-3 text-right text-gray-600">{item.quantity}</td>
                <td className="py-2 pr-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-gray-800 pt-3 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(invoice.subtotalAmount)}</span>
          </div>
          {Number(invoice.discountAmount) > 0 && (
            <div className="flex justify-between py-1 text-green-700">
              <span>Discount</span>
              <span>−{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5 font-bold text-base border-t border-gray-400 mt-1">
            <span>Total</span>
            <span>{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>

        {/* Payment history */}
        {invoice.payments.length > 0 && (
          <div className="mt-5">
            <p className="font-semibold text-sm mb-2">Payments Received:</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="text-left py-1.5 pr-3 font-medium text-gray-600">Date</th>
                  <th className="text-left py-1.5 pr-3 font-medium text-gray-600">Method</th>
                  <th className="text-left py-1.5 pr-3 font-medium text-gray-600">Reference</th>
                  <th className="text-right py-1.5 font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-200">
                    <td className="py-1.5 pr-3 text-gray-600">{formatDate(p.paidAt)}</td>
                    <td className="py-1.5 pr-3 capitalize">{p.method.replace("_", " ")}</td>
                    <td className="py-1.5 pr-3 text-gray-500">{p.referenceNo ?? "—"}</td>
                    <td className="py-1.5 text-right text-green-700 font-medium">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between py-1.5 font-bold text-sm border-t-2 border-gray-800 mt-1">
              <span>Total Paid</span>
              <span className="text-green-700">{formatCurrency(totalPaid)}</span>
            </div>
            {balanceDue > 0 && (
              <div className="flex justify-between py-1 font-bold text-sm text-red-600">
                <span>Balance Due</span>
                <span>{formatCurrency(balanceDue)}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-5 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
            <p className="font-semibold mb-1">Notes:</p>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-3 border-t border-gray-300 text-center text-xs text-gray-400">
          This is a computer-generated receipt and does not require a physical signature.
        </div>
      </div>
    </>
  );
}
