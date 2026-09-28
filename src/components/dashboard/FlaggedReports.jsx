import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Loader2, Check, X, Ban } from "lucide-react";
import { base44 } from "@/api/base44Client";

const REASON_LABELS = {
  inappropriate_photo: "Inappropriate photo",
  harassment: "Harassment / threats",
  fake_profile: "Fake / scam profile",
  spam: "Spam / solicitation",
  underage: "Underage member",
  other: "Other",
};

// Private admin-only panel listing pending dating-profile reports. Surfaces
// flagged accounts immediately (with a live badge + realtime refresh) and lets
// the admin mark each report reviewed, dismissed, or actioned.
export default function FlaggedReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = async () => {
    try {
      const r = await base44.entities.DatingReport.filter({ status: "pending" }, "-created_date", 100);
      setReports(r || []);
    } catch {
      /* non-admins can't read; stay silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.DatingReport.subscribe(() => load());
    return unsub;
  }, []);

  const act = async (id, status) => {
    setActing(id);
    try {
      await base44.entities.DatingReport.update(id, { status, reviewed_at: new Date().toISOString() });
      setReports((rs) => rs.filter((r) => r.id !== id));
    } catch {
      /* ignore */
    } finally {
      setActing(null);
    }
  };

  const urgent = reports.length > 0;

  return (
    <div
      className="mb-8 p-6"
      style={{
        background: "rgba(16,20,29,0.8)",
        border: urgent ? "0.5px solid rgba(239,68,68,0.4)" : "0.5px solid rgba(239,68,68,0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} style={{ color: urgent ? "#ef4444" : "#8A8F98" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: urgent ? "#ef4444" : "#8A8F98" }}>
            // FLAGGED DATING REPORTS
          </p>
        </div>
        {urgent && (
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] tracking-widest"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.4)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} /> {reports.length} NEED REVIEW
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 size={14} className="animate-spin" style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex items-center gap-2 py-3">
          <Check size={13} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO FLAGGED ACCOUNTS — ALL CLEAR</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reports.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4"
              style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(239,68,68,0.2)" }}
            >
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div>
                  <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>
                    Flagged: <span style={{ color: "#ef4444" }}>{r.reported_name}</span>
                  </p>
                  <p className="font-mono text-[9px] mt-0.5" style={{ color: "#8A8F98" }}>
                    Reported by {r.reported_by_name || "a member"} · {new Date(r.created_date).toLocaleString()}
                  </p>
                </div>
                <span
                  className="font-mono text-[8px] tracking-widest px-2 py-1"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.3)" }}
                >
                  {(REASON_LABELS[r.reason] || r.reason).toUpperCase()}
                </span>
              </div>
              {r.description && (
                <p
                  className="text-xs mb-3 p-2.5"
                  style={{ background: "rgba(16,20,29,0.6)", color: "#8A8F98", lineHeight: 1.5, border: "0.5px solid rgba(138,143,152,0.1)" }}
                >
                  "{r.description}"
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => act(r.id, "actioned")}
                  disabled={acting === r.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase disabled:opacity-40"
                  style={{ background: "#ef4444", color: "#05070A" }}
                >
                  {acting === r.id ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />} Action taken
                </button>
                <button
                  onClick={() => act(r.id, "reviewed")}
                  disabled={acting === r.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase disabled:opacity-40"
                  style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)" }}
                >
                  <Check size={11} /> Mark reviewed
                </button>
                <button
                  onClick={() => act(r.id, "dismissed")}
                  disabled={acting === r.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase disabled:opacity-40"
                  style={{ color: "#8A8F98" }}
                >
                  <X size={11} /> Dismiss
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}