import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Phone, Mic, Volume2, Check, X, MessageCircle, Shield, Lock, Eye, EyeOff, Trash2, Archive, Reply } from "lucide-react";
import CompatibilityMeter from "@/components/landing/CompatibilityMeter";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const demoMessages = [
  { id: "m1", from: "Amara, 28", location: "Atlanta, GA", voiceMsg: "Hey! I saw your profile and loved your taste in music. Would love to chat more about Afrobeats!", duration: 15, time: "2 min ago", liked: true, matched: true, read: false },
  { id: "m2", from: "Zainab, 26", location: "Kano", voiceMsg: "Hi there! I'm also a bookworm. What's your favorite genre? Let's discuss!", duration: 12, time: "1 hr ago", liked: false, matched: false, read: false },
  { id: "m3", from: "Chioma, 29", location: "Abuja", voiceMsg: "Your profile made me smile. I enjoy hiking and outdoor adventures. Maybe we can plan something together?", duration: 18, time: "3 hrs ago", liked: true, matched: true, read: true },
  { id: "m4", from: "Bisi, 27", location: "Atlanta, GA", voiceMsg: "Hello! I noticed we both love cooking. Want to exchange some recipes?", duration: 10, time: "Yesterday", liked: false, matched: false, read: true },
];

const demoMatches = [
  { id: "match1", name: "Amara", age: 28, location: "Atlanta, GA", lastActive: "Online now", compatibility: 92, chats: 12, gradient: "from-rose-900/50 to-pink-800/10" },
  { id: "match2", name: "Chioma", age: 29, location: "Abuja", lastActive: "5 min ago", compatibility: 87, chats: 8, gradient: "from-violet-900/50 to-purple-800/10" },
  { id: "match3", name: "Fatima", age: 26, location: "Kano", lastActive: "1 hr ago", compatibility: 84, chats: 5, gradient: "from-cyan-900/50 to-blue-800/10" },
];

const fmtTime = (s) => `0:${String(s).padStart(2, "0")}`;

export default function DatingDashboard() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);
  const [activeTab, setActiveTab] = useState("messages");
  const [messages, setMessages] = useState(demoMessages);
  const [playingId, setPlayingId] = useState(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [showNumber, setShowNumber] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { id: 1, from: "them", text: "Hey! Thanks for connecting 😊", time: "2:30 PM" },
    { id: 2, from: "me", text: "Hi Amara! Your voice message was lovely. I'd love to chat!", time: "2:32 PM" },
    { id: 3, from: "them", text: "What kind of music are you into?", time: "2:35 PM" },
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Voice playback — uses TTS to actually speak the message
  useEffect(() => {
    if (!playingId) {
      stopSpeaking();
      return;
    }
    const msg = messages.find((m) => m.id === playingId);
    if (!msg) return;
    speak(msg.voiceMsg, {
      rate: 0.95,
      pitch: 1.05,
      onEnd: () => { setPlayingId(null); setPlayProgress(100); },
      onError: () => setPlayingId(null),
    });
    const t = setInterval(() => {
      setPlayProgress((p) => {
        if (p >= 100) {
          setPlayingId(null);
          return 100;
        }
        return p + (100 / (msg.duration * 10));
      });
    }, 100);
    return () => { clearInterval(t); stopSpeaking(); };
  }, [playingId, messages]);

  const handlePlay = (msgId) => {
    if (playingId === msgId) {
      setPlayingId(null);
      setPlayProgress(0);
    } else {
      setPlayingId(msgId);
      setPlayProgress(0);
      // Mark as read
      setMessages((msgs) => msgs.map((m) => (m.id === msgId ? { ...m, read: true } : m)));
    }
  };

  const handleLike = (msgId) => {
    setMessages((msgs) => msgs.map((m) => (m.id === msgId ? { ...m, liked: !m.liked } : m)));
  };

  const handleArchive = (msgId) => {
    setMessages((msgs) => msgs.filter((m) => m.id !== msgId));
  };

  const handleDelete = (msgId) => {
    setMessages((msgs) => msgs.filter((m) => m.id !== msgId));
  };

  const handleSendChat = () => {
    if (!chatMessage.trim() || !selectedMatch) return;
    const newMsg = {
      id: Date.now(),
      from: "me",
      text: chatMessage,
      time: new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true }),
    };
    setChatHistory((h) => [...h, newMsg]);
    setChatMessage("");
  };

  const unreadCount = messages.filter((m) => !m.read).length;
  const matchesCount = messages.filter((m) => m.matched).length;

  return (
    <section ref={sectionRef} className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-10 lg:mb-14">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// 1 CALL DATING™ DASHBOARD</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Your Messages <span style={{ color: "#D1FF26" }}>Safe & Private.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Listen to voice messages from potential matches. Connect securely through our network — your phone number stays private.
          </p>

          {/* Step-by-step instructions */}
          <div className="mt-6 grid sm:grid-cols-4 gap-3 max-w-3xl">
            {[
              { step: 1, title: "Listen", desc: "Tap Listen on any voice message to hear it spoken aloud." },
              { step: 2, title: "Like", desc: "Tap Like on messages that interest you to create a match." },
              { step: 3, title: "Chat", desc: "Switch to the Matches tab, select a match, and start chatting." },
              { step: 4, title: "Reveal", desc: "Both parties can agree to reveal phone numbers when ready." },
            ].map((item) => (
              <div key={item.step} className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>{item.step}</span>
                  <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>{item.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "#8A8F98" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="mb-8 p-4 flex items-center gap-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <Shield size={16} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>SECURE MODE ACTIVE</span>
          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>·</span>
          <span className="text-sm" style={{ color: "#F5F5F7" }}>Your phone number is hidden from all users</span>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: "messages", label: "Messages", icon: MessageCircle, count: unreadCount },
            { id: "matches", label: "Matches", icon: Heart, count: matchesCount },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 transition-all relative"
                style={{
                  background: activeTab === tab.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${activeTab === tab.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                }}
              >
                <Icon size={14} style={{ color: activeTab === tab.id ? "#D1FF26" : "#8A8F98" }} />
                <span className="font-heading font-semibold text-sm" style={{ color: activeTab === tab.id ? "#D1FF26" : "#F5F5F7" }}>
                  {tab.label}
                </span>
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full" style={{ background: "#D1FF26", color: "#05070A" }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "messages" ? (
          /* Messages Tab */
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Messages list */}
            <div className="lg:col-span-2 space-y-3">
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>INCOMING MESSAGES</p>
              {messages.length === 0 ? (
                <div className="p-10 text-center" style={{ background: "#10141D", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <MessageCircle size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
                  <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>No messages yet</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isPlaying = playingId === msg.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: idx * 0.05 }}
                      className="p-5"
                      style={{
                        background: msg.read ? "#10141D" : "rgba(209,255,38,0.04)",
                        border: `0.5px solid ${msg.read ? "rgba(138,143,152,0.1)" : "rgba(209,255,38,0.3)"}`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-heading font-bold text-lg mb-0.5" style={{ color: "#F5F5F7" }}>
                            {msg.from} {!msg.read && <span className="inline-block w-2 h-2 rounded-full ml-2" style={{ background: "#D1FF26" }} />}
                          </h4>
                          <p className="font-mono text-sm" style={{ color: "#D1FF26" }}>📍 {msg.location}</p>
                        </div>
                        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{msg.time}</span>
                      </div>

                      {/* Voice player */}
                      <div className="p-4 mb-4" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                        <div className="flex items-center gap-3 mb-3">
                          <Mic size={14} style={{ color: "#D1FF26" }} />
                          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>VOICE MESSAGE</span>
                        </div>
                        <p className="text-sm mb-3" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>"{msg.voiceMsg}"</p>
                        {/* Progress */}
                        <div className="h-1 w-full mb-2 overflow-hidden" style={{ background: "rgba(138,143,152,0.2)" }}>
                          <div className="h-full" style={{ width: isPlaying ? `${playProgress}%` : "0%", background: "#D1FF26", transition: "width 0.1s linear" }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                            {isPlaying ? fmtTime(Math.floor((playProgress / 100) * msg.duration)) : fmtTime(msg.duration)}
                          </span>
                          <button
                            onClick={() => handlePlay(msg.id)}
                            className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                            style={{ background: "#D1FF26", color: "#05070A" }}
                          >
                            {isPlaying ? <><Volume2 size={12} /> Playing</> : <><Phone size={12} /> Listen</>}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLike(msg.id)}
                            className={`px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all ${
                              msg.liked ? "bg-[#D1FF26] text-[#05070A]" : "bg-transparent text-[#8A8F98]"
                            }`}
                            style={{ border: "0.5px solid rgba(209,255,38,0.3)" }}
                          >
                            <Heart size={12} className="inline mr-1.5" /> {msg.liked ? "Liked" : "Like"}
                          </button>
                          {msg.matched && (
                            <span className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                              <Check size={12} /> Matched
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleArchive(msg.id)} className="p-2 transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                            <Archive size={14} />
                          </button>
                          <button onClick={() => handleDelete(msg.id)} className="p-2 transition-colors hover:text-rose-400" style={{ color: "#8A8F98" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Privacy info sidebar */}
            <div className="p-5 h-fit space-y-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>PRIVACY FEATURES</p>
                </div>
                <ul className="space-y-2">
                  {[
                    "Phone number hidden",
                    "Voice messages only",
                    "Secure chat network",
                    "Block & report anytime",
                    "No screenshots allowed",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 font-mono text-[8px]">
                      <Check size={10} style={{ color: "#D1FF26" }} />
                      <span style={{ color: "#8A8F98" }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
                <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>QUICK STATS</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>New messages</span>
                    <span className="font-mono text-sm font-bold" style={{ color: "#D1FF26" }}>{unreadCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>Matches</span>
                    <span className="font-mono text-sm font-bold" style={{ color: "#D1FF26" }}>{matchesCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>Profile views</span>
                    <span className="font-mono text-sm font-bold" style={{ color: "#F5F5F7" }}>47</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                Privacy Settings
              </button>
            </div>
          </div>
        ) : (
          /* Matches Tab */
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Matches list */}
            <div className="space-y-3">
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>YOUR MATCHES</p>
              {demoMatches.map((match, idx) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: idx * 0.06 }}
                  onClick={() => setSelectedMatch(match)}
                  className={`p-4 cursor-pointer transition-all ${selectedMatch?.id === match.id ? "ring-1 ring-[#D1FF26]" : ""}`}
                  style={{ background: "#10141D", border: "0.5px solid rgba(138,143,152,0.1)" }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${match.gradient} flex items-center justify-center`}>
                      <span className="font-heading font-bold text-xl" style={{ color: "#F5F5F7" }}>{match.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{match.name}, {match.age}</h4>
                        <span className="font-mono text-[9px]" style={{ color: match.lastActive === "Online now" ? "#D1FF26" : "#8A8F98" }}>{match.lastActive}</span>
                      </div>
                      <p className="font-mono text-sm mb-2" style={{ color: "#D1FF26" }}>📍 {match.location}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart size={12} style={{ color: "#D1FF26" }} />
                          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{match.compatibility}% compatible</span>
                        </div>
                        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{match.chats} messages</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chat interface */}
            <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              {selectedMatch ? (
                <>
                  <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${selectedMatch.gradient} flex items-center justify-center`}>
                        <span className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{selectedMatch.name[0]}</span>
                      </div>
                      <div>
                        <h4 className="font-heading font-bold" style={{ color: "#F5F5F7" }}>{selectedMatch.name}</h4>
                        <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{selectedMatch.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={14} style={{ color: "#D1FF26" }} />
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>SECURE CHAT</span>
                    </div>
                  </div>

                  {/* Compatibility meter */}
                  <CompatibilityMeter match={selectedMatch} />

                  {/* Chat messages */}
                  <div className="h-80 overflow-y-auto mb-4 p-3 space-y-3" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                    {chatHistory.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] p-3 ${msg.from === "me" ? "rounded-l-lg rounded-tr-lg" : "rounded-r-lg rounded-tl-lg"}`} style={{ background: msg.from === "me" ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.8)" }}>
                          <p className="text-sm mb-1" style={{ color: "#F5F5F7" }}>{msg.text}</p>
                          <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Number reveal option */}
                  <div className="mb-3 p-3 flex items-center justify-between" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                    <div className="flex items-center gap-2">
                      <Lock size={12} style={{ color: "#D1FF26" }} />
                      <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>Phone numbers hidden</span>
                    </div>
                    <button
                      onClick={() => setShowNumber(!showNumber)}
                      className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase"
                      style={{ color: "#D1FF26" }}
                    >
                      {showNumber ? <><EyeOff size={10} /> Hide</> : <><Eye size={10} /> Reveal</>}
                    </button>
                  </div>
                  {showNumber && (
                    <div className="mb-3 p-3 text-center" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      <p className="font-mono text-[9px] mb-1" style={{ color: "#8A8F98" }}>Safe to share now:</p>
                      <p className="font-heading font-bold text-lg" style={{ color: "#D1FF26" }}>+234 XX XXX XXXX</p>
                      <p className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98" }}>Both parties must agree</p>
                    </div>
                  )}

                  {/* Chat input */}
                  <div className="flex items-center gap-2">
                    <input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 text-[16px] sm:text-sm"
                      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                    />
                    <button
                      onClick={handleSendChat}
                      className="px-5 py-3 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <MessageCircle size={42} style={{ color: "rgba(209,255,38,0.3)" }} />
                  <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>Select a match to chat</p>
                  <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>All conversations are secure and private</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}