import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  User, Heart, Music, Loader2, ChevronRight, Stethoscope,
  Activity, ListMusic, AlertCircle, Trash2, Calendar,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import ShareButtons from "@/components/profile/ShareButtons";

const urgencyColors = { low: "#D1FF26", moderate: "#FBBF24", high: "#FB923C", emergency: "#EF4444" };

const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return ""; }
};

export default function PersonalProfile() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  useEffect(() => {
    base44.auth.me().then((u) => { setUser(u); setLoadingUser(false); }).catch(() => setLoadingUser(false));
    base44.entities.HealthWellnessLog.filter({}, "-created_date", 50)
      .then((data) => setLogs(data || []))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
    base44.entities.RadioPlaylist.filter({}, "-created_date", 50)
      .then((data) => setPlaylists(data || []))
      .catch(() => {})
      .finally(() => setLoadingPlaylists(false));
  }, []);

  const deleteLog = async (log) => {
    try {
      await base44.entities.HealthWellnessLog.delete(log.id);
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-16 py-12 lg:py-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ChevronRight size={14} className="rotate-180" /> Back to Home
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// MY PERSONAL PROFILE</p>
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Your <span style={{ color: "#D1FF26" }}>Wellness & Music</span>
          </h1>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Your saved health wellness history and music preferences — all in one place.
          </p>
        </motion.div>

        {/* User card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="p-5 mb-8" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {loadingUser ? (
            <div className="flex items-center gap-3">
              <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING PROFILE…</span>
            </div>
          ) : user ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0" style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.4)" }}>
                <span className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{(user.full_name || user.email || "U").charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{user.full_name || "Member"}</p>
                <p className="font-mono text-[10px] mt-1" style={{ color: "#8A8F98" }}>{user.email}</p>
              </div>
              <div className="flex gap-3">
                <div className="text-center px-4 py-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>{logs.length}</p>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>WELLNESS ENTRIES</p>
                </div>
                <div className="text-center px-4 py-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>{playlists.length}</p>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>PLAYLISTS</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>SIGN IN TO VIEW PROFILE</p>
          )}
        </motion.div>

        {/* Health Wellness History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Heart size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// HEALTH WELLNESS HISTORY</p>
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{logs.length} ENTRIES</span>
            </div>
            {logs.length > 0 && (
              <ShareButtons
                text={`I've logged ${logs.length} wellness entr${logs.length === 1 ? "y" : "ies"} with 1 Call Away's TeleMedical Health Station 🩺`}
                url={`${window.location.origin}/#services-tabs`}
              />
            )}
          </div>

          {loadingLogs ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Stethoscope size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO WELLNESS HISTORY YET</p>
              <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.5)" }}>Use the TeleMedical Health Station to log general wellness info</p>
              <Link to="/#services-tabs" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                Try TeleMedical <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: log.entry_type === "followup" ? "rgba(138,143,152,0.12)" : "rgba(209,255,38,0.08)", color: log.entry_type === "followup" ? "#8A8F98" : "#D1FF26" }}>
                        {log.entry_type === "followup" ? "FOLLOW-UP" : "SYMPTOM"}
                      </span>
                      {log.urgency_level && (
                        <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: `${urgencyColors[log.urgency_level]}1a`, color: urgencyColors[log.urgency_level] }}>
                          {log.urgency_level.toUpperCase()}
                        </span>
                      )}
                      {log.see_doctor_within && (
                        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>SEE PROVIDER: {log.see_doctor_within}</span>
                      )}
                    </div>
                    <button onClick={() => deleteLog(log)} className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)] flex-shrink-0" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }} title="Remove entry">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="font-heading font-semibold text-sm mb-1" style={{ color: "#F5F5F7" }}>{log.symptom}</p>
                  {log.question && <p className="font-mono text-xs mb-2" style={{ color: "#D1FF26" }}>Q: {log.question}</p>}
                  {log.recommended_action && <p className="text-sm mb-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{log.recommended_action}</p>}
                  {log.possible_conditions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {log.possible_conditions.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 font-mono text-[9px]" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}>{c}</span>
                      ))}
                    </div>
                  )}
                  {log.home_remedies?.length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {log.home_remedies.map((r, i) => (
                        <li key={i} className="text-xs flex items-start gap-2" style={{ color: "#8A8F98" }}><span style={{ color: "#D1FF26" }}>•</span> {r}</li>
                      ))}
                    </ul>
                  )}
                  <p className="font-mono text-[9px] flex items-center gap-1" style={{ color: "rgba(138,143,152,0.6)" }}>
                    <Calendar size={9} /> {fmtDate(log.created_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
          <p className="font-mono text-[9px] mt-3 flex items-start gap-1.5" style={{ color: "rgba(239,68,68,0.6)" }}>
            <AlertCircle size={10} className="mt-0.5 flex-shrink-0" /> Wellness history is general information only — not a diagnosis or treatment. Always consult a licensed healthcare provider.
          </p>
        </motion.div>

        {/* Music Preferences */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Music size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// MUSIC PREFERENCES</p>
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{playlists.length} PLAYLISTS</span>
            </div>
            {playlists.length > 0 && (
              <ShareButtons
                text={`I've curated ${playlists.length} music playlist${playlists.length === 1 ? "" : "s"} on 1 Call Away 🎵`}
                url={`${window.location.origin}/#music-radio`}
              />
            )}
          </div>

          {loadingPlaylists ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
            </div>
          ) : playlists.length === 0 ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <ListMusic size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO PLAYLISTS SAVED YET</p>
              <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.5)" }}>Create a radio playlist to see it here</p>
              <Link to="/#music-radio" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                Browse Music & Radio <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {playlists.map((pl) => (
                <div key={pl.id} className="p-4" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)" }}>
                      <ListMusic size={16} style={{ color: "#D1FF26" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{pl.playlist_name}</p>
                      <p className="font-mono text-[9px] mt-0.5" style={{ color: "#D1FF26" }}>{(pl.station_ids || []).length} STATIONS</p>
                      {pl.description && <p className="text-xs mt-1.5" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{pl.description}</p>}
                      <p className="font-mono text-[9px] mt-2 flex items-center gap-1" style={{ color: "rgba(138,143,152,0.6)" }}>
                        <Calendar size={9} /> {fmtDate(pl.created_date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}