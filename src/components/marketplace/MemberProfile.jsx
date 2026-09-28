import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Award, TrendingUp, ShieldCheck, CheckCircle2, MessageSquare, Trophy } from "lucide-react";
import ReputationBadge, { getReputationTier } from "./ReputationBadge";
import { base44 } from "@/api/base44Client";

export default function MemberProfile({ memberName, refreshKey = 0 }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!memberName) {
      setLoading(false);
      return;
    }
    try {
      const data = await base44.entities.Trade.filter(
        { seller_name: memberName, status: "completed" },
        "-completed_date",
        50
      );
      setTrades(data);
    } catch {
      // silently fail — empty state shows
    } finally {
      setLoading(false);
    }
  }, [memberName, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const completedTrades = trades.length;
  const ratedTrades = trades.filter((t) => t.rating);
  const avgRating =
    ratedTrades.length > 0
      ? ratedTrades.reduce((sum, t) => sum + t.rating, 0) / ratedTrades.length
      : 0;
  const positiveCount = ratedTrades.filter((t) => t.rating >= 4).length;
  const positiveRate =
    ratedTrades.length > 0 ? Math.round((positiveCount / ratedTrades.length) * 100) : 0;
  const reputationScore = Math.round(completedTrades * 10 + avgRating * 5 + positiveRate * 0.3);
  const tier = getReputationTier(completedTrades, avgRating);
  const TierIcon = tier.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#D1FF26] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-5 lg:p-6"
      style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.25)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Trophy size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
          // MEMBER REPUTATION
        </p>
      </div>

      {completedTrades === 0 ? (
        <div className="text-center py-8">
          <ShieldCheck size={32} style={{ color: "rgba(209,255,38,0.3)" }} className="mx-auto" />
          <p className="font-heading font-bold text-lg mt-3" style={{ color: "#F5F5F7" }}>
            No completed trades yet
          </p>
          <p className="font-mono text-[9px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>
            Complete your first trade to start building reputation
          </p>
        </div>
      ) : (
        <>
          {/* Score + Tier */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full" style={{ background: "rgba(209,255,38,0.06)", border: "2px solid rgba(209,255,38,0.3)" }}>
              <div className="text-center">
                <p className="font-heading font-black text-3xl" style={{ color: "#D1FF26" }}>
                  {reputationScore}
                </p>
                <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>
                  REP SCORE
                </p>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TierIcon size={16} style={{ color: tier.color }} />
                <span className="font-heading font-black text-xl" style={{ color: tier.color }}>
                  {tier.label}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.round(avgRating) ? "fill-current" : ""}
                    style={{ color: i < Math.round(avgRating) ? "#D1FF26" : "rgba(138,143,152,0.25)" }}
                  />
                ))}
                <span className="font-mono text-[10px] ml-1" style={{ color: "#8A8F98" }}>
                  {avgRating.toFixed(1)} avg
                </span>
              </div>
              <ReputationBadge completedTrades={completedTrades} avgRating={avgRating} size="md" />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Completed", value: completedTrades, icon: CheckCircle2 },
              { label: "Positive", value: `${positiveRate}%`, icon: Award },
              { label: "Reviews", value: ratedTrades.length, icon: MessageSquare },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-3 text-center" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <Icon size={12} style={{ color: "#D1FF26" }} className="mx-auto mb-1" />
                  <p className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>
                    {stat.value}
                  </p>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Recent reviews */}
          {ratedTrades.length > 0 && (
            <div>
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>
                RECENT FEEDBACK
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {ratedTrades.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-3" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>
                        {t.buyer_name}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={9}
                            className={i < t.rating ? "fill-current" : ""}
                            style={{ color: i < t.rating ? "#D1FF26" : "rgba(138,143,152,0.25)" }}
                          />
                        ))}
                      </div>
                    </div>
                    {t.review_text && (
                      <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                        "{t.review_text}"
                      </p>
                    )}
                    <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>
                      {t.listing_title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}