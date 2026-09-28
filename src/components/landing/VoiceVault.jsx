import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, Pause, Trash2, Pin, Volume2, Search, Clock, Phone, BookmarkCheck, Bookmark, FileText, Loader2, Share2, Send, X, Check, Tag, Plus, Bell } from "lucide-react";
import ReminderScheduler from "@/components/landing/ReminderScheduler";

const PRESET_TAGS = ["Medical", "Travel", "Finance", "Legal", "Housing", "Jobs", "Education", "Family", "Emergency", "Shopping"];
import { base44 } from "@/api/base44Client";

export default function VoiceVault() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const [transcribingId, setTranscribingId] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [sharePhone, setSharePhone] = useState("");
  const [includeRecording, setIncludeRecording] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [tagItem, setTagItem] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [tagFilter, setTagFilter] = useState([]);
  const [remindItem, setRemindItem] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(true);

  const loadItems = async () => {
    try {
      const data = await base44.entities.VoiceInteraction.list("-created_date", 50);
      setItems(data || []);
    } catch (err) {
      setError("Could not load saved interactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    const observer = new IntersectionObserver(
      ([e]) => e.isIntersecting && setInView(true),
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        handleUpload();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const transcribeAudio = async (audioUrl) => {
    return (await base44.functions.invoke("transcribe-audio", { audio_url: audioUrl })).data;
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `voice-memo-${Date.now()}.webm`, { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      let transcript = "";
      try {
        const result = await transcribeAudio(file_url);
        transcript = (typeof result === "string" ? result : result?.transcript || result?.text || "").trim();
      } catch { /* transcription optional — save without transcript */ }
      await base44.entities.VoiceInteraction.create({
        title: `Voice Memo · ${new Date().toLocaleString()}`,
        source: "voice_memo",
        transcript,
        audio_url: file_url,
        duration_sec: recordSecs,
        pinned: false,
      });
      await loadItems();
    } catch (err) {
      setError("Could not save recording.");
    } finally {
      setUploading(false);
    }
  };

  const transcribeItem = async (item) => {
    if (!item.audio_url || transcribingId) return;
    setTranscribingId(item.id);
    try {
      const result = await transcribeAudio(item.audio_url);
      const transcript = (typeof result === "string" ? result : result?.transcript || result?.text || "").trim();
      if (transcript) {
        await base44.entities.VoiceInteraction.update(item.id, { transcript });
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, transcript } : i)));
      } else {
        setError("Transcription returned no text.");
      }
    } catch {
      setError("Could not transcribe audio.");
    } finally {
      setTranscribingId(null);
    }
  };

  const allTags = () => {
    const counts = {};
    items.forEach((i) => (i.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts)
      .sort((a, b) => {
        const pa = PRESET_TAGS.indexOf(a[0]);
        const pb = PRESET_TAGS.indexOf(b[0]);
        if (pa !== -1 && pb !== -1) return pa - pb;
        if (pa !== -1) return -1;
        if (pb !== -1) return 1;
        return b[1] - a[1];
      })
      .map(([t, count]) => ({ tag: t, count }));
  };

  const toggleTagFilter = (tag) => {
    setTagFilter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const saveTags = async (item, tags) => {
    try {
      await base44.entities.VoiceInteraction.update(item.id, { tags });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, tags } : i)));
      setTagItem({ ...item, tags });
    } catch {
      setError("Could not save tags.");
    }
  };

  const addTag = (tag) => {
    const clean = tag.trim();
    if (!clean || !tagItem) return;
    const current = tagItem.tags || [];
    if (current.includes(clean)) return;
    saveTags(tagItem, [...current, clean]);
    setTagInput("");
  };

  const removeTag = (tag) => {
    if (!tagItem) return;
    saveTags(tagItem, (tagItem.tags || []).filter((t) => t !== tag));
  };

  const openTagEditor = (item) => {
    setTagItem(item);
    setTagInput("");
  };

  const closeTagEditor = () => {
    setTagItem(null);
    setTagInput("");
  };

  const togglePin = async (item) => {
    try {
      await base44.entities.VoiceInteraction.update(item.id, { pinned: !item.pinned });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, pinned: !i.pinned } : i)));
    } catch (err) {
      setError("Could not update.");
    }
  };

  const deleteItem = async (item) => {
    try {
      await base44.entities.VoiceInteraction.delete(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (playingId === item.id) {
        if (audioRef.current) audioRef.current.pause();
        setPlayingId(null);
      }
    } catch (err) {
      setError("Could not delete.");
    }
  };

  const togglePlay = (item) => {
    if (!item.audio_url) return;
    if (playingId === item.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(item.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(item.id);
  };

  const playTranscript = (item) => {
    if (!item.transcript) return;
    if (!("speechSynthesis" in window)) return;
    if (playingId === `t-${item.id}`) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.transcript);
    utterance.rate = 0.98;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
    setPlayingId(`t-${item.id}`);
  };

  const buildShareMessage = (item, withRecording) => {
    const summary = (item.transcript || item.query || "").slice(0, 300);
    let msg = `📞 1 CALL AWAY — Voice Consultation\n\n"${item.title}"`;
    if (summary) msg += `\n\n${summary}${(item.transcript || "").length > 300 ? "…" : ""}`;
    if (withRecording && item.audio_url) msg += `\n\n🎧 Recording: ${item.audio_url}`;
    msg += `\n\n— Sent via Voice Vault™`;
    return msg;
  };

  const openShare = (item) => {
    setShareItem(item);
    setSharePhone("");
    setIncludeRecording(!!item.audio_url);
    setShareCopied(false);
  };

  const closeShare = () => {
    setShareItem(null);
    setSharePhone("");
    setShareCopied(false);
  };

  const sendShareSms = (e) => {
    e.preventDefault();
    if (!shareItem || !sharePhone.trim()) return;
    const body = encodeURIComponent(buildShareMessage(shareItem, includeRecording));
    const phone = sharePhone.trim().replace(/\s+/g, "");
    window.location.href = `sms:${phone}?body=${body}`;
  };

  const copySummary = async () => {
    if (!shareItem) return;
    try {
      await navigator.clipboard.writeText(buildShareMessage(shareItem, includeRecording));
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const filtered = items
    .filter((i) => filter === "all" || i.source === filter)
    .filter((i) => tagFilter.length === 0 || tagFilter.some((t) => (i.tags || []).includes(t)))
    .filter(
      (i) =>
        !query.trim() ||
        i.title?.toLowerCase().includes(query.toLowerCase()) ||
        i.transcript?.toLowerCase().includes(query.toLowerCase()) ||
        i.query?.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <section
      ref={sectionRef}
      id="voice-vault"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden min-h-[700px]"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 5s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-8 lg:mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookmarkCheck size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE VAULT™ — YOUR CALL ARCHIVE</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Revisit Every <span style={{ color: "#D1FF26" }}>Consultation.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Record voice memos and save Dial Browser answers. Replay important information from past calls anytime — no app, no notes, just your voice archive.
          </p>
        </motion.div>

        {/* Recorder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center gap-4 p-5 mb-6"
          style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}
        >
          <div className="flex items-center gap-3 flex-1 w-full">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading}
              className="flex items-center justify-center w-14 h-14 rounded-full transition-all flex-shrink-0 disabled:opacity-50"
              style={{
                background: recording ? "rgba(239,68,68,0.15)" : "#D1FF26",
                border: `1px solid ${recording ? "#ef4444" : "#D1FF26"}`,
                boxShadow: recording ? "0 0 20px rgba(239,68,68,0.4)" : "0 0 20px rgba(209,255,38,0.2)",
              }}
              title={recording ? "Stop recording" : "Record a voice memo"}
            >
              {recording ? <Square size={20} style={{ color: "#ef4444" }} /> : <Mic size={20} style={{ color: "#05070A" }} />}
            </button>
            <div className="flex-1">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
                {uploading ? "SAVING & TRANSCRIBING…" : recording ? "RECORDING…" : "READY TO RECORD"}
              </p>
              <p className="font-heading font-bold text-lg" style={{ color: recording ? "#ef4444" : "#F5F5F7" }}>
                {recording ? fmtTime(recordSecs) : uploading ? "Transcribing your memo…" : "Tap to record a voice memo"}
              </p>
            </div>
            {recording && (
              <div className="flex items-end gap-0.5 h-8">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-1" style={{ background: "#ef4444", animation: `eqBar ${0.5 + i * 0.1}s ease-in-out infinite`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Search + filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your saved interactions…"
              className="w-full pl-9 pr-3 py-2.5 text-[16px] sm:text-sm"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: "all", label: "All" },
              { id: "dial_browser", label: "Searches" },
              { id: "voice_memo", label: "Memos" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="px-3 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{
                  background: filter === f.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${filter === f.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                  color: filter === f.id ? "#D1FF26" : "#8A8F98",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {allTags().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-2 flex-wrap mb-6"
          >
            <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
              <Tag size={10} /> Categories:
            </span>
            <button
              onClick={() => setTagFilter([])}
              className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: tagFilter.length === 0 ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${tagFilter.length === 0 ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                color: tagFilter.length === 0 ? "#D1FF26" : "#8A8F98",
              }}
            >
              All
              {tagFilter.length === 0 && (
                <span className="font-mono text-[8px]" style={{ color: "rgba(209,255,38,0.6)" }}>{items.length}</span>
              )}
            </button>
            {allTags().map(({ tag, count }) => {
              const active = tagFilter.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTagFilter(tag)}
                  className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                  style={{
                    background: active ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)",
                    border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                    color: active ? "#D1FF26" : "#8A8F98",
                  }}
                >
                  {active && <Check size={9} />}
                  {tag}
                  <span className="font-mono text-[8px]" style={{ color: active ? "rgba(209,255,38,0.6)" : "rgba(138,143,152,0.5)" }}>{count}</span>
                </button>
              );
            })}
            {tagFilter.length > 1 && (
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>
                {filtered.length} MATCHING
              </span>
            )}
          </motion.div>
        )}

        {error && (
          <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#ef4444" }}>⚠ {error}</p>
        )}

        {/* List */}
        <div className="grid sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.15) }}
                className="p-4"
                style={{
                  background: item.pinned ? "rgba(209,255,38,0.04)" : "#10141D",
                  border: `0.5px solid ${item.pinned ? "rgba(209,255,38,0.35)" : "rgba(209,255,38,0.1)"}`,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                      {item.source === "dial_browser" ? "DIAL SEARCH" : item.source === "service_call" ? "SERVICE CALL" : "VOICE MEMO"}
                    </span>
                    {item.pinned && <Pin size={11} style={{ color: "#D1FF26" }} />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => togglePin(item)} className="p-1 transition-colors hover:bg-[rgba(209,255,38,0.08)]" title={item.pinned ? "Unpin" : "Pin as important"}>
                      <Pin size={13} style={{ color: item.pinned ? "#D1FF26" : "#8A8F98" }} />
                    </button>
                    <button onClick={() => deleteItem(item)} className="p-1 transition-colors hover:bg-[rgba(239,68,68,0.1)]" title="Delete">
                      <Trash2 size={13} style={{ color: "#8A8F98" }} />
                    </button>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-sm mb-1 line-clamp-1" style={{ color: "#F5F5F7" }}>{item.title}</h3>

                {item.query && (
                  <p className="font-mono text-[9px] mb-1" style={{ color: "#8A8F98" }}>Q: {item.query}</p>
                )}

                {item.transcript && (
                  <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: "#8A8F98" }}>{item.transcript}</p>
                )}
                {transcribingId === item.id && (
                  <p className="flex items-center gap-1.5 text-xs leading-relaxed mb-3 font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                    <Loader2 size={11} className="animate-spin" /> TRANSCRIBING AUDIO…
                  </p>
                )}

                {(item.tags || []).length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {(item.tags || []).map((t) => (
                      <span key={t} className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta + actions */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <div className="flex items-center gap-2">
                    {item.audio_url && (
                      <button
                        onClick={() => togglePlay(item)}
                        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{ background: playingId === item.id ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                      >
                        {playingId === item.id ? <Pause size={10} /> : <Play size={10} />} Play
                      </button>
                    )}
                    {item.transcript && (
                      <button
                        onClick={() => playTranscript(item)}
                        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{ background: playingId === `t-${item.id}` ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                      >
                        <Volume2 size={10} /> {playingId === `t-${item.id}` ? "Stop" : "Read"}
                      </button>
                    )}
                    {item.audio_url && !item.transcript && transcribingId !== item.id && (
                      <button
                        onClick={() => transcribeItem(item)}
                        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                      >
                        <FileText size={10} /> Transcribe
                      </button>
                    )}
                    <button
                      onClick={() => openTagEditor(item)}
                      className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                      style={{
                        background: (item.tags || []).length ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)",
                        border: "0.5px solid rgba(209,255,38,0.2)",
                        color: "#D1FF26",
                      }}
                    >
                      <Tag size={10} /> {item.tags?.length ? item.tags.length : "Tag"}
                    </button>
                    <button
                      onClick={() => openShare(item)}
                      className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                      style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                    >
                      <Share2 size={10} /> Share
                    </button>
                    <button
                      onClick={() => setRemindItem(item)}
                      className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                      style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                    >
                      <Bell size={10} /> Remind
                    </button>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                    {item.duration_sec > 0 && (
                      <span className="flex items-center gap-1"><Clock size={9} /> {fmtTime(item.duration_sec)}</span>
                    )}
                    <span>{new Date(item.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <Phone size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
            <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO SAVED INTERACTIONS YET</p>
            <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Record a memo or save a Dial Browser answer to get started</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-[rgba(209,255,38,0.2)] border-t-[#D1FF26] rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>

      {/* Share via SMS dialog */}
      <AnimatePresence>
        {shareItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80]"
              style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
              onClick={closeShare}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-md p-6"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Share2 size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SHARE VIA SMS</p>
                </div>
                <button onClick={closeShare} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              <p className="font-heading font-bold text-sm mb-1 line-clamp-1" style={{ color: "#F5F5F7" }}>{shareItem.title}</p>
              {shareItem.transcript && (
                <p className="text-xs leading-relaxed mb-4 line-clamp-3 p-3" style={{ color: "#8A8F98", background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                  {shareItem.transcript.slice(0, 200)}{shareItem.transcript.length > 200 ? "…" : ""}
                </p>
              )}

              <form onSubmit={sendShareSms}>
                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>RECIPIENT PHONE NUMBER</label>
                <div className="relative mb-3">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
                  <input
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    type="tel"
                    autoFocus
                    className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />
                </div>

                {shareItem.audio_url && (
                  <button
                    type="button"
                    onClick={() => setIncludeRecording(!includeRecording)}
                    className="w-full flex items-center justify-between px-3 py-2.5 mb-3 transition-all"
                    style={{
                      background: includeRecording ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.6)",
                      border: `0.5px solid ${includeRecording ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.1)"}`,
                    }}
                  >
                    <span className="flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase" style={{ color: includeRecording ? "#D1FF26" : "#8A8F98" }}>
                      🎧 Include recording link
                    </span>
                    <span className="w-8 h-4 rounded-full relative transition-all" style={{ background: includeRecording ? "#D1FF26" : "rgba(138,143,152,0.2)" }}>
                      <span className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: includeRecording ? "18px" : "2px", background: includeRecording ? "#05070A" : "#8A8F98" }} />
                    </span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!sharePhone.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  <Send size={13} /> Send via SMS
                </button>
              </form>

              <button
                onClick={copySummary}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: shareCopied ? "#D1FF26" : "#8A8F98" }}
              >
                {shareCopied ? <><Check size={12} /> Copied!</> : "Copy Summary Instead"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tag editor dialog */}
      <AnimatePresence>
        {tagItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80]"
              style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
              onClick={closeTagEditor}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-md p-6"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// TAG CONSULTATION</p>
                </div>
                <button onClick={closeTagEditor} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              <p className="font-heading font-bold text-sm mb-4 line-clamp-1" style={{ color: "#F5F5F7" }}>{tagItem.title}</p>

              {/* Active tags */}
              {(tagItem.tags || []).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {(tagItem.tags || []).map((t) => (
                    <button
                      key={t}
                      onClick={() => removeTag(t)}
                      className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase px-2.5 py-1 transition-all hover:bg-[rgba(239,68,68,0.1)]"
                      style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}
                    >
                      {t} <X size={9} style={{ color: "rgba(209,255,38,0.6)" }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Preset tags */}
              <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>SUGGESTED TOPICS</p>
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                {PRESET_TAGS.filter((t) => !(tagItem.tags || []).includes(t)).map((t) => (
                  <button
                    key={t}
                    onClick={() => addTag(t)}
                    className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase px-2.5 py-1 transition-all hover:bg-[rgba(209,255,38,0.12)]"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#8A8F98" }}
                  >
                    <Plus size={9} /> {t}
                  </button>
                ))}
              </div>

              {/* Custom tag input */}
              <form onSubmit={(e) => { e.preventDefault(); addTag(tagInput); }}>
                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>CUSTOM TAG</label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Type a custom topic…"
                    autoFocus
                    className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!tagInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  <Plus size={13} /> Add Tag
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ReminderScheduler item={remindItem} onClose={() => setRemindItem(null)} />
    </section>
  );
}