import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Trophy, Star, TrendingUp, Package } from "lucide-react";

export default function MerchantLeaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("merchant-leaderboard", {});
        if (cancelled) return;
        setRows(Array.isArray(res?.leaderboard) ? res.leaderboard : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading leaderboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Leaderboard is temporarily unavailable.
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No merchant activity yet. Once orders are completed, top performers appear here.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => {
        const rank = i + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
        return (
          <div
            key={`${r.merchant_name}-${rank}`}
            className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
              rank <= 3
                ? "bg-primary/5 border-primary/30"
                : "bg-card border-border"
            }`}
          >
            {/* Rank */}
            <div className="shrink-0 w-9 text-center">
              {medal ? (
                <span className="text-xl">{medal}</span>
              ) : (
                <span className="font-mono text-sm text-muted-foreground">#{rank}</span>
              )}
            </div>

            {/* Name + volume */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{r.merchant_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Package className="w-3 h-3" /> {r.order_count} orders · {r.completed_count} completed
              </p>
            </div>

            {/* Completion rate */}
            <div className="shrink-0 text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono text-sm font-semibold text-primary">{r.completion_rate}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">completion</p>
            </div>

            {/* Avg rating */}
            <div className="shrink-0 text-right min-w-[64px]">
              <div className="flex items-center gap-1.5 justify-end">
                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                <span className="font-mono text-sm font-semibold">
                  {r.rating_count > 0 ? r.avg_rating.toFixed(1) : "—"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {r.rating_count > 0 ? `${r.rating_count} reviews` : "no reviews"
              }</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}