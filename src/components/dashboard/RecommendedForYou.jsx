import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Phone, ArrowUpRight } from "lucide-react";
import { dialServices } from "@/data/dialServices";

// Maps marketplace listing categories → dial service categories
const categoryMap = {
  realestate: ["Housing", "Local"],
  vehicles: ["Transport", "Travel"],
  electronics: ["Shopping"],
  jobs: ["Productivity"],
  services: ["Local", "Finance", "Health"],
  other: ["Shopping", "Productivity", "Entertainment"],
};

// Fallback services when no interaction history exists
const defaultPicks = ["09", "15", "01", "06", "23", "14"];

export default function RecommendedForYou({ listings, user }) {
  const recommendations = useMemo(() => {
    // Derive categories from the user's own listings
    const myListings = user
      ? listings.filter((l) => l.created_by_id === user.id)
      : [];

    const interactedCats = [...new Set(myListings.map((l) => l.category).filter(Boolean))];

    if (interactedCats.length === 0) {
      // No history — show curated defaults
      return dialServices.filter((s) => defaultPicks.includes(s.id));
    }

    // Map to dial service categories
    const targetCats = [...new Set(interactedCats.flatMap((c) => categoryMap[c] || []))];

    // Score services by category match
    const scored = dialServices.map((svc) => {
      let score = 0;
      if (targetCats.includes(svc.category)) score += 2;
      return { ...svc, score };
    });

    // Return top matches, fall back to defaults if empty
    const matched = scored.filter((s) => s.score > 0);
    const pool = matched.length >= 3 ? matched : [...matched, ...dialServices.filter((s) => defaultPicks.includes(s.id))];
    return pool.slice(0, 6);
  }, [listings, user]);

  const hasHistory = user ? listings.some((l) => l.created_by_id === user.id) : false;

  return (
    <div className="p-5 lg:p-6" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// RECOMMENDED FOR YOU</p>
        </div>
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
          {hasHistory ? "BASED ON YOUR ACTIVITY" : "TRENDING NOW"}
        </span>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendations.map((svc, i) => (
          <motion.div
            key={svc.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group p-4 transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.12)]"
            style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{svc.icon}</span>
              <span className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] tracking-widest" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}>
                <Phone size={9} /> {svc.dial}
              </span>
            </div>
            <h3 className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>{svc.name}</h3>
            <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>{svc.category.toUpperCase()}</p>
            <p className="text-xs mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{svc.desc}</p>
            <div className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase transition-colors" style={{ color: "#D1FF26" }}>
              Explore <ArrowUpRight size={11} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}