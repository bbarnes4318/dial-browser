import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Search, ShieldCheck, TrendingUp, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Secure admin viewer for what voice services users are searching for.
// Data is PII-sanitized at write time (searchLogSanitizer) and re-sanitized on
// read — only opaque terms, categories, and an anonymous/hashed user marker
// ever reach this component.
function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function SearchLogViewer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getSearchLogs", {});
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load search logs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-8 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
        <AlertCircle size={14} style={{ color: "#ef4444" }} />
        <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  const total = data?.total || 0;
  const topTerms = data?.topTerms || [];
  const byCategory = data?.byCategory || [];
  const recent = data?.recent || [];
  const src = data?.sourceCounts || { directory: 0, landing: 0 };
  const maxTerm = Math.max(1, ...topTerms.map((t) => t.count));
  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 relative overflow-hidden" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Search size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SEARCH LOG — WHAT USERS ARE LOOKING FOR</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: "rgba(90,224,200,0.08)", color: "#5AE0C8", border: "0.5px solid rgba(90,224,200,0.2)" }}>
            <ShieldCheck size={11} /> PII STRIPPED
          </span>
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{total} TOTAL SEARCHES</span>
        </div>
      </div>

      {total === 0 ? (
        <p className="font-mono text-[10px] text-center py-8" style={{ color: "rgba(138,143,152,0.6)" }}>
          No searches logged yet. Terms will appear here as members search the service directory.
        </p>
      ) : (
        <>
          {/* Top search terms */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={11} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>TOP SEARCH TERMS</p>
            </div>
            <div className="space-y-1.5">
              {topTerms.map((t) => (
                <div key={t.term} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] w-40 truncate" style={{ color: "#F5F5F7" }}>{t.term}</span>
                  <div className="flex-1 h-2 relative" style={{ background: "rgba(138,143,152,0.08)" }}>
                    <div className="absolute top-0 left-0 h-full" style={{ width: `${(t.count / maxTerm) * 100}%`, background: "#D1FF26", boxShadow: "0 0 8px rgba(209,255,38,0.4)" }} />
                  </div>
                  <span className="font-mono text-[9px] w-8 text-right" style={{ color: "#D1FF26" }}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div>
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>SEARCHES BY CATEGORY</p>
              <div className="space-y-1.5">
                {byCategory.map((c) => (
                  <div key={c.category} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] w-28 truncate" style={{ color: "#F5F5F7" }}>{c.category}</span>
                    <div className="flex-1 h-2 relative" style={{ background: "rgba(138,143,152,0.08)" }}>
                      <div className="absolute top-0 left-0 h-full" style={{ width: `${(c.count / maxCat) * 100}%`, background: "#5AE0C8", boxShadow: "0 0 8px rgba(90,224,200,0.4)" }} />
                    </div>
                    <span className="font-mono text-[9px] w-8 text-right" style={{ color: "#5AE0C8" }}>{c.count}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>DIRECTORY: <b style={{ color: "#D1FF26" }}>{src.directory}</b></span>
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>LANDING: <b style={{ color: "#D1FF26" }}>{src.landing}</b></span>
              </div>
            </div>

            {/* Recent searches */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={11} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>RECENT SEARCHES</p>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {recent.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-1.5" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                    <span className="font-mono text-[10px] truncate flex-1" style={{ color: "#F5F5F7" }}>{r.query}</span>
                    <span className="font-mono text-[8px] flex-shrink-0" style={{ color: "#8A8F98" }}>{r.category}</span>
                    <span className="font-mono text-[8px] flex-shrink-0" style={{ color: "#8A8F98" }}>{timeAgo(r.created_date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}