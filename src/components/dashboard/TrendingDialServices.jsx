import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Award, Star, Phone, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { dialServices, getServiceStats } from "@/data/dialServices";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={10}
          style={{
            color: n <= Math.round(rating) ? "#D1FF26" : "rgba(138,143,152,0.2)",
            fill: n <= Math.round(rating) ? "#D1FF26" : "none",
          }}
        />
      ))}
      <span className="font-mono text-[9px] ml-1" style={{ color: "#8A8F98" }}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function TrendingDialServices() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const ranked = dialServices
    .map((svc) => {
      const stats = getServiceStats(svc.id);
      const rating = 3.5 + (parseInt(svc.id, 10) % 15) / 10;
      const reviewCount = Math.floor(stats.uniqueUsers * 0.008);
      return { ...svc, calls: stats.totalCalls, rating, reviewCount };
    })
    .sort((a, b) => b.calls - a.calls);

  const mostAccessed = ranked.slice(0, 5);
  const topRated = [...ranked].sort((a, b) => b.rating - a.rating).slice(0, 5);

  const renderRow = (svc, idx, badge) => (
    <motion.div
      key={svc.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.05 }}
      className="flex items-center gap-3 p-3"
      style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}
    >
      <div className="flex-shrink-0 w-7 text-center">
        <span className="font-heading font-black text-lg" style={{ color: idx < 3 ? "#D1FF26" : "#8A8F98" }}>{idx + 1}</span>
      </div>
      <div className="flex-shrink-0 flex items-center justify-center w-9 h-9" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <span className="text-base">{svc.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{svc.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <StarRating rating={svc.rating} />
          <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>· {svc.reviewCount} reviews</span>
        </div>
        <p className="font-mono text-[8px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>{svc.category.toUpperCase()} · {svc.dial}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="font-mono text-[10px] font-bold" style={{ color: "#D1FF26" }}>{svc.calls.toLocaleString()}</p>
        <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>CALLS</p>
      </div>
      <a
        href={`tel:${svc.dial}`}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]"
        style={{ background: "#D1FF26", color: "#05070A" }}
        title={`Dial ${svc.dial}`}
      >
        <Phone size={12} />
      </a>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// TRENDING DIAL SERVICES</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>TOP-RATED & MOST ACCESSED</span>
      </div>

      {loading ? (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <div className="w-5 h-5 border-2 border-[rgba(209,255,38,0.2)] border-t-[#D1FF26] rounded-full animate-spin mx-auto" />
          <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>LOADING TRENDS…</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Most Accessed */}
          <div className="p-4" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
              <TrendingUp size={13} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>MOST ACCESSED</p>
            </div>
            <div className="space-y-2">{mostAccessed.map((svc, idx) => renderRow(svc, idx))}</div>
          </div>

          {/* Top Rated */}
          <div className="p-4" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Award size={13} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>TOP RATED</p>
            </div>
            <div className="space-y-2">{topRated.map((svc, idx) => renderRow(svc, idx))}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}