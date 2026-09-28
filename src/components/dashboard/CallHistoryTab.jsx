import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneIncoming, PhoneOutgoing, Phone, PhoneMissed, Clock, Loader2, PhoneCall, Search, Volume2, Play, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatESTTime, formatESTDate } from "@/lib/timeFormat";
import TagBar, { TagDisplay, TagEditor } from "@/components/dashboard/TagBar";
import CallHistoryChart from "@/components/dashboard/CallHistoryChart";

const STATUS_STYLES = {
  answered: { color: "#D1FF26", label: "ANSWERED", bg: "rgba(209,255,38,0.08)" },
  completed: { color: "#D1FF26", label: "COMPLETED", bg: "rgba(209,255,38,0.08)" },
  ringing: { color: "#D1FF26", label: "RINGING", bg: "rgba(209,255,38,0.08)" },
  missed: { color: "#ef4444", label: "MISSED", bg: "rgba(239,68,68,0.08)" },
  declined: { color: "#ef4444", label: "DECLINED", bg: "rgba(239,68,68,0.08)" },
  unknown: { color: "#8A8F98", label: "UNKNOWN", bg: "rgba(138,143,152,0.08)" },
};

const CALL_TYPE_STYLES = {
  contact: { color: "#D1FF26", label: "CONTACT" },
  unknown: { color: "#8A8F98", label: "UNKNOWN" },
  blocked: { color: "#ef4444", label: "BLOCKED" },
  spam: { color: "#ef4444", label: "SPAM" },
};

function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const isToday = date.toLocaleDateString("en-US", { timeZone: "America/New_York" }) === now.toLocaleDateString("en-US", { timeZone: "America/New_York" });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toLocaleDateString("en-US", { timeZone: "America/New_York" }) === yesterday.toLocaleDateString("en-US", { timeZone: "America/New_York" });

  const time = formatESTTime(dateStr);

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  if (diff < 7 * 86400000) return `${date.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" })}, ${time}`;
  return formatESTDate(dateStr);
}

export default function CallHistoryTab() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [autoTranscribing, setAutoTranscribing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const [incoming, outgoing, serviceReqs] = await Promise.all([
        base44.entities.IncomingCall.list("-created_date", 100).catch(() => []),
        base44.entities.VoiceInteraction.list("-created_date", 100).catch(() => []),
        base44.entities.ServiceRequest.list("-created_date", 100).catch(() => []),
      ]);

      const incomingCalls = (incoming || []).map((c) => ({
        ...c,
        direction: "incoming",
        caller: c.caller_name || c.caller_phone || "Unknown",
        phone: c.caller_phone || "",
        status_key: c.status || "missed",
        timestamp: c.created_date,
        sortTime: c.created_date ? new Date(c.created_date).getTime() : 0,
      }));

      const outgoingCalls = (outgoing || []).map((c) => ({
        ...c,
        direction: "outgoing",
        caller: c.service_name || c.title || "Dial Browser",
        phone: "",
        status_key: "completed",
        timestamp: c.created_date,
        sortTime: c.created_date ? new Date(c.created_date).getTime() : 0,
      }));

      const serviceCalls = (serviceReqs || []).map((r) => ({
        ...r,
        direction: "service",
        caller: `${(r.service_type || "service").charAt(0).toUpperCase() + (r.service_type || "service").slice(1)} Request`,
        phone: r.requester_phone || "",
        status_key: r.status === "completed" ? "completed" : r.status === "action_needed" ? "missed" : "ringing",
        timestamp: r.created_date,
        sortTime: r.created_date ? new Date(r.created_date).getTime() : 0,
        query: r.details ? r.details.slice(0, 100) : "",
      }));

      const merged = [...incomingCalls, ...outgoingCalls, ...serviceCalls].sort((a, b) => b.sortTime - a.sortTime);
      setCalls(merged);

      // Auto-transcribe outgoing calls that have audio but no transcript
      const needsTranscription = outgoingCalls.filter((c) => c.audio_url && !c.transcript);
      if (needsTranscription.length > 0) {
        setAutoTranscribing(true);
        autoTranscribePending(needsTranscription);
      }
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  };

  const autoTranscribePending = async (items) => {
    for (const item of items) {
      try {
        const result = (await base44.functions.invoke("transcribe-audio", { audio_url: item.audio_url })).data;
        const transcript = (result?.transcript || "").trim();
        if (transcript) {
          await base44.entities.VoiceInteraction.update(item.id, { transcript });
          setCalls((prev) => prev.map((c) => (c.id === item.id ? { ...c, transcript } : c)));
        }
      } catch {
        // skip failed transcription silently
      }
    }
    setAutoTranscribing(false);
  };

  const updateCallTags = async (call, newTags) => {
    if (call.direction !== "outgoing") return;
    try {
      await base44.entities.VoiceInteraction.update(call.id, { tags: newTags });
      setCalls((prev) => prev.map((c) => (c.id === call.id ? { ...c, tags: newTags } : c)));
    } catch {
      // ignore
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const speakTranscript = (item) => {
    if (!item.transcript && !item.query) return;
    if (playingId === item.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const text = item.transcript || item.query;
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = () => setPlayingId(null);
    setPlayingId(item.id);
    window.speechSynthesis.speak(utter);
  };

  const filtered = calls.filter((c) => {
    const matchesFilter = filter === "all" || c.direction === filter;
    if (dateFilter !== "all" && c.timestamp) {
      const callDate = new Date(c.timestamp);
      const now = new Date();
      const diff = now - callDate;
      if (dateFilter === "today" && diff > 86400000) return false;
      if (dateFilter === "week" && diff > 7 * 86400000) return false;
      if (dateFilter === "month" && diff > 30 * 86400000) return false;
    }
    const matchesQuery = !query ||
      c.caller.toLowerCase().includes(query.toLowerCase()) ||
      (c.phone || "").includes(query) ||
      (c.query || "").toLowerCase().includes(query.toLowerCase()) ||
      (c.transcript || "").toLowerCase().includes(query.toLowerCase());
    const matchesTags = selectedTags.length === 0 || (c.tags || []).some((t) => selectedTags.includes(t));
    return matchesFilter && matchesQuery && matchesTags;
  });

  const incomingCount = calls.filter((c) => c.direction === "incoming").length;
  const outgoingCount = calls.filter((c) => c.direction === "outgoing").length;
  const serviceCount = calls.filter((c) => c.direction === "service").length;
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((sum, c) => sum + (c.duration_sec || 0), 0);
  const answeredCount = calls.filter((c) => ["answered", "completed", "ringing"].includes(c.status_key)).length;
  const missedCount = calls.filter((c) => ["missed", "declined"].includes(c.status_key)).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-2 mb-4">
        <PhoneCall size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CALL HISTORY</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{calls.length} TOTAL</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>TOTAL</p>
          <p className="font-heading font-bold text-lg" style={{ color: "#D1FF26" }}>{totalCalls}</p>
        </div>
        <div className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>TALK TIME</p>
          <p className="font-heading font-bold text-lg" style={{ color: "#D1FF26" }}>{Math.floor(totalDuration / 60)}m</p>
        </div>
        <div className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>ANSWERED</p>
          <p className="font-heading font-bold text-lg" style={{ color: "#D1FF26" }}>{answeredCount}</p>
        </div>
        <div className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(239,68,68,0.15)" }}>
          <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>MISSED</p>
          <p className="font-heading font-bold text-lg" style={{ color: missedCount > 0 ? "#ef4444" : "#8A8F98" }}>{missedCount}</p>
        </div>
      </div>

      {/* Summary charts */}
      <CallHistoryChart calls={calls} />

      {/* Date filter */}
      <div className="flex gap-1.5 mb-3">
        {[
          { id: "all", label: "All Time" },
          { id: "today", label: "Today" },
          { id: "week", label: "This Week" },
          { id: "month", label: "This Month" },
        ].map((d) => (
          <button
            key={d.id}
            onClick={() => setDateFilter(d.id)}
            className="px-3 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all whitespace-nowrap"
            style={{
              background: dateFilter === d.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${dateFilter === d.id ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
              color: dateFilter === d.id ? "#D1FF26" : "#8A8F98",
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Auto-transcription indicator */}
      {autoTranscribing && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <Loader2 size={12} className="animate-spin" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>AUTO-TRANSCRIBING RECORDED CALLS…</p>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
          <Search size={14} style={{ color: "#8A8F98" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search calls, numbers, transcripts…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F5F5F7" }} />
        </div>
        <div className="flex gap-2">
          {[
            { id: "all", label: "All", count: calls.length },
            { id: "incoming", label: "Incoming", count: incomingCount },
            { id: "outgoing", label: "Outgoing", count: outgoingCount },
            { id: "service", label: "Service Reqs", count: serviceCount },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-3 py-2.5 text-sm transition-all whitespace-nowrap"
              style={{
                background: filter === f.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${filter === f.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                color: filter === f.id ? "#D1FF26" : "#F5F5F7",
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tag filter bar */}
      <TagBar items={calls} selectedTags={selectedTags} onTagToggle={toggleTag} onClearTags={() => setSelectedTags([])} />

      {/* Call list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <PhoneCall size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO CALLS FOUND</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Your incoming and outgoing calls will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((call, idx) => {
              const isIncoming = call.direction === "incoming";
              const isService = call.direction === "service";
              const statusInfo = STATUS_STYLES[call.status_key] || STATUS_STYLES.unknown;
              const typeInfo = CALL_TYPE_STYLES[call.call_type];

              return (
                <motion.div
                  key={call.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.015, 0.1) }}
                  className="p-4"
                  style={{ background: "#10141D", border: `0.5px solid ${isIncoming ? "rgba(209,255,38,0.15)" : "rgba(138,143,152,0.1)"}` }}
                >
                <div className="flex items-center gap-3">
                  {/* Direction icon */}
                  <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: isIncoming ? "rgba(209,255,38,0.08)" : isService ? "rgba(209,255,38,0.05)" : "rgba(138,143,152,0.08)" }}>
                    {isIncoming ? (
                      call.status_key === "missed" ? <PhoneMissed size={16} style={{ color: "#ef4444" }} /> : <PhoneIncoming size={16} style={{ color: "#D1FF26" }} />
                    ) : isService ? (
                      <FileText size={16} style={{ color: "#D1FF26" }} />
                    ) : (
                      <PhoneOutgoing size={16} style={{ color: "#8A8F98" }} />
                    )}
                  </div>

                  {/* Call info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{call.caller}</p>
                      {isIncoming && typeInfo && (
                        <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: typeInfo.bg || "rgba(138,143,152,0.08)", color: typeInfo.color }}>{typeInfo.label}</span>
                      )}
                      {(call.tags || []).length > 0 && <TagDisplay tags={call.tags} />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                        <Clock size={9} /> {formatTimestamp(call.timestamp)}
                      </span>
                      {call.phone && (
                        <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                          <Phone size={9} /> {call.phone}
                        </span>
                      )}
                      {call.query && (
                        <span className="font-mono text-[9px] truncate" style={{ color: "rgba(138,143,152,0.6)" }}>"{call.query.slice(0, 40)}{call.query.length > 40 ? "…" : ""}"</span>
                      )}
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
                    {call.duration_sec != null && call.duration_sec > 0 && (
                      <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{Math.floor(call.duration_sec / 60)}:{(call.duration_sec % 60).toString().padStart(2, "0")}</span>
                    )}
                    {call.transcript && (
                      <button
                        onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                        className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                        style={{ color: expandedId === call.id ? "#D1FF26" : "#8A8F98" }}
                        title="View transcript"
                      >
                        {expandedId === call.id ? <ChevronUp size={13} /> : <FileText size={13} />}
                      </button>
                    )}
                    {(call.transcript || call.query) && (
                      <button
                        onClick={() => speakTranscript(call)}
                        className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                        style={{ color: playingId === call.id ? "#D1FF26" : "#8A8F98" }}
                        title="Read aloud"
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                    {call.audio_url && (
                      <button
                        onClick={() => setPlayingAudioId(playingAudioId === call.id ? null : call.id)}
                        className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                        style={{ color: playingAudioId === call.id ? "#D1FF26" : "#8A8F98" }}
                        title="Play recording"
                      >
                        <Play size={13} />
                      </button>
                    )}
                    {!isIncoming && !isService && (
                      <TagEditor tags={call.tags || []} onSave={(tags) => updateCallTags(call, tags)} />
                    )}
                  </div>
                </div>

                {/* Expandable transcript */}
                <AnimatePresence>
                  {expandedId === call.id && call.transcript && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                        <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// TRANSCRIPT</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>{call.transcript}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {playingAudioId === call.id && call.audio_url && (
                  <div className="mt-3 pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                    <audio controls src={call.audio_url} className="w-full" style={{ height: 36 }} />
                  </div>
                )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}