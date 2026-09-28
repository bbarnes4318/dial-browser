import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Square, Loader2, CheckCircle2, AlertCircle, Trash2, Volume2,
  Play, Radio, Clock, Wand2, Music, Upload, SlidersHorizontal, Sparkles,
} from "lucide-react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { base44 } from "@/api/base44Client";
import { WavRecorder } from "@/lib/wavRecorder";
import { mixVoiceAndMusic } from "@/lib/audioMixer";

const DIAL_PHONE_IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/6bc0915ef_Gemini_Generated_Image_v5z7yiv5z7yiv5z7.jpg";

const LIME = "#A4FF00";
const PURPLE = "#BC00FF";
const RECENT_KEY = "advertise_recently_played";
const MAX_RECENT = 5;
const MAX_RECORD_SECONDS = 120;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function loadRecent() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(raw) ? raw.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export default function AdvertiseVoiceStudio() {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [recent, setRecent] = useState(loadRecent);

  // AI ad generator + music mixer
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [generatedScript, setGeneratedScript] = useState("");
  const [adAudioUrl, setAdAudioUrl] = useState(null);
  const [musicUrl, setMusicUrl] = useState(null);
  const [musicName, setMusicName] = useState("");
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [voiceVol, setVoiceVol] = useState(1);
  const [musicVol, setMusicVol] = useState(0.15);
  const [mixing, setMixing] = useState(false);
  const [mixUrl, setMixUrl] = useState(null);
  const [mixError, setMixError] = useState(null);
  const mixVoiceRef = useRef(null);
  const mixMusicRef = useRef(null);

  const recorderRef = useRef(null);
  const autoStopRef = useRef(null);
  const durationRef = useRef(null);
  const mainAudioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (durationRef.current) clearInterval(durationRef.current);
      if (recorderRef.current) { try { recorderRef.current.cancel(); } catch {} }
    };
  }, []);

  const persistRecent = useCallback((list) => {
    setRecent(list);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); } catch {}
  }, []);

  const bumpRecent = useCallback((url, label) => {
    setRecent((prev) => {
      const filtered = prev.filter((r) => r.url !== url);
      const next = [{ url, label, ts: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setCurrentUrl(null);
    setDuration(0);
    try {
      const recorder = new WavRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);
      setDuration(0);
      durationRef.current = setInterval(() => {
        setDuration((d) => {
          const next = d + 1;
          if (next >= MAX_RECORD_SECONDS && recorderRef.current === recorder) stopRecording();
          return next;
        });
      }, 1000);
      autoStopRef.current = setTimeout(() => {
        if (recorderRef.current === recorder) stopRecording();
      }, MAX_RECORD_SECONDS * 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions and try again.");
      setRecording(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    if (durationRef.current) clearInterval(durationRef.current);
    autoStopRef.current = null;
    durationRef.current = null;
    setRecording(false);
    setProcessing(true);
    setError(null);
    const finalDur = duration;
    try {
      const wavBlob = await recorderRef.current.stop();
      recorderRef.current = null;
      const file = new File([wavBlob], `advertise-script-${Date.now()}.wav`, { type: "audio/wav" });
      const result = await base44.integrations.Core.UploadFile({ file });
      const url = result.file_url;
      setCurrentUrl(url);
      // Add to Recently Played immediately
      bumpRecent(url, `Custom Script · ${formatTime(finalDur)}`);
    } catch {
      setError("Failed to upload recording. Please try again.");
    } finally {
      setProcessing(false);
    }
  }, [duration, bumpRecent]);

  const handleDiscard = () => {
    if (recorderRef.current) { try { recorderRef.current.cancel(); } catch {} recorderRef.current = null; }
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    if (durationRef.current) clearInterval(durationRef.current);
    autoStopRef.current = null;
    durationRef.current = null;
    setCurrentUrl(null);
    setDuration(0);
    setError(null);
    setRecording(false);
    setProcessing(false);
  };

  const removeRecent = (url, e) => {
    if (e) e.stopPropagation();
    setRecent((prev) => {
      const next = prev.filter((r) => r.url !== url);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleMainPlay = () => {
    if (currentUrl) bumpRecent(currentUrl, `Custom Script · ${formatTime(duration)}`);
  };

  const voiceTrack = adAudioUrl || currentUrl;

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    setGeneratedScript("");
    setAdAudioUrl(null);
    setMixUrl(null);
    try {
      const res = await base44.functions.invoke("generate-dial-ad", {});
      const d = res?.data || res;
      if (d?.error) { setGenError(d.error); return; }
      setGeneratedScript(d.script || "");
      if (d.audio_url) {
        setAdAudioUrl(d.audio_url);
        bumpRecent(d.audio_url, "AI-Generated Dial Browser Ad");
      }
    } catch (e) {
      setGenError(e?.response?.data?.error || e?.message || "Could not generate your ad.");
    } finally {
      setGenerating(false);
    }
  };

  const handleMusicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMusic(true);
    try {
      const result = await base44.integrations.Core.UploadPublicFile({ file });
      setMusicUrl(result.file_url);
      setMusicName(file.name);
    } catch {
      setMixError("Could not upload your music track.");
    } finally {
      setUploadingMusic(false);
    }
  };

  const stopMix = () => {
    try { mixVoiceRef.current?.pause(); } catch { /* ignore */ }
    try { mixMusicRef.current?.pause(); } catch { /* ignore */ }
  };

  const playMix = () => {
    if (!voiceTrack) return;
    stopMix();
    try {
      if (mixVoiceRef.current) { mixVoiceRef.current.volume = Math.max(0, Math.min(1, voiceVol)); mixVoiceRef.current.currentTime = 0; mixVoiceRef.current.play().catch(() => {}); }
      if (mixMusicRef.current && musicUrl) { mixMusicRef.current.volume = Math.max(0, Math.min(1, musicVol)); mixMusicRef.current.currentTime = 0; mixMusicRef.current.play().catch(() => {}); }
    } catch { /* ignore */ }
  };

  const handleSaveMix = async () => {
    if (!voiceTrack) return;
    setMixing(true);
    setMixError(null);
    try {
      const blob = await mixVoiceAndMusic(proxyMediaUrl(voiceTrack), musicUrl ? proxyMediaUrl(musicUrl) : null, voiceVol, musicVol);
      const file = new File([blob], `dial-ad-mix-${Date.now()}.wav`, { type: "audio/wav" });
      const result = await base44.integrations.Core.UploadPublicFile({ file });
      setMixUrl(result.file_url);
      bumpRecent(result.file_url, "Mixed Ad · Voice + Music");
    } catch (e) {
      setMixError("Could not mix your ad. Try a different music file or use voice only.");
    } finally {
      setMixing(false);
    }
  };

  return (
    <section id="voice-studio" className="relative py-14 lg:py-20" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${LIME}10 0%, transparent 55%)` }} />
      <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-mono text-[10px] tracking-[0.4em] mb-3" style={{ color: LIME }}>// VOICE BROADCAST STUDIO</p>
          <h2 className="font-heading font-black text-2xl sm:text-4xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
            Record your <span style={{ color: PURPLE }}>custom script.</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Skip the upload. Record your voice broadcast script right here in the browser, play it back instantly, and keep your last 5 takes one tap away.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* ── Recorder + Playback ── */}
          <div className="p-5 lg:p-6 space-y-4" style={{ background: "rgba(10,13,20,0.7)", border: `0.5px solid ${LIME}25`, boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: LIME }}>// RECORD & PLAYBACK</p>

            {error && (
              <div className="flex items-start gap-2 p-3" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {processing ? (
                <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 size={28} className="animate-spin" style={{ color: PURPLE }} />
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>UPLOADING YOUR TAKE…</span>
                </motion.div>
              ) : currentUrl ? (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="flex items-center gap-2 p-3" style={{ background: `${LIME}1a`, border: `0.5px solid ${LIME}66` }}>
                    <CheckCircle2 size={16} style={{ color: LIME }} />
                    <span className="font-mono text-[10px] tracking-widest" style={{ color: LIME }}>RECORDED · {formatTime(duration)}</span>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>PLAYBACK</p>
                    <audio
                      ref={mainAudioRef}
                      controls
                      src={proxyMediaUrl(currentUrl)}
                      onPlay={handleMainPlay}
                      className="w-full h-10"
                      style={{ filter: "invert(0.85) hue-rotate(70deg)" }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleDiscard} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                      <Trash2 size={12} /> Discard
                    </button>
                    <button onClick={() => { setCurrentUrl(null); setDuration(0); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_18px_rgba(164,255,0,0.3)]" style={{ background: LIME, color: "#05070A" }}>
                      <Mic size={12} /> New Take
                    </button>
                  </div>
                </motion.div>
              ) : recording ? (
                <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                    style={{ background: "rgba(239,68,68,0.15)", border: `2px solid ${PURPLE}` }}
                  >
                    <Mic size={28} style={{ color: PURPLE }} />
                  </motion.div>
                  <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: PURPLE }}>● RECORDING — {formatTime(duration)}</p>
                  <button onClick={stopRecording} className="inline-flex items-center gap-2 px-6 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                    <Square size={12} /> Stop & Upload
                  </button>
                  <p className="font-mono text-[9px] mt-3" style={{ color: "#8A8F98" }}>Auto-stops at {formatTime(MAX_RECORD_SECONDS)}</p>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
                  <button onClick={startRecording} className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-all hover:shadow-[0_0_30px_rgba(164,255,0,0.4)]" style={{ background: LIME }}>
                    <Mic size={28} style={{ color: "#05070A" }} />
                  </button>
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>TAP TO RECORD</p>
                  <p className="flex items-center justify-center gap-1 text-[10px] mt-2" style={{ color: "rgba(138,143,152,0.5)" }}>
                    <Volume2 size={10} /> Speak clearly — up to {formatTime(MAX_RECORD_SECONDS)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Recently Played ── */}
          <div className="p-5 lg:p-6" style={{ background: "rgba(10,13,20,0.7)", border: `0.5px solid ${PURPLE}25`, boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio size={14} style={{ color: PURPLE }} />
                <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: PURPLE }}>// RECENTLY PLAYED</p>
              </div>
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{recent.length}/{MAX_RECENT}</span>
            </div>

            {recent.length === 0 ? (
              <div className="text-center py-10">
                <Clock size={26} className="mx-auto mb-3" style={{ color: "rgba(138,143,152,0.3)" }} />
                <p className="text-sm" style={{ color: "rgba(138,143,152,0.5)" }}>No recordings yet</p>
                <p className="font-mono text-[10px] mt-1" style={{ color: "rgba(138,143,152,0.3)" }}>Record a script to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {recent.map((r) => (
                  <div key={r.url} className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "#F5F5F7" }}>{r.label}</p>
                        <p className="font-mono text-[9px] mt-0.5" style={{ color: "#8A8F98" }}>
                          {new Date(r.ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                        </p>
                      </div>
                      <button onClick={(e) => removeRecent(r.url, e)} className="flex-shrink-0 transition-opacity hover:opacity-70" aria-label="Remove from recent">
                        <Trash2 size={12} style={{ color: "#8A8F98" }} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <audio controls src={proxyMediaUrl(r.url)} onPlay={() => bumpRecent(r.url, r.label)} className="h-7 flex-1" style={{ filter: "invert(0.85) hue-rotate(70deg)", maxWidth: "220px" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="flex items-center gap-1.5 font-mono text-[9px] mt-4" style={{ color: "#8A8F98" }}>
              <Play size={10} style={{ color: PURPLE }} /> Your last {MAX_RECENT} takes stay here for quick replay — saved on this device.
            </p>
          </div>
        </div>

        {/* ── AI Ad Generator + Music Mixer ── */}
        <div className="mt-6 grid lg:grid-cols-2 gap-5">
          {/* AI generator */}
          <div className="p-5 lg:p-6 space-y-4" style={{ background: "rgba(10,13,20,0.7)", border: `0.5px solid ${LIME}25`, boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-2">
              <Wand2 size={14} style={{ color: LIME }} />
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: LIME }}>// AUTO-GENERATE AD</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={DIAL_PHONE_IMG}
                alt="Dial Browser Audio Phone"
                className="w-full sm:w-44 rounded-sm object-cover"
                style={{ border: `0.5px solid ${LIME}33`, filter: "brightness(0.95)" }}
              />
              <div className="flex-1">
                <p className="font-heading font-bold text-sm mb-1.5" style={{ color: "#F5F5F7" }}>Dial Browser Audio Phone Ad</p>
                <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>
                  One tap generates a ready-to-broadcast voice ad for the Dial Browser Audio Phone — a pro script, voiced by AI, ready to mix with music.
                </p>
              </div>
            </div>

            {genError && (
              <div className="flex items-start gap-2 p-3" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                <p className="text-xs" style={{ color: "#ef4444" }}>{genError}</p>
              </div>
            )}

            {generatedScript && (
              <div className="p-3" style={{ background: "rgba(5,7,10,0.5)", border: `0.5px solid ${LIME}33` }}>
                <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: LIME }}>GENERATED SCRIPT</p>
                <p className="text-xs leading-relaxed" style={{ color: "#F5F5F7" }}>{generatedScript}</p>
              </div>
            )}

            {adAudioUrl && (
              <div>
                <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>GENERATED AD</p>
                <audio controls src={proxyMediaUrl(adAudioUrl)} onPlay={() => bumpRecent(adAudioUrl, "AI-Generated Dial Browser Ad")} className="w-full h-10" style={{ filter: "invert(0.85) hue-rotate(70deg)" }} />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(164,255,0,0.35)] disabled:opacity-50"
              style={{ background: LIME, color: "#05070A" }}
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? "Generating…" : "Generate my Ad"}
            </button>
          </div>

          {/* Music mixer */}
          <div className="p-5 lg:p-6 space-y-4" style={{ background: "rgba(10,13,20,0.7)", border: `0.5px solid ${PURPLE}25`, boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-2">
              <Music size={14} style={{ color: PURPLE }} />
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: PURPLE }}>// ADD BACKGROUND MUSIC</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>
              Upload a royalty-free music bed, balance it under your ad, preview the mix, then save a single mixed track for broadcast.
            </p>

            <div className="space-y-2">
              <label className="flex items-center justify-center gap-2 py-3 cursor-pointer transition-all" style={{ background: "rgba(188,0,255,0.08)", border: "0.5px dashed rgba(188,0,255,0.4)" }}>
                {uploadingMusic ? <Loader2 size={14} className="animate-spin" style={{ color: PURPLE }} /> : <Upload size={14} style={{ color: PURPLE }} />}
                <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: PURPLE }}>
                  {uploadingMusic ? "Uploading…" : musicUrl ? `Replace Music · ${musicName}` : "Upload Music Bed"}
                </span>
                <input type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
              </label>
              {musicUrl && (
                <audio controls src={proxyMediaUrl(musicUrl)} loop className="w-full h-9" style={{ filter: "invert(0.85) hue-rotate(70deg)" }} />
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: LIME }}>VOICE</span>
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{Math.round(voiceVol * 100)}%</span>
                </div>
                <input type="range" min={0} max={1} step={0.05} value={voiceVol} onChange={(e) => setVoiceVol(Number(e.target.value))} className="w-full" style={{ accentColor: LIME }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: PURPLE }}>MUSIC</span>
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{Math.round(musicVol * 100)}%</span>
                </div>
                <input type="range" min={0} max={1} step={0.05} value={musicVol} onChange={(e) => setMusicVol(Number(e.target.value))} className="w-full" style={{ accentColor: PURPLE }} />
              </div>
            </div>

            {mixError && (
              <div className="flex items-start gap-2 p-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                <p className="text-[11px]" style={{ color: "#ef4444" }}>{mixError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={playMix}
                disabled={!voiceTrack}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
                style={{ background: "rgba(188,0,255,0.1)", border: "0.5px solid rgba(188,0,255,0.4)", color: PURPLE }}
              >
                <Play size={12} /> Preview Mix
              </button>
              <button
                onClick={handleSaveMix}
                disabled={mixing || !voiceTrack}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(164,255,0,0.3)] disabled:opacity-30"
                style={{ background: LIME, color: "#05070A" }}
              >
                {mixing ? <Loader2 size={12} className="animate-spin" /> : <SlidersHorizontal size={12} />} {mixing ? "Mixing…" : "Save Mixed Ad"}
              </button>
            </div>

            {mixUrl && (
              <div>
                <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: LIME }}>FINAL MIXED AD</p>
                <audio controls src={proxyMediaUrl(mixUrl)} className="w-full h-10" style={{ filter: "invert(0.85) hue-rotate(70deg)" }} />
              </div>
            )}

            {/* hidden synced sources for the preview-mix button */}
            <audio ref={mixVoiceRef} src={voiceTrack ? proxyMediaUrl(voiceTrack) : undefined} onEnded={stopMix} className="hidden" />
            <audio ref={mixMusicRef} src={musicUrl ? proxyMediaUrl(musicUrl) : undefined} loop className="hidden" />
          </div>
        </div>
      </div>
    </section>
  );
}