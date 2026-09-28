import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Store, Pause, Play, PhoneCall, RefreshCw, Webhook, MessageSquare, KeyRound, Wifi, WifiOff } from "lucide-react";
import MerchantEnrollmentForm from "@/components/merchant/MerchantEnrollmentForm";
import MerchantOrderList from "@/components/merchant/MerchantOrderList";
import MerchantAnalytics from "@/components/merchant/MerchantAnalytics";

export default function MerchantDispatchPage() {
  const [me, setMe] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const loadEnrollment = useCallback(async () => {
    const list = await base44.entities.MerchantDispatch.list("-created_date", 10);
    setEnrollment(list && list[0] ? list[0] : null);
  }, []);

  const loadOrders = useCallback(async () => {
    const list = await base44.entities.MerchantOrder.list("-created_date", 50);
    setOrders(list || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setMe(user);
        await loadEnrollment();
        await loadOrders();
      } catch (e) {
        console.error("MerchantDispatch load error:", e?.message);
      } finally {
        setLoading(false);
        setOrdersLoading(false);
      }
    })();
  }, [loadEnrollment, loadOrders]);

  // Realtime: orders arrive and update live without a refresh.
  useEffect(() => {
    const unsubscribe = base44.entities.MerchantOrder.subscribe((event) => {
      const { id, type, data } = event || {};
      if (!id) return;
      setOrders((prev) => {
        if (type === "delete") return prev.filter((o) => o.id !== id);
        const exists = prev.some((o) => o.id === id);
        const next = exists
          ? prev.map((o) => (o.id === id ? { ...o, ...data } : o))
          : [{ ...data, id }, ...prev];
        return next.sort((a, b) => {
          const ad = new Date(a.created_date || a.fired_at || 0).getTime();
          const bd = new Date(b.created_date || b.fired_at || 0).getTime();
          return bd - ad;
        });
      });
    });
    return unsubscribe;
  }, []);

  const toggleActive = async () => {
    if (!enrollment) return;
    setToggling(true);
    try {
      await base44.entities.MerchantDispatch.update(enrollment.id, { active: !enrollment.active });
      await loadEnrollment();
    } catch (e) {
      console.error("toggle failed:", e?.message);
    } finally {
      setToggling(false);
    }
  };

  const toggleStaffOnline = async () => {
    if (!enrollment) return;
    setTogglingOnline(true);
    try {
      await base44.entities.MerchantDispatch.update(enrollment.id, {
        staff_online: enrollment.staff_online === false ? true : false,
      });
      await loadEnrollment();
    } catch (e) {
      console.error("toggle staff online failed:", e?.message);
    } finally {
      setTogglingOnline(false);
    }
  };

  const refresh = async () => {
    setOrdersLoading(true);
    try {
      await loadOrders();
    } finally {
      setOrdersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!enrollment) {
    return <MerchantEnrollmentForm onEnrolled={loadEnrollment} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Store className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight">{enrollment.merchant_name}</h1>
          <p className="text-xs text-muted-foreground">Phone-In Order Dispatch</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={ordersLoading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${ordersLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            variant={enrollment.active ? "default" : "outline"}
            size="sm"
            onClick={toggleActive}
            disabled={toggling}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : enrollment.active ? (
              <Pause className="w-4 h-4 mr-1.5" />
            ) : (
              <Play className="w-4 h-4 mr-1.5" />
            )}
            {enrollment.active ? "Pause dispatch" : "Resume dispatch"}
          </Button>
          <Button
            variant={enrollment.staff_online === false ? "outline" : "default"}
            size="sm"
            onClick={toggleStaffOnline}
            disabled={togglingOnline}
          >
            {togglingOnline ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : enrollment.staff_online === false ? (
              <WifiOff className="w-4 h-4 mr-1.5" />
            ) : (
              <Wifi className="w-4 h-4 mr-1.5" />
            )}
            {enrollment.staff_online === false ? "Staff offline" : "Staff online"}
          </Button>
        </div>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-xl border p-4 mb-6 ${
          enrollment.active
            ? "bg-primary/5 border-primary/30"
            : "bg-muted/30 border-border"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              enrollment.active ? "bg-primary animate-pulse" : "bg-muted-foreground"
            }`}
          />
          <span className="text-sm font-medium">
            {enrollment.active ? "Dispatch active — orders are being sent to your queue" : "Dispatch paused — orders will not fire"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`w-2 h-2 rounded-full ${
              enrollment.staff_online === false ? "bg-muted-foreground" : "bg-primary animate-pulse"
            }`}
          />
          <span className="text-sm font-medium">
            {enrollment.staff_online === false
              ? "Staff offline — callers are told you're not accepting orders right now"
              : "Staff online — accepting phone-in orders"}
          </span>
        </div>
      </div>

      {/* Enrollment details */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <DetailRow icon={PhoneCall} label="Public phone" value={enrollment.public_phone} />
        <DetailRow icon={Webhook} label="Dispatch webhook" value={enrollment.dispatch_webhook_url} mono />
        <DetailRow icon={MessageSquare} label="Cancel-contact" value={enrollment.cancel_sms_number} />
        <DetailRow icon={KeyRound} label="Webhook secret" value={enrollment.webhook_secret ? "•••••••• (set)" : "not set"} mono />
      </div>

      {/* Forwarding instructions */}
      <div className="bg-card border border-border rounded-xl p-5 mb-8">
        <h2 className="font-heading text-sm font-semibold mb-2 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-primary" /> Call forwarding setup
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Forward your existing published number to the 1 Call Away order line so phone-in orders
          reach this dispatch flow. Your customers keep dialing your usual number — nothing changes
          on their side.
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          Contact support for the exact forwarding destination number and carrier forwarding codes
          (varies by provider — e.g. AT&amp;T: *72, Verizon: *71).
        </p>
      </div>

      {/* Analytics */}
      <MerchantAnalytics orders={orders} />

      {/* Orders */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-sm font-semibold flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Live orders
        </h2>
        <span className="text-xs text-muted-foreground">{orders.length} total</span>
      </div>
      <MerchantOrderList orders={orders} loading={ordersLoading} />
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className={`text-sm truncate ${mono ? "font-mono" : ""}`} title={value}>
        {value || "—"}
      </p>
    </div>
  );
}