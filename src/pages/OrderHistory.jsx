import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  UtensilsCrossed,
  Car,
  Star,
  History,
  ChevronRight,
  Pin,
} from "lucide-react";
import OrderRatingDialog from "@/components/orders/OrderRatingDialog";

const FOOD_STATUS = {
  draft: "Draft",
  placed: "Placed",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const TRANSPORT_STATUS = {
  draft: "Draft",
  placed: "Placed",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "finished", label: "Finished" },
];

const ACTIVE_FOOD = ["placed", "confirmed", "out_for_delivery"];
const ACTIVE_TRANSPORT = ["placed", "confirmed"];

function parseItems(json) {
  try {
    const arr = JSON.parse(json || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function bucket(o) {
  const s = o.status;
  if (o._type === "transport") {
    if (s === "draft") return "pending";
    if (ACTIVE_TRANSPORT.includes(s)) return "active";
    return "finished";
  }
  if (s === "draft") return "pending";
  if (ACTIVE_FOOD.includes(s)) return "active";
  return "finished";
}

function favKey(o) {
  return o._type === "transport"
    ? `transport:${o.provider_name || o.origin || ""}`
    : `food:${o.restaurant_name || ""}`;
}

export default function OrderHistory() {
  const [me, setMe] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [filter, setFilter] = useState("all");
  const [favMap, setFavMap] = useState({});

  const loadFavorites = useCallback(async () => {
    try {
      const list = await base44.entities.SavedService.list("-created_date", 100);
      const map = {};
      (list || []).forEach((s) => {
        if (s.service_type === "food" || s.service_type === "transport") {
          if (s.reference_id) map[s.reference_id] = s.id;
        }
      });
      setFavMap(map);
    } catch (e) {
      console.error("OrderHistory fav load:", e?.message);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      setMe(user);
      const [food, transport] = await Promise.all([
        base44.entities.FoodOrder.list("-created_date", 50).catch(() => []),
        base44.entities.TransportBooking.list("-created_date", 50).catch(() => []),
      ]);
      const tagged = [
        ...(food || []).map((o) => ({ ...o, _type: "food" })),
        ...(transport || []).map((o) => ({ ...o, _type: "transport" })),
      ].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      setOrders(tagged);
      await loadFavorites();
    } catch (e) {
      console.error("OrderHistory load error:", e?.message);
    } finally {
      setLoading(false);
    }
  }, [loadFavorites]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates so newly placed/updated orders appear without a refresh.
  useEffect(() => {
    const unsubFood = base44.entities.FoodOrder.subscribe((event) => {
      const { id, type, data } = event || {};
      if (!id) return;
      setOrders((prev) => {
        if (type === "delete") return prev.filter((o) => o.id !== id);
        const tagged = { ...data, id, _type: "food" };
        const exists = prev.some((o) => o.id === id);
        const next = exists
          ? prev.map((o) => (o.id === id ? { ...o, ...tagged } : o))
          : [tagged, ...prev];
        return next.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      });
    });
    const unsubTransport = base44.entities.TransportBooking.subscribe((event) => {
      const { id, type, data } = event || {};
      if (!id) return;
      setOrders((prev) => {
        if (type === "delete") return prev.filter((o) => o.id !== id);
        const tagged = { ...data, id, _type: "transport" };
        const exists = prev.some((o) => o.id === id);
        const next = exists
          ? prev.map((o) => (o.id === id ? { ...o, ...tagged } : o))
          : [tagged, ...prev];
        return next.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      });
    });
    return () => {
      unsubFood && unsubFood();
      unsubTransport && unsubTransport();
    };
  }, []);

  const togglePin = async (o) => {
    const key = favKey(o);
    const existing = favMap[key];
    if (existing) {
      try {
        await base44.entities.SavedService.delete(existing);
        setFavMap((prev) => {
          const n = { ...prev };
          delete n[key];
          return n;
        });
      } catch (e) {
        console.error("unpin failed:", e?.message);
      }
      return;
    }
    const isTransport = o._type === "transport";
    const name = isTransport
      ? o.provider_name || `${o.origin || ""} → ${o.destination || ""}`
      : o.restaurant_name || "Food order";
    try {
      const created = await base44.entities.SavedService.create({
        service_type: isTransport ? "transport" : "food",
        service_name: name,
        reference_id: key,
        link_url: "/order-history",
        category: isTransport ? "Transport" : "Food",
        icon_emoji: isTransport ? "🚗" : "🍽️",
      });
      setFavMap((prev) => ({ ...prev, [key]: created.id }));
    } catch (e) {
      console.error("pin failed:", e?.message);
    }
  };

  const filtered = orders.filter((o) => filter === "all" || bucket(o) === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your orders…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight">Order history</h1>
          <p className="text-xs text-muted-foreground">All your food orders and transport bookings in one place</p>
        </div>
      </div>

      {/* Quick filters */}
      {orders.length > 0 && (
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 overscroll-contain">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? orders.length : orders.filter((o) => bucket(o) === f.key).length;
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
      )}

      {filtered.length === 0 ? (
        orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <History className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No orders yet. When you place a food order or book transport by voice, it shows up here.</p>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">No orders in this view.</p>
        )
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderHistoryCard
              key={o.id}
              order={o}
              pinned={!!favMap[favKey(o)]}
              onTogglePin={() => togglePin(o)}
              onRate={() => setRatingOrder(o)}
            />
          ))}
        </div>
      )}

      <OrderRatingDialog open={!!ratingOrder} onOpenChange={(v) => !v && setRatingOrder(null)} order={ratingOrder} />
    </div>
  );
}

function OrderHistoryCard({ order, pinned, onTogglePin, onRate }) {
  const isTransport = order._type === "transport";
  const Icon = isTransport ? Car : UtensilsCrossed;
  const status = isTransport ? TRANSPORT_STATUS[order.status] || order.status : FOOD_STATUS[order.status] || order.status;
  const items = isTransport ? [] : parseItems(order.cart_items_json);
  const title = isTransport
    ? `${order.origin || "—"} → ${order.destination || "—"}`
    : order.restaurant_name || "Food order";
  const subtitle = isTransport
    ? [order.vehicle_class_or_carrier, order.provider_name].filter(Boolean).join(" · ")
    : items.length > 0
    ? items.map((i) => `${i.qty || 1}× ${i.name}`).join(", ")
    : order.confirmation_code || "";
  const done = ["delivered", "completed", "confirmed"].includes(order.status);

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase tracking-wider">
            {isTransport ? "Transport" : "Food"}
          </span>
          <span className={`text-xs font-mono ${order.status === "cancelled" ? "text-destructive" : "text-primary"}`}>
            {status}
          </span>
        </div>
        <p className="text-sm font-medium mt-1 truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        {order.created_date && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {new Date(order.created_date).toLocaleString()}
          </p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-1">
        <button
          onClick={onTogglePin}
          title={pinned ? "Unpin from favorites" : "Pin to dashboard favorites"}
          className={`p-1.5 rounded-md transition-colors ${
            pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pin className="w-4 h-4" fill={pinned ? "currentColor" : "none"} />
        </button>
        {done ? (
          <Button variant="outline" size="sm" onClick={onRate}>
            <Star className="w-3.5 h-3.5 mr-1.5" /> Rate
          </Button>
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}