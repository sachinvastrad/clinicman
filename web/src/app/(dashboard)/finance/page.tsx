import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default async function FinancePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where:   { clinicId: user.clinic_id, paidAt: { gte: start, lte: end } },
      orderBy: { paidAt: "desc" },
      take:    20,
      include: { invoice: { include: { patient: { select: { fullName: true } } } } },
    }),
    prisma.expense.findMany({
      where:   { clinicId: user.clinic_id, expenseDate: { gte: start, lte: end } },
      orderBy: { expenseDate: "desc" },
      take:    20,
    }),
  ]);

  const revenue     = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalExpense= expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit      = revenue - totalExpense;

  const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <>
      <Header title="Finance" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Finance — {monthLabel}</h2>
            <p className="text-sm text-muted-foreground">Current month overview</p>
          </div>
          <Link href="/finance/expense/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Expense
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Revenue", value: revenue,       icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50" },
            { label: "Expenses", value: totalExpense, icon: TrendingDown, color: "text-red-600",    bg: "bg-red-50" },
            { label: "Profit",   value: profit,        icon: DollarSign,   color: profit >= 0 ? "text-green-600" : "text-red-600", bg: profit >= 0 ? "bg-green-50" : "bg-red-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{formatCurrency(value)}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payments */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="font-semibold text-sm">Recent Payments</h3>
            </div>
            {payments.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No payments this month</div>
            ) : (
              <div className="divide-y divide-border">
                {payments.map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.invoice?.patient.fullName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.paidAt)} · {p.method ?? "—"}</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrency(p.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">Expenses</h3>
              <Link href="/finance/expense/new" className="text-xs text-primary hover:underline">Add</Link>
            </div>
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No expenses this month</div>
            ) : (
              <div className="divide-y divide-border">
                {expenses.map((e) => (
                  <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.expenseDate)} · {e.category}</p>
                    </div>
                    <p className="font-semibold text-red-600">{formatCurrency(e.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
