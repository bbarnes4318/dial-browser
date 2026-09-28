import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Phone, ArrowUpRight, Loader2, Tag, History } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { dialServices } from "@/data/dialServices";

// Maps VoiceInteraction tags → dial service categories + tags
const tagToServiceTags = {
  Medical: ["health", "doctor", "pharmacy", "medical", "emergency"],
  Health: ["health", "doctor", "pharmacy", "medical"],
  Travel: ["travel", "flight", "hotel", "car", "rental"],
  Finance: ["finance", "money", "transfer", "bill", "payment"],
  Legal: ["local", "business"],
  Housing: ["housing", "rent", "apartment", "real estate", "property"],
  Jobs: ["job", "career", "employment", "work"],
  Education: ["ai", "assistant", "research"],
  Family: ["local", "food", "delivery", "grocery"],
  Emergency: ["emergency", "health", "urgent", "safety"],
  Shopping: ["shopping", "marketplace", "buy", "sell", "trade"],
};

// Maps service_name text → service IDs for direct matching
function matchServiceByName(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return dialServices
    .filter((s) =>
      s.name.toLowerCase().includes(lower) ||
      lower.includes(s.name.toLowerCase()) ||
      s.tags.some((t) => lower.includes(t))
    )
    .map((s) => s.id);
}

export default function ServiceRecommendations({ user }) {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await base44.entities.VoiceInteraction.list("-created_date", 50);
        setInteractions(data || []);
      } catch {
        // no history available
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const { recommendations, hasHistory, reasons } = useMemo(() => {
    // Only consider service calls and dial browser searches as "call history"
    const history = interactions.filter(
      (i) => i.source === "service_call" || i.source === "dial_browser"
    );

    if (history.length === 0) {
      // No history — return trending defaults
      return {
        recommendations: dialServices.filter((s) => ["09", "15", "06", "03", "14", "12"].includes(s.id)),
        hasHistory: false,
        reasons: {},
      };
    }

    // Collect all tags from interactions
    const allTags = history.flatMap((i) => i.tags || []);
    const tagCounts = {};
    allTags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });

    // Collect service names referenced
    const serviceNames = history.map((i) => i.service_name).filter(Boolean);

    // Collect query keywords
    const queries = history.map((i) => i.query).filter(Boolean);

    // Score each service
    const scored = dialServices.map((svc) => {
      let score = 0;
      const reasonsList = [];

      // Tag-based scoring (weighted by frequency)
      Object.entries(tagCounts).forEach(([tag, count]) => {
        const serviceTags = tagToServiceTags[tag] || [];
        const matchesTag = serviceTags.some((st) =>
          svc.tags.includes(st) || svc.category.toLowerCase().includes(st)
        );
        if (matchesTag) {
          score += count * 3;
          reasonsList.push(`Your "${tag}" interactions`);
        }
      });

      // Direct service name match
      serviceNames.forEach((name) => {
        const matchedIds = matchServiceByName(name);
        if (matchedIds.includes(svc.id)) {
          score += 5;
          reasonsList.push(`You called ${name}`);
        }
      });

      // Query keyword matching
      queries.forEach((q) => {
        const lower = q.toLowerCase();
        if (svc.tags.some((t) => lower.includes(t)) || lower.includes(svc.category.toLowerCase())) {
          score += 2;
          reasonsList.push(`You searched "${q.slice(0, 30)}"`);
        }
        const matchedIds = matchServiceByName(q);
        if (matchedIds.includes(svc.id)) {
          score += 3;
          reasonsList.push(`You searched "${q.slice(0, 30)}"`);
        }
      });

      return { ...svc, score, reasonsList: [...new Set(reasonsList)] };
    });

    // Filter to scored services, fill with defaults if not enough
    const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    const defaults = dialServices.filter((s) => ["09", "15", "06"].includes(s.id));
    const pool = matched.length >= 4 ? matched : [...matched, ...defaults.filter((d) => !matched.find((m) => m.id === d.id))];

    const topPicks = pool.slice(0, 6);
    const reasonMap = {};
    topPicks.forEach((s) => {
      reasonMap[s.id] = s.reasonsList[0] || "Trending now";
    });

    return { recommendations: topPicks, hasHistory: true, reasons: reasonMap };
  }, [interactions]);

  if (loading) {
    return (
      <div className="p-5 lg:p-6 flex items-center justify-center" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)", minHeight: 200 }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// RECOMMENDED FOR YOU</p>
        </div>
        <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
          {hasHistory ? <><History size={9} /> BASED ON YOUR CALLS</> : "TRENDING NOW"}
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
          >
            <Link
              to={`/directory/${svc.id}`}
              className="group block p-4 h-full transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.12)]"
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
              {hasHistory && reasons[svc.id] && (
                <p className="flex items-center gap-1 font-mono text-[8px] mb-2" style={{ color: "rgba(209,255,38,0.7)" }}>
                  <Tag size={8} /> {reasons[svc.id]}
                </p>
              )}
              <p className="text-xs mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{svc.desc}</p>
              <div className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase transition-colors" style={{ color: "#D1FF26" }}>
                Explore <ArrowUpRight size={11} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}