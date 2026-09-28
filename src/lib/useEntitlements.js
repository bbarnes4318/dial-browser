import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useEntitlements — reads the current user's active paid entitlements from the
 * Subscription (premium platform tiers) and DatingSubscription (dating tiers)
 * entities. Both entities use RLS that scopes reads to the owner, so this is
 * safe to call client-side. Entitlements are granted by the wix-payments-webhook
 * (status === "active"), never gated on is_verified.
 *
 * Returns:
 *   premiumTier   — "plus" | "premium" | "elite" | "ultimate" | null
 *   datingTier    — "plus" | "elite" | "free"
 *   hasPremium    — true if any active premium platform subscription exists
 *   hasDatingPlus — true if dating tier is plus or elite
 *   hasDatingElite— true if dating tier is elite
 *   loading       — true until the first read settles
 */
export function useEntitlements() {
  const [data, setData] = useState({
    premiumTier: null,
    datingTier: "free",
    hasPremium: false,
    hasDatingPlus: false,
    hasDatingElite: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me) {
          if (!cancelled) setData((s) => ({ ...s, loading: false }));
          return;
        }
        const [subs, datingSubs] = await Promise.all([
          base44.entities.Subscription
            .filter({ owner_user_id: me.id, subscription_active: true }, "-created_date", 5)
            .catch(() => []),
          base44.entities.DatingSubscription
            .filter({ created_by_id: me.id, status: "active" }, "-created_date", 5)
            .catch(() => []),
        ]);
        if (cancelled) return;
        const activeSub = (subs || [])[0] || null;
        const activeDating = (datingSubs || [])[0] || null;
        const datingTier = activeDating?.tier || "free";
        setData({
          premiumTier: activeSub?.tier || null,
          datingTier,
          hasPremium: !!activeSub,
          hasDatingPlus: datingTier === "plus" || datingTier === "elite",
          hasDatingElite: datingTier === "elite",
          loading: false,
        });
      } catch {
        if (!cancelled) setData((s) => ({ ...s, loading: false }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return data;
}