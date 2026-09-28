import React from "react";
import { Star, Award, TrendingUp, ShieldCheck } from "lucide-react";

export function getReputationTier(completedTrades = 0, avgRating = 0) {
  const score = completedTrades * 10 + avgRating * 5;
  if (score >= 100) return { label: "Trusted", icon: Award, color: "#D1FF26" };
  if (score >= 50) return { label: "Rising Star", icon: TrendingUp, color: "#D1FF26" };
  if (score >= 20) return { label: "Active", icon: ShieldCheck, color: "#8A8F98" };
  return { label: "New", icon: ShieldCheck, color: "#8A8F98" };
}

export default function ReputationBadge({ completedTrades = 0, avgRating = 0, size = "sm" }) {
  const tier = getReputationTier(completedTrades, avgRating);
  const Icon = tier.icon;
  const stars = Math.round(avgRating);
  const iconSize = size === "sm" ? 10 : 12;
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1"
      style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}
    >
      <Icon size={iconSize} style={{ color: tier.color }} />
      <span className={`font-mono ${textSize} tracking-widest uppercase`} style={{ color: tier.color }}>
        {tier.label}
      </span>
      {completedTrades > 0 && (
        <>
          <span style={{ color: "rgba(138,143,152,0.4)" }}>·</span>
          <span className={`font-mono ${textSize}`} style={{ color: "#8A8F98" }}>
            {completedTrades} {completedTrades === 1 ? "trade" : "trades"}
          </span>
          <div className="flex items-center gap-0.5 ml-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={8}
                className={i < stars ? "fill-current" : ""}
                style={{ color: i < stars ? "#D1FF26" : "rgba(138,143,152,0.25)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}