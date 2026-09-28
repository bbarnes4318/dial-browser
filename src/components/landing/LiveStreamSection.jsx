import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Video, Mic, MicOff, Send, Headphones, Users, Lock,
  DollarSign, Play, Pause, Volume2, Star, MessageSquare, Phone, Loader2, Bell, Check, Heart,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import TipPanel from "@/components/landing/TipPanel";

const INITIAL_CHAT = [
  { id: 1, name: "Maya R.", type: "text", text: "This stream is fire! 🔥", time: "00:42" },
  { id: 2, name: "Voice Memo", type: "voice", text: "Hey love the show, can you play something upbeat?", duration: "0:08", time: "01:15" },
  { id: 3, name: "Devon K.", type: "text", text: "Tuning in from Brooklyn 📡", time: "01:31" },
  { id: 4, name: "Aisha T.", type: "text", text: "The audio quality is incredible", time: "02:03" },
  { id: 5, name: "Voice Memo", type: "voice", text: "Shoutout to everyone listening in!", duration: "0:05", time: "02:28" },
];

const SIMULATED_INCOMING = [
  { name: "Marcus L.", type: "text", text: "First time tuning in, this is amazing" },
  { name: "Priya S.", type: "text", text: "Can you take a voice question next?" },
  { name: "Voice Memo", type: "voice", text: "Much love from Atlanta!", duration: "0:04" },
  { name: "Jordan B.", type: "text", text: "The SMS stream quality is unreal" },
  { name: "Voice Memo", type: "voice", text: "Your last track blew my mind", duration: "0:06" },
  { name: "Sofia M.", type: "text", text: "Listening from the train 🎧" },
  { name: "Voice Memo", type: "voice", text: "Can you play that last track again?", duration: "0:03" },
  { name: "Tyler R.", type: "text", text: "This is better than any app 💯" },
  { name: "Nadia K.", type: "text", text: "Sharing this with everyone I know" },
];

export default function LiveStreamSection() {
  const [streamMode, setStreamMode] = useState("video"); // video | audio
  const [isLive, setIsLive] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [chat, setChat] = useState(INITIAL_CHAT);
  const [textInput, setTextInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [alerting, setAlerting] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [subForm, setSubForm] = useState({ name: "", phone: "" });
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const simRef = useRef(null);
  const sessionIdRef = useRef(null);
  const peakRef = useRef(0);
  const peakTimeRef = useRef(0);
  const snapshotsRef = useRef([]);
  const streamStartRef = useRef(null);

  // Handle mobile virtual keyboard — keep input visible above keyboard
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(offset > 0 ? offset : 0);
    };
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  // Timer when live
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isLive]);

  // Simulated listener count fluctuation
  useEffect(() => {
    if (!isLive) return;
    setListeners(847);
    const listenerInterval = setInterval(() => {
      setListeners((prev) => {
        const next = Math.max(100, prev + Math.floor(Math.random() * 40 - 18));
        if (streamStartRef.current) {
          const offset = Math.floor((Date.now() - streamStartRef.current) / 1000);
          if (next > peakRef.current) {
            peakRef.current = next;
            peakTimeRef.current = offset;
          }
          snapshotsRef.current.push({ offset, count: next });
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(listenerInterval);
  }, [isLive]);

  // Simulated incoming chat messages with typing indicator — feels instant while live
  useEffect(() => {
    if (!isLive) return;
    let msgIdx = 0;
    let cycleActive = true;

    const cycle = () => {
      if (!cycleActive) return;
      // Show typing indicator briefly, then deliver the message
      setTyping(true);
      const deliverTimer = setTimeout(() => {
        setTyping(false);
        if (msgIdx >= SIMULATED_INCOMING.length) msgIdx = 0;
        const msg = SIMULATED_INCOMING[msgIdx];
        setChat((prev) => [...prev.slice(-30), { ...msg, id: Date.now(), time: formatTime(elapsed) }]);
        msgIdx++;
      }, 1400);
      // Schedule next cycle — faster cadence for live feel
      simRef.current = setTimeout(cycle, 3500);
      // Clear delivery timer on cleanup
      simRef.current._deliverTimer = deliverTimer;
    };

    cycle();

    return () => {
      cycleActive = false;
      clearTimeout(simRef.current);
      clearTimeout(simRef.current?._deliverTimer);
    };
  }, [isLive]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const goLive = async () => {
    setIsLive(true);
    setChat(INITIAL_CHAT);
    // Reset session tracking
    peakRef.current = 0;
    peakTimeRef.current = 0;
    snapshotsRef.current = [];
    streamStartRef.current = Date.now();
    // Create a StreamSession record for the creator dashboard
    try {
      const session = await base44.entities.StreamSession.create({
        artist_name: "DJ Signal",
        stream_title: streamMode === "video" ? "Live Video Broadcast" : "Live Audio Session",
        stream_mode: streamMode,
        status: "active",
        started_at: new Date().toISOString(),
        peak_listeners: 0,
        final_listeners: 0,
        duration_seconds: 0,
        total_messages: 0,
        total_tips: 0,
        listener_snapshots: "[]",
      });
      sessionIdRef.current = session.id;
    } catch { /* don't block the stream */ }
    // Send SMS alert to all subscribers the moment the broadcast starts
    setAlerting(true);
    try {
      await base44.functions.invoke("sendLiveStreamAlert", {
        creator_name: "DJ Signal",
        stream_title: streamMode === "video" ? "Live Video Broadcast" : "Live Audio Session",
        stream_mode: streamMode,
        session_id: sessionIdRef.current,
      });
      setAlertSent(true);
    } catch {
      /* alert failure shouldn't block the stream */
    } finally {
      setAlerting(false);
    }
  };

  const endStream = async () => {
    // Finalize the StreamSession with peak data and listener snapshots
    if (sessionIdRef.current) {
      try {
        await base44.entities.StreamSession.update(sessionIdRef.current, {
          status: "ended",
          ended_at: new Date().toISOString(),
          duration_seconds: elapsed,
          peak_listeners: peakRef.current,
          peak_time_offset: peakTimeRef.current,
          final_listeners: listeners,
          listener_snapshots: JSON.stringify(snapshotsRef.current.slice(-100)),
        });
      } catch { /* ignore */ }
      sessionIdRef.current = null;
    }
    setIsLive(false);
    setListeners(0);
  };

  const sendText = () => {
    if (!textInput.trim()) return;
    setChat((prev) => [...prev, { id: Date.now(), name: "You", type: "text", text: textInput.trim(), time: formatTime(elapsed), isSelf: true }]);
    setTextInput("");
  };

  const sendVoiceMemo = () => {
    if (recording) {
      // Stop recording → add transcribed message
      setRecording(false);
      setChat((prev) => [...prev, { id: Date.now(), name: "You (Voice)", type: "voice", text: "Loving the stream, keep it going!", duration: "0:04", time: formatTime(elapsed), isSelf: true }]);
    } else {
      setRecording(true);
      setTimeout(() => {
        if (recording) {
          setRecording(false);
          setChat((prev) => [...prev, { id: Date.now(), name: "You (Voice)", type: "voice", text: "Loving the stream, keep it going!", duration: "0:04", time: formatTime(elapsed), isSelf: true }]);
        }
      }, 3000);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subForm.name.trim() || !subForm.phone.trim()) return;
    setSubscribing(true);
    try {
      await base44.entities.LiveStreamSubscriber.create({
        full_name: subForm.name.trim(),
        phone: subForm.phone.trim(),
        active: true,
      });
      setSubscribed(true);
    } catch {
      /* ignore */
    } finally {
      setSubscribing(false);
    }
  };

  const handleTipSent = (amount) => {
    setChat((prev) => [...prev, { id: Date.now(), name: "You", type: "tip", text: `Tipped $${amount.toFixed(2)} 💚`, time: formatTime(elapsed), isSelf: true }]);
    setMobileChatOpen(false);
  };

  return (
    <div className="p-6 lg:p-8" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// 1 CALL LIVE STREAM™</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>INTERACTIVE DEMO PREVIEW</span>
        </div>
      </div>

      <h3 className="font-heading font-black text-2xl lg:text-3xl mb-2" style={{ color: "#F5F5F7" }}>
        Preview the <span style={{ color: "#D1FF26" }}>1 Call Live Stream Studio</span>
      </h3>
      <p className="text-sm mb-6 max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        An interactive preview of the 1 Call Live Stream experience. Start the demo to fire a real SMS alert to your subscribers — the live viewer count and chat shown here are a simulated preview of the planned broadcast feed.
      </p>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Stream player / host view */}
        <div className="lg:col-span-2">
          {/* Stream mode toggle */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => setStreamMode("video")} className="flex items-center gap-2 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: streamMode === "video" ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.5)", border: `0.5px solid ${streamMode === "video" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`, color: streamMode === "video" ? "#D1FF26" : "#8A8F98" }}>
              <Video size={11} /> Video
            </button>
            <button onClick={() => setStreamMode("audio")} className="flex items-center gap-2 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: streamMode === "audio" ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.5)", border: `0.5px solid ${streamMode === "audio" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`, color: streamMode === "audio" ? "#D1FF26" : "#8A8F98" }}>
              <Headphones size={11} /> Audio Only
            </button>
          </div>

          {/* Stream viewport */}
          <div className="relative overflow-hidden" style={{ aspectRatio: streamMode === "video" ? "16/9" : "1/1", background: "#05070A", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            {/* Video mode — simulated video feed */}
            {streamMode === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                {isLive ? (
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(209,255,38,0.12) 0%, transparent 70%)" }}>
                    {/* Animated signal bars — simulating video */}
                    <div className="absolute inset-0 flex items-end justify-center gap-1 p-8">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${30 + Math.sin(i * 0.5 + elapsed * 0.3) * 40 + 30}%`, background: `linear-gradient(180deg, rgba(209,255,38,0.4), rgba(209,255,38,0.05))`, transition: "height 0.3s" }} />
                      ))}
                    </div>
                    {/* Host avatar */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                      <div className="flex items-center justify-center w-7 h-7 font-heading font-bold text-xs" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26", borderRadius: "50%" }}>DJ</div>
                      <div>
                        <p className="text-[10px] font-semibold" style={{ color: "#F5F5F7" }}>DJ Signal</p>
                        <p className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>HOST</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Video size={40} style={{ color: "rgba(209,255,38,0.15)", margin: "0 auto 12px" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>STREAM OFFLINE</p>
                  </div>
                )}
              </div>
            )}

            {/* Audio mode — visualizer */}
            {streamMode === "audio" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                {isLive ? (
                  <>
                    <div className="flex items-center justify-center w-20 h-20 rounded-full" style={{ background: "rgba(209,255,38,0.08)", border: "1px solid rgba(209,255,38,0.3)", boxShadow: "0 0 30px rgba(209,255,38,0.15)" }}>
                      <Headphones size={32} style={{ color: "#D1FF26" }} />
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="w-1 rounded-full" style={{ height: `${10 + Math.sin(i * 0.8 + elapsed * 0.5) * 30 + 20}px`, background: "#D1FF26", opacity: 0.4 + Math.sin(i + elapsed * 0.3) * 0.3, transition: "height 0.2s" }} />
                      ))}
                    </div>
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>AUDIO STREAMING · SMS + CALL</p>
                  </>
                ) : (
                  <div className="text-center">
                    <Headphones size={40} style={{ color: "rgba(209,255,38,0.15)", margin: "0 auto 12px" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>STREAM OFFLINE</p>
                  </div>
                )}
              </div>
            )}

            {/* Live badge + timer */}
            {isLive && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5" style={{ background: "#ef4444" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="font-mono text-[8px] tracking-widest font-bold text-white">LIVE</span>
                </div>
                <div className="px-2.5 py-1.5 font-mono text-[9px]" style={{ background: "rgba(5,7,10,0.8)", color: "#F5F5F7" }}>{formatTime(elapsed)}</div>
              </div>
            )}

            {/* Listener count overlay */}
            {isLive && (
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <Users size={11} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px] font-bold" style={{ color: "#D1FF26" }}>{listeners.toLocaleString()}</span>
                <span className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>LISTENING</span>
              </div>
            )}

            {/* SMS alert sent indicator */}
            {isLive && alertSent && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <Bell size={10} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[7px] tracking-widest" style={{ color: "#D1FF26" }}>SUBSCRIBERS NOTIFIED</span>
              </div>
            )}

            {/* Listener notice — can hear, can't speak */}
            {isLive && (
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
                <MicOff size={10} style={{ color: "#8A8F98" }} />
                <span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>LISTEN ONLY · TEXT TO CHAT</span>
              </div>
            )}
          </div>

          {/* Stream controls */}
          <div className="flex items-center gap-2 mt-3">
            {!isLive ? (
              <button onClick={goLive} disabled={alerting} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-60" style={{ background: "#D1FF26", color: "#05070A" }}>
                {alerting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} {alerting ? "Notifying Subscribers…" : "Start Demo Stream"}
              </button>
            ) : (
              <>
                <button onClick={() => setMuted(!muted)} className="flex items-center justify-center gap-2 px-4 py-3 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: muted ? "rgba(239,68,68,0.1)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${muted ? "rgba(239,68,68,0.3)" : "rgba(209,255,38,0.2)"}`, color: muted ? "#ef4444" : "#D1FF26" }}>
                  {muted ? <MicOff size={12} /> : <Mic size={12} />} {muted ? "Unmute" : "Mute"}
                </button>
                <button onClick={endStream} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                  <Pause size={12} /> End Stream
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live chat panel — desktop: in-grid; mobile: fixed bottom dock when live */}
        <div
          className="flex flex-col lg:relative"
          style={{
            background: "rgba(5,7,10,0.6)",
            border: "0.5px solid rgba(138,143,152,0.15)",
            maxHeight: "500px",
          }}
        >
          {/* Chat header */}
          <div className="flex items-center justify-between p-3" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.12)" }}>
            <div className="flex items-center gap-2">
              <MessageSquare size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>LIVE CHAT</p>
            </div>
            <div className="flex items-center gap-2">
              {isLive && (
                <button onClick={() => setTipOpen(true)} className="flex items-center gap-1 px-2 py-1 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                  <Heart size={9} fill="#D1FF26" /> Tip
                </button>
              )}
              <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{isLive ? `${listeners} online` : "offline"}</span>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ minHeight: "240px" }}>
            {!isLive && chat.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare size={24} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 8px" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>START STREAM TO ENABLE CHAT</p>
              </div>
            )}
            {chat.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[7px] tracking-widest" style={{ color: msg.isSelf ? "#D1FF26" : "#8A8F98" }}>{msg.name.toUpperCase()}</span>
                  <span className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>{msg.time}</span>
                </div>
                <div className="max-w-[85%] p-2" style={{ background: msg.type === "tip" ? "rgba(209,255,38,0.15)" : msg.isSelf ? "rgba(209,255,38,0.08)" : msg.type === "voice" ? "rgba(96,165,250,0.06)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${msg.type === "tip" ? "rgba(209,255,38,0.4)" : msg.isSelf ? "rgba(209,255,38,0.2)" : msg.type === "voice" ? "rgba(96,165,250,0.15)" : "rgba(138,143,152,0.08)"}` }}>
                  {msg.type === "tip" ? (
                    <div className="flex items-center gap-1.5">
                      <Heart size={11} fill="#D1FF26" style={{ color: "#D1FF26" }} />
                      <p className="text-[10px] font-semibold" style={{ color: "#D1FF26" }}>{msg.text}</p>
                    </div>
                  ) : msg.type === "voice" ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-5 h-5 flex-shrink-0" style={{ background: "rgba(96,165,250,0.15)", borderRadius: "50%" }}>
                        <Mic size={9} style={{ color: "#60A5FA" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px]" style={{ color: "#F5F5F7", lineHeight: 1.3 }}>{msg.text}</p>
                        <p className="font-mono text-[7px] mt-0.5" style={{ color: "#60A5FA" }}>🎤 Voice → Text · {msg.duration}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px]" style={{ color: msg.isSelf ? "#D1FF26" : "#F5F5F7", lineHeight: 1.4 }}>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            <AnimatePresence>
              {typing && isLive && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>LISTENER TYPING</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {typing && isLive && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 p-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26" }} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Chat input — listener can text, send voice memo, or tip */}
          <div className="p-3" style={{ borderTop: "0.5px solid rgba(138,143,152,0.12)" }}>
            {isLive ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <input value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendText()} placeholder="Send a text message…" className="flex-1 px-3 py-2 text-[16px] sm:text-xs outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                  <button onClick={() => setTipOpen(true)} className="flex items-center justify-center w-9 h-9 transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }} title="Send a tip">
                    <Heart size={13} fill="#D1FF26" style={{ color: "#D1FF26" }} />
                  </button>
                  <button onClick={sendText} disabled={!textInput.trim()} className="flex items-center justify-center w-9 h-9 transition-all disabled:opacity-30" style={{ background: "#D1FF26" }}>
                    <Send size={13} style={{ color: "#05070A" }} />
                  </button>
                </div>
                <button onClick={sendVoiceMemo} className="w-full flex items-center justify-center gap-2 py-2 font-mono text-[8px] tracking-widest uppercase transition-all" style={{ background: recording ? "rgba(239,68,68,0.1)" : "rgba(96,165,250,0.08)", border: `0.5px solid ${recording ? "rgba(239,68,68,0.3)" : "rgba(96,165,250,0.25)"}`, color: recording ? "#ef4444" : "#60A5FA" }}>
                  {recording ? <Loader2 size={11} className="animate-spin" /> : <Mic size={11} />}
                  {recording ? "Recording… (0:03)" : "Send Voice Memo → Text"}
                </button>
                <div className="flex items-center gap-1.5 mt-2 px-1">
                  <Lock size={8} style={{ color: "rgba(138,143,152,0.5)" }} />
                  <p className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>Listeners can text, send voice memos & tip — host hears you via transcription</p>
                </div>
              </>
            ) : (
              <p className="font-mono text-[8px] text-center" style={{ color: "rgba(138,143,152,0.4)" }}>Go live to enable chat</p>
            )}
          </div>

          {/* SMS alert subscription */}
          <div className="p-3" style={{ borderTop: "0.5px solid rgba(138,143,152,0.12)", background: "rgba(209,255,38,0.03)" }}>
            {subscribed ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 flex-shrink-0" style={{ background: "rgba(209,255,38,0.15)", borderRadius: "50%" }}>
                  <Check size={13} style={{ color: "#D1FF26" }} />
                </div>
                <div>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>SUBSCRIBED</p>
                  <p className="text-[9px]" style={{ color: "#8A8F98" }}>You'll get an SMS the moment any stream goes live</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Bell size={9} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>GET LIVE STREAM ALERTS</p>
                </div>
                <input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} placeholder="Your name" className="w-full px-2.5 py-2 text-[16px] sm:text-[11px] mb-1.5" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }} />
                <input value={subForm.phone} onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })} placeholder="Phone number" className="w-full px-2.5 py-2 text-[16px] sm:text-[11px] mb-2" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }} />
                <button type="submit" disabled={subscribing || !subForm.name.trim() || !subForm.phone.trim()} className="w-full flex items-center justify-center gap-1.5 py-2 font-mono text-[8px] tracking-widest uppercase transition-all disabled:opacity-30" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                  {subscribing ? <Loader2 size={10} className="animate-spin" /> : <Bell size={10} />} Notify Me
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Planned features */}
      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <p className="sm:col-span-3 font-mono text-[9px] tracking-widest text-center" style={{ color: "#8A8F98" }}>PLANNED FOR THE FULL RELEASE</p>
        {[
          { icon: MicOff, title: "Listen-Only Mode", desc: "Listeners hear everything but can't be heard unless you invite them on" },
          { icon: MessageSquare, title: "SMS Stream Chat", desc: "Listeners text or send voice memos that auto-transcribe into your live chat" },
          { icon: Phone, title: "Dual Access", desc: "Audiences tune in via SMS stream or direct dial — works on any phone" },
        ].map((feat) => {
          const Icon = feat.icon;
          return (
            <div key={feat.title} className="p-4" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Icon size={16} style={{ color: "#D1FF26" }} />
              <p className="font-heading font-semibold text-sm mt-2 mb-1" style={{ color: "#F5F5F7" }}>{feat.title}</p>
              <p className="text-[10px]" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{feat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Demo note */}
      <div className="mt-6 p-5 flex items-center justify-center gap-2" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <Star size={12} style={{ color: "#D1FF26", fill: "#D1FF26" }} />
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>DEMO PREVIEW · SUBSCRIBER SMS ALERTS ARE LIVE · FULL BROADCAST COMING SOON</p>
      </div>

      {/* Mobile fixed-bottom chat dock — appears when stream is live on small screens */}
      {isLive && (
        <div
          className="lg:hidden fixed left-0 right-0 z-[60]"
          style={{ bottom: `${keyboardOffset}px`, transition: "bottom 0.2s ease-out" }}
        >
          <div style={{ background: "rgba(5,7,10,0.97)", borderTop: "0.5px solid rgba(209,255,38,0.3)", backdropFilter: "blur(12px)", boxShadow: "0 -8px 30px rgba(0,0,0,0.5)" }}>
            {/* Quick action bar — tip + expand chat */}
            <div className="flex items-center gap-2 p-2.5">
              <button onClick={() => setMobileChatOpen(!mobileChatOpen)} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}>
                <MessageSquare size={11} style={{ color: "#D1FF26" }} />
                {mobileChatOpen ? "Hide Chat" : "Chat"}
                {chat.length > 0 && <span className="font-mono text-[7px] px-1" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26" }}>{chat.length}</span>}
              </button>
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendText()}
                placeholder="Send a message…"
                className="flex-1 px-3 py-2 text-[16px] outline-none"
                style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
              />
              <button onClick={() => setTipOpen(true)} className="flex items-center justify-center w-10 h-10 transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <Heart size={14} fill="#D1FF26" style={{ color: "#D1FF26" }} />
              </button>
              <button onClick={sendText} disabled={!textInput.trim()} className="flex items-center justify-center w-10 h-10 transition-all disabled:opacity-30" style={{ background: "#D1FF26" }}>
                <Send size={14} style={{ color: "#05070A" }} />
              </button>
            </div>
          </div>

          {/* Expandable chat message tray */}
          <AnimatePresence>
            {mobileChatOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
                style={{ background: "rgba(5,7,10,0.97)", borderTop: "0.5px solid rgba(138,143,152,0.1)" }}
              >
                <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: "300px" }}>
                  {chat.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[7px] tracking-widest" style={{ color: msg.isSelf ? "#D1FF26" : "#8A8F98" }}>{msg.name.toUpperCase()}</span>
                        <span className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>{msg.time}</span>
                      </div>
                      <div className="max-w-[85%] p-2" style={{ background: msg.type === "tip" ? "rgba(209,255,38,0.15)" : msg.isSelf ? "rgba(209,255,38,0.08)" : msg.type === "voice" ? "rgba(96,165,250,0.06)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${msg.type === "tip" ? "rgba(209,255,38,0.4)" : msg.isSelf ? "rgba(209,255,38,0.2)" : msg.type === "voice" ? "rgba(96,165,250,0.15)" : "rgba(138,143,152,0.08)"}` }}>
                        {msg.type === "tip" ? (
                          <div className="flex items-center gap-1.5">
                            <Heart size={11} fill="#D1FF26" style={{ color: "#D1FF26" }} />
                            <p className="text-[10px] font-semibold" style={{ color: "#D1FF26" }}>{msg.text}</p>
                          </div>
                        ) : (
                          <p className="text-[10px]" style={{ color: msg.isSelf ? "#D1FF26" : "#F5F5F7", lineHeight: 1.4 }}>{msg.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Tip modal */}
      <TipPanel open={tipOpen} onClose={() => setTipOpen(false)} creatorName="DJ Signal" onTipSent={handleTipSent} />
    </div>
  );
}