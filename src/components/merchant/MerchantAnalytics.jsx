import React, { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Package, CheckCircle2, Percent, BarChart3 } from "lucide-react";

/**
 * Merchant order-volume + completion-rate analytics for the last 7 days,
 * drawn from the live MerchantOrder feed. Shown on the merchant dispatch
 * dashboard.
 */
export default function MerchantAnalytics({ orders }) {
  const { data, totals } = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        key: d.toLocaleDateString("en-US", { weekday: "short" }),
        total: 0,
        completed: 0,
        cancelled: 0,
      });
    }
    for (const o of orders || []) {
      const od = new Date(o.created_date || o.fired_at || 0);
      od.setHours(0, 0, 0, 0);
      const day = days.find((d) => d.date.getTime() === od.getTime());
      if (!day) continue;
      day.total++;
      if (o.status === "fired") day.completed++;
      else if (o.status === "cancelled") day.cancelled++;
    }
    const chartData = days.map(({ key, total, completed, cancelled }) => {
      const settled = completed + cancelled;
      return {
        key,
        total,
        completed,
        cancelled,
        completionRate: settled > 0 ? Math.round((completed / settled) * 100) : 0,
      };
    });
    const volume = chartData.reduce((s, d) => s + d.total, 0);
    const completed = chartData.reduce((s, d) => s + d.completed, 0);
    const cancelled = chartData.reduce((s, d) => s + d.cancelled, 0);
    const settled = completed + cancelled;
    const rate = settled > 0 ? Math.round((completed / settled) * 100) : 0;
    return { data: chartData, totals: { volume, completed, cancelled, rate } };
  }, [orders]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h2 className="font-heading text-sm font-semibold">Order analytics — last 7 days</h2>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard icon={Package} label="Daily volume" value={totals.volume} tone="text-foreground" />
        <StatCard icon={CheckCircle2} label="Completions" value={totals.completed} tone="text-primary" />
        <StatCard icon={Percent} label="Completion rate" value={`${totals.rate}%`} tone="text-primary" />
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="key" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
            <YAxis yAxisId="count" allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
            <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} unit="%" />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "12px",
                color: "hsl(var(--popover-foreground))",
              }}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar yAxisId="count" dataKey="total" name="Volume" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="count" dataKey="completed" name="Completed" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
            <Line yAxisId="rate" type="monotone" dataKey="completionRate" name="Completion rate %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="bg-background/50 border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className={`w-3.5 h-3.5 ${tone}`} />
        {label}
      </div>
      <p className={`text-2xl font-bold font-mono ${tone}`}>{value}</p>
    </div>
  );
}