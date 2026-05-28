"use client";

import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface StatusData  { status: string; count: number }
interface SourceData  { source: string; count: number }
interface MonthData   { month: string; count: number }

interface Props {
  byStatus:  StatusData[];
  bySource:  SourceData[];
  byMonth:   MonthData[];
  totalLeads: number;
  converted:  number;
  conversionRate: number;
  avgPerMonth: number;
}

const STATUS_COLORS: Record<string, string> = {
  new:          "#3b82f6",
  contacted:    "#f59e0b",
  interested:   "#14b8a6",
  converted:    "#22c55e",
  not_interested:"#6b7280",
  lost:         "#ef4444",
};

const PIE_COLORS = ["#6366f1","#f59e0b","#14b8a6","#22c55e","#ef4444","#8b5cf6","#ec4899","#06b6d4"];

export function LeadAnalyticsCharts({
  byStatus, bySource, byMonth,
  totalLeads, converted, conversionRate, avgPerMonth,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Leads"      value={String(totalLeads)}           sub="all time" />
        <SummaryCard label="Converted"        value={String(converted)}             sub="patients" />
        <SummaryCard label="Conversion Rate"  value={`${conversionRate.toFixed(1)}%`} sub="leads → patients" />
        <SummaryCard label="Avg / Month"      value={avgPerMonth.toFixed(1)}        sub="last 6 months" />
      </div>

      {/* Bar: leads per status */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-sm mb-4">Leads by Status</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={byStatus} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="status" tick={{ fontSize: 12 }} tickFormatter={(v) => v.replace("_", " ")} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => [v, "Leads"]} labelFormatter={(l) => String(l).replace("_", " ")} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {byStatus.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: leads by source */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Leads by Source</h3>
          {bySource.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={bySource}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ source, percent }) =>
                    `${String(source).replace("_", " ")} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {bySource.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "Leads"]} />
                <Legend formatter={(v) => String(v).replace("_", " ")} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Area: leads per month */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Leads Added (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={byMonth} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [v, "Leads"]} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#areaGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
