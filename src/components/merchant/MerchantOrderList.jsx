import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  Phone,
  User,
  StickyNote,
  Hash,
  Webhook,
} from "lucide-react";

const STATUS_STYLES = {
  draft: { label: "In progress", icon: Clock, color: "text-muted-foreground", bg: "bg-muted/40", dot: "bg-muted-foreground" },
  fired: { label: "Fired", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10", dot: "bg-primary" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", dot: "bg-destructive" },
  failed: { label: "Failed", icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", dot: "bg-orange-400" },
};

const WEBHOOK_STYLES = {
  pending: { label: "Pending", color: "text-muted-foreground" },
  delivered: { label: "Delivered", color: "text-primary" },
  failed: { label: "Failed", color: "text-orange-400" },
  cancelled: { label: "Cancelled", color: "text-destructive" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "In progress" },
  { key: "fired", label: "Fired" },
  { key: "finished", label: "Finished" },
  { key: "cancelled", label: "Cancelled" },
];

function useNow(tick = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tick);
    return () => clearInterval(id);
  }, [tick]);
  return now;
}

function safeItems(o) {
  try {
    const arr = JSON.parse(o.items_json || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/** Horizontal status timeline: Received → Fired → Delivered/Cancelled */
function StatusTimeline({ status, webhookStatus, firedAt, createdDate }) {
  const steps = [
    { key: "received", label: "Received", done: true, time: createdDate },
    { key: "fired", label: "Fired", done: ["fired", "cancelled", "failed"].includes(status), time: firedAt },
    {
      key: "final",
      label: status === "cancelled" ? "Cancelled" : status === "failed" ? "Failed" : "Delivered",
      done: status === "fired" && webhookStatus === "delivered",
      failed: status === "cancelled" || status === "failed",
      time: null,
    },
  ];
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                s.done
                  ? s.failed
                    ? "bg-destructive"
                    : "bg-primary"
                  : "bg-muted-foreground/40"
              }`}
            />
            <span className="text-[10px] font-mono text-muted-foreground">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-px mx-1 ${
                steps[i + 1].done ? (steps[i + 1].failed ? "bg-destructive/50" : "bg-primary/50") : "bg-border"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function MerchantOrderList({ orders, loading }) {
  const now = useNow(1000);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "active") return orders.filter((o) => o.status === "draft" || (o.status === "fired" && o.cancel_window_expires_at && new Date(o.cancel_window_expires_at).getTime() > now));
    if (filter === "finished") return orders.filter((o) => o.status === "fired" && o.webhook_status === "delivered");
    return orders.filter((o) => o.status === filter);
  }, [orders, filter, now]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading orders…
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No phone-in orders yet. When a customer calls, orders appear here live.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? orders.length
              : f.key === "active"
              ? orders.filter((o) => o.status === "draft").length
              : f.key === "finished"
              ? orders.filter((o) => o.status === "fired" && o.webhook_status === "delivered").length
              : orders.filter((o) => o.status === f.key).length;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {f.label} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No orders in this view.</p>
        )}
        {filtered.map((o) => {
          const st = STATUS_STYLES[o.status] || STATUS_STYLES.draft;
          const wh = WEBHOOK_STYLES[o.webhook_status] || WEBHOOK_STYLES.pending;
          const StatusIcon = st.icon;
          const items = safeItems(o);
          const remaining =
            o.status === "fired" && o.cancel_window_expires_at
              ? Math.max(0, Math.ceil((new Date(o.cancel_window_expires_at).getTime() - now) / 1000))
              : null;
          const inWindow = remaining !== null && remaining > 0;
          const expanded = expandedId === o.id;

          return (
            <div
              key={o.id}
              className={`bg-card border rounded-xl overflow-hidden transition-colors ${
                inWindow ? "border-primary/40" : "border-border"
              }`}
            >
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(expanded ? null : o.id)}
                className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${st.bg}`}>
                  <StatusIcon className={`w-5 h-5 ${st.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono ${st.color}`}>{st.label}</span>
                    {o.confirmation_code && (
                      <span className="text-xs font-mono text-muted-foreground">{o.confirmation_code}</span>
                    )}
                    {o.order_type && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase tracking-wider">
                        {o.order_type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1 truncate">
                    {items.length > 0
                      ? items.map((i) => `${i.qty || 1}× ${i.name}`).join(", ")
                      : "Order in progress…"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {o.customer_name ? `${o.customer_name} · ` : ""}
                    {o.caller_phone || "unknown caller"}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    {inWindow ? (
                      <span className="text-xs font-mono text-primary animate-pulse">Cancel: {remaining}s</span>
                    ) : o.status === "fired" ? (
                      <span className="text-xs font-mono text-muted-foreground">Window closed</span>
                    ) : null}
                    <span className={`text-xs font-mono ${wh.color}`}>Webhook: {wh.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Expandable detail */}
              {expanded && (
                <div className="border-t border-border px-4 py-4 bg-muted/20">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <DetailField icon={User} label="Customer name" value={o.customer_name || "Not stated"} />
                    <DetailField icon={Phone} label="Caller phone" value={o.caller_phone || "—"} />
                    <DetailField icon={Hash} label="Confirmation code" value={o.confirmation_code || "—"} mono />
                    <DetailField icon={Webhook} label="Webhook status" value={wh.label} />
                    <DetailField icon={Clock} label="Fired at" value={fmtTime(o.fired_at)} />
                    <DetailField
                      icon={Clock}
                      label="Cancel window"
                      value={inWindow ? `${remaining}s left` : o.cancel_window_expires_at ? "Closed" : "—"}
                    />
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Order items</p>
                    {items.length > 0 ? (
                      <ul className="space-y-1.5">
                        {items.map((i, idx) => (
                          <li key={idx} className="flex items-center justify-between text-sm bg-background/50 rounded-lg px-3 py-2">
                            <span>{i.name}</span>
                            <span className="font-mono text-primary">×{i.qty || 1}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No items parsed yet.</p>
                    )}
                  </div>

                  {/* Notes */}
                  {o.notes && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5" /> Special instructions
                      </p>
                      <p className="text-sm bg-background/50 rounded-lg px-3 py-2">{o.notes}</p>
                    </div>
                  )}

                  {/* Status timeline */}
                  <StatusTimeline status={o.status} webhookStatus={o.webhook_status} firedAt={o.fired_at} createdDate={o.created_date} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailField({ icon: Icon, label, value, mono }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <p className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}