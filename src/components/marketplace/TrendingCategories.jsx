import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, Heart } from "lucide-react";

const categoryMeta = {
  realestate: { label: "Real Estate", icon: "🏠" },
  vehicles: { label: "Vehicles", icon: "🚗" },
  electronics: { label: "Electronics", icon: "📱" },
  jobs: { label: "Jobs", icon: "💼" },
  services: { label: "Services", icon: "🔧" },
  other: { label: "Other", icon: "📦" },
};

// Compatibility traits derived from each category — helps members find
// others with shared interests / lifestyles for better matches.
const categoryTraits = {
  realestate: { trait: "Homebody", compatibility: 78 },
  vehicles: { trait: "Adventurer", compatibility: 85 },
  electronics: { trait: "Tech Enthusiast", compatibility: 91 },
  jobs: { trait: "Career-Driven", compatibility: 73 },
  services: { trait: "Community Helper", compatibility: 88 },
  other: { trait: "Open-Minded", compatibility: 69 },
};

export default function TrendingCategories({ listings }) {
  const stats = useMemo(() => {
    const counts = {};
    listings.forEach((l) => {
      if (l.status !== "active") return;
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([cat, count]) => {
        const meta = categoryMeta[cat] || categoryMeta.other;
        const traits = categoryTraits[cat] || categoryTraits.other;
        return {
          cat,
          label: meta.label,
          icon: meta.icon,
          count,
          share: Math.round((count / total) * 100),
          trait: traits.trait,
          compatibility: traits.compatibility,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [listings]);

  if (stats.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// TRENDING COMPATIBILITY CATEGORIES</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.cat}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="p-4 flex flex-col"
            style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.12)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>
                <ArrowUpRight size={9} /> {s.share}%
              </span>
            </div>

            <p className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>{s.label}</p>
            <p className="font-mono text-[8px] mb-3" style={{ color: "#8A8F98" }}>{s.count} active listing{s.count !== 1 ? "s" : ""}</p>

            {/* Compatibility bar */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                  <Heart size={8} style={{ color: "#D1FF26" }} /> {s.trait}
                </span>
                <span className="font-mono text-[8px] font-bold" style={{ color: "#D1FF26" }}>{s.compatibility}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden" style={{ background: "rgba(138,143,152,0.15)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.compatibility}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                  className="h-full"
                  style={{ background: "#D1FF26" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="font-mono text-[8px] mt-3" style={{ color: "rgba(138,143,152,0.5)" }}>
        Categories ranked by active listings · compatibility traits help you find members with shared interests
      </p>
    </div>
  );
}