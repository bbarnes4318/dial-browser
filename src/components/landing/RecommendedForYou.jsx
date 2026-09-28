import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Phone, ArrowUpRight, Loader2, Headphones } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { dialServices } from "@/data/dialServices";
import { getCategoryFrequency, hasAccessHistory } from "@/lib/serviceRecommendations";

// Curated fallback picks when no listen history exists
const DEFAULT_PICKS = ["09", "06", "15", "04", "12"];

export default function RecommendedForYou() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch the user's listen/search history from VoiceInteraction
  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      try {
        const records = await base44.entities.VoiceInteraction.list("-created_date", 100);
        if (!cancelled) setInteractions(records || []);
      } catch {
        // Anonymous user or entity unavailable — fall back to localStorage signals
        if (!cancelled) setInteractions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, []);

  const { recommendations, hasHistory, topCategories } = useMemo(() => {
    // Build a frequency map of categories the user has shown interest in
    const catFreq = getCategoryFrequency();

    // Also extract signals from VoiceInteraction records
    const serviceNameCounts = {};
    const tagCounts = {};
    const queryTerms = [];

    interactions.forEach((i) => {
      if (i.service_name) {
        const name = i.service_name.toLowerCase();
        serviceNameCounts[name] = (serviceNameCounts[name] || 0) + 1;
      }
      if (i.tags && Array.isArray(i.tags)) {
        i.tags.forEach((t) => {
          const tag = t.toLowerCase();
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      if (i.query) {
        queryTerms.push(i.query.toLowerCase());
      }
      if (i.title) {
        queryTerms.push(i.title.toLowerCase());
      }
    });

    // Combine localStorage category frequency with any tags that match categories
    const combinedCatFreq = { ...catFreq };
    Object.entries(tagCounts).forEach(([tag, count]) => {
      const capitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
      if (dialServices.some((s) => s.category.toLowerCase() === tag)) {
        combinedCatFreq[capitalized] = (combinedCatFreq[capitalized] || 0) + count;
      }
    });

    const hasHistoryData = hasAccessHistory() || interactions.length > 0;
    const topCats = Object.entries(combinedCatFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Score every dial service
    const scored = dialServices.map((svc) => {
      let score = 0;
      const svcName = svc.name.toLowerCase();
      const svcTags = svc.tags.map((t) => t.toLowerCase());

      // Category match — strongest signal
      if (combinedCatFreq[svc.category]) {
        score += combinedCatFreq[svc.category] * 3;
      }

      // Direct service name match
      if (serviceNameCounts[svcName]) {
        score += serviceNameCounts[svcName] * 5;
      }

      // Tag overlap
      svcTags.forEach((tag) => {
        if (tagCounts[tag]) score += tagCounts[tag] * 2;
      });

      // Query text overlap
      queryTerms.forEach((q) => {
        if (q.includes(svcName) || svcName.includes(q)) score += 3;
        svcTags.forEach((tag) => {
          if (q.includes(tag)) score += 1;
        });
      });

      return { ...svc, score };
    });

    let pool;
    if (hasHistoryData) {
      const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
      // If we have at least 3 matches, use them; otherwise supplement with defaults
      if (matched.length >= 3) {
        const matchedIds = new Set(matched.map((m) => m.id));
        const fillers = dialServices
          .filter((s) => !matchedIds.has(s.id) && DEFAULT_PICKS.includes(s.id))
          .slice(0, 6 - matched.length);
        pool = [...matched, ...fillers].slice(0, 6);
      } else {
        const matchedIds = new Set(matched.map((m) => m.id));
        const fillers = dialServices
          .filter((s) => !matchedIds.has(s.id) && DEFAULT_PICKS.includes(s.id))
          .slice(0, 6 - matched.length);
        pool = [...matched, ...fillers].slice(0, 6);
      }
    } else {
      pool = dialServices.filter((s) => DEFAULT_PICKS.includes(s.id));
    }

    return { recommendations: pool, hasHistory: hasHistoryData, topCategories: topCats };
  }, [interactions]);

  return (
    <section
      ref={sectionRef}
      id="recommended"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 6s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-8 lg:mb-10"
        >
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Sparkles size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// RECOMMENDED FOR YOU</p>
            <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#8A8F98" }}>
              {hasHistory ? "BASED ON YOUR LISTEN HISTORY" : "TRENDING PICKS FOR YOU"}
            </span>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Picked for <span style={{ color: "#D1FF26" }}>Your Frequency.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            {hasHistory
              ? "Services matched to the categories and topics you've been searching and listening to. The more you use the Dial Browser, the smarter these get."
              : "Start searching and listening — your recommendations will personalize automatically based on what you dial into."}
          </p>

          {/* Top categories chips */}
          {hasHistory && topCategories.length > 0 && (
            <div className="flex items-center gap-2 mt-5 flex-wrap">
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>YOUR TOP CATEGORIES:</span>
              {topCategories.map((cat) => (
                <span key={cat} className="font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                  {cat.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((svc, i) => (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.4) }}
                className="group relative p-5 transition-all duration-500 hover:shadow-[0_0_20px_rgba(209,255,38,0.12)]"
                style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.08)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{svc.icon}</span>
                  <span className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] tracking-widest" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}>
                    <Phone size={9} /> {svc.dial}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>{svc.name}</h3>
                <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>{svc.category.toUpperCase()}</p>
                <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{svc.desc}</p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <Link
                    to="/directory"
                    className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase transition-colors"
                    style={{ color: "#D1FF26" }}
                  >
                    Explore <ArrowUpRight size={11} />
                  </Link>
                  {hasHistory && svc.score > 0 && (
                    <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                      <Headphones size={9} /> MATCH
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}