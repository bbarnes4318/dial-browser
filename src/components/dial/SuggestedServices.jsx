import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Phone, Copy, Check, TrendingUp } from "lucide-react";
import { dialServices, getServiceStatus } from "@/data/dialServices";
import { getRecommendedServices, getTopCategories } from "@/lib/serviceRecommendations";

export default function SuggestedServices({ refreshKey = 0 }) {
  const recommendations = useMemo(() => getRecommendedServices(dialServices, 6), [refreshKey]);
  const topCats = useMemo(() => getTopCategories(3), [refreshKey]);

  if (recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>
            // SUGGESTED FOR YOU
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={11} style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
            BASED ON {topCats.length} INTEREST{topCats.length !== 1 ? "S" : ""}
          </span>
        </div>
      </div>

      {/* Interest chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {topCats.map((cat) => (
          <span
            key={cat}
            className="font-mono text-[8px] tracking-widest uppercase px-2 py-1"
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {recommendations.map((service, i) => (
          <SuggestedCard key={service.id} service={service} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

function SuggestedCard({ service, index }) {
  const [copied, setCopied] = useState(false);
  const status = getServiceStatus(service.id);

  const copyCode = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(service.dial);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25) }}
      className="group relative p-4 transition-all duration-300"
      style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.12)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{service.icon}</span>
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: status === "active" ? "#D1FF26" : "#F5A623",
              boxShadow: status === "active" ? "0 0 6px #D1FF26" : "0 0 6px #F5A623",
              animation: "dotPulse 1.5s ease-in-out infinite",
            }}
          />
          <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
            {service.category}
          </span>
        </div>
      </div>

      <h4 className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>{service.name}</h4>
      <p className="text-[11px] leading-relaxed mb-3 line-clamp-2" style={{ color: "#8A8F98" }}>{service.desc}</p>

      <div className="flex items-center justify-between pt-2.5" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
        <button onClick={copyCode} className="flex items-center gap-1.5 transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.15)]">
          {copied ? <Check size={11} style={{ color: "#D1FF26" }} /> : <Copy size={11} style={{ color: "#8A8F98" }} />}
          <span className="font-mono text-[11px] font-bold" style={{ color: "#D1FF26" }}>{service.dial}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <a
            href={`tel:${service.dial}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2 py-1 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]"
            style={{ background: "#D1FF26", color: "#05070A" }}
            title={`Call ${service.dial}`}
          >
            <Phone size={10} /> Call
          </a>
          <Link
            to={`/directory/${service.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-[8px] tracking-widest uppercase px-2 py-1 transition-all"
            style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
          >
            Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}