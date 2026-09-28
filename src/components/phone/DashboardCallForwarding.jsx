import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import CallForwarding from "@/components/phone/CallForwarding";

/**
 * DashboardCallForwarding — self-contained wrapper that loads the member's
 * phone account and renders the CallForwarding control (toggle + secondary
 * number + visible routing status) directly inside the dashboard.
 */
export default function DashboardCallForwarding() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("phone-account", {});
      setAccount(res?.data || res);
    } catch (e) { console.error("phone-account load failed", e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;
  const entitlement = account?.entitlement;
  const isPaid = account?.tier && account.tier !== "free";
  return <CallForwarding entitlement={entitlement} isPaid={isPaid} onUpdated={load} />;
}