"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface MonthlyDataPoint {
  month:    string;
  revenue:  number;
  patients: number;
}

interface ApptTypePoint {
  name:  string;
  value: number;
}

interface Props {
  monthlyData:  MonthlyDataPoint[];
  apptTypes:    ApptTypePoint[];
  currencySymbol?: string;
}

const PIE_COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

function formatInr(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000)   return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
}

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border:     "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize:   12,
  },
  labelStyle:   { fontWeight: 600 },
};

export function ReportsCharts({ monthlyData, apptTypes }: Props) {
  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-sm mb-4">Revenue Trend — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatInr} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
            <Tooltip
              formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
              {...tooltipStyle}
            />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2}
              fill="url(#revenueGrad)" dot={{ r: 3, fill: "#6366f1" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Patient Registrations */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-sm mb-4">New Patient Registrations — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
            <Tooltip
              formatter={(v: number) => [v, "New patients"]}
              {...tooltipStyle}
            />
            <Bar dataKey="patients" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Appointment type distribution */}
      {apptTypes.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Appointment Types</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={apptTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {apptTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "appointments"]} {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {apptTypes.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="capitalize">{entry.name.replace("_", " ")}</span>
                  </div>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
