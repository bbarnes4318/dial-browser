import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Smartphone, MessageSquare, Download, Check, ChevronRight, Loader2, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GAMES = [
  {
    id: "signal-runner",
    title: "Signal Runner",
    genre: "Action / Runner",
    rating: 4.8,
    downloads: "2.4M",
    cover: null,
    blurb: "Sprint through a neon circuit city. Dodge firewalls, collect data packets.",
  },
  {
    id: "dial-quest",
    title: "Dial Quest",
    genre: "RPG / Adventure",
    rating: 4.9,
    downloads: "1.8M",
    cover: null,
    blurb: "Wield the legendary Dial Artifact. Explore a world of voice-activated magic.",
  },
  {
    id: "frequency-wars",
    title: "Frequency Wars",
    genre: "Space Shooter",
    rating: 4.7,
    downloads: "3.1M",
    cover: null,
    blurb: "Blast through enemy fleets. Tune your weapons to the right frequency.",
  },
  {
    id: "pulse-arena",
    title: "Pulse Arena",
    genre: "Fighting",
    rating: 4.6,
    downloads: "1.2M",
    cover: null,
    blurb: "Enter the neon arena. Master pulse combat and climb the global ranks.",
  },
];

const STEPS = [
  { num: "01", icon: Gamepad2, title: "Browse Games", desc: "Scroll through popular titles and tap any game cover to select it." },
  { num: "02", icon: Smartphone, title: "Enter Your Number", desc: "Type the phone number where you want the download link sent." },
  { num: "03", icon: MessageSquare, title: "Receive SMS", desc: "Get an instant text message with a direct download link for your game." },
  { num: "04", icon: Download, title: "Open & Play", desc: "Tap the link in your SMS to launch the game in your browser and start playing instantly." },
];

export default function RadioPhoneGames() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [phone, setPhone] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [sentGame, setSentGame] = useState(null);

  const handleSend = async () => {
    if (!selectedGame || !phone) return;
    setStatus("sending");
    try {
      await base44.functions.invoke("sendGameDownloadLink", {
        phone,
        game_id: selectedGame.id,
        player_name: playerName || undefined,
      });
      setSentGame(selectedGame);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const resetDemo = () => {
    setSelectedGame(null);
    setPhone("");
    setPlayerName("");
    setStatus("idle");
    setSentGame(null);
  };

  return (
    <section className="snap-section py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto">
        {/* Banner */}
        <div className="w-full overflow-hidden mb-12" style={{ border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <img
            src="https://media.base44.com/images/public/6a422320311efd575ae6536c/b96a4bef4_Gemini_Generated_Image_xfameixfameixfam.jpg"
            alt="Dial Browser Games — SMS Game Delivery System"
            className="block w-full h-auto"
            draggable={false}
            style={{ userSelect: "none" }}
          />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
            <Gamepad2 size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// RADIO PHONE GAMES</span>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-5xl mb-4" style={{ color: "#F5F5F7" }}>
            Play Games via <span style={{ color: "#D1FF26" }}>SMS</span>
          </h2>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            No app store. No search. Just pick a game, enter your number, and get a verified play link texted straight to your phone. Open it and start playing instantly — gaming for everyone, 1 call away.
          </p>
        </motion.div>

        {/* Popular Games Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-6">
            <Star size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// POPULAR NOW</p>
            <div className="flex-1 h-px" style={{ background: "rgba(209,255,38,0.15)" }} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {GAMES.map((game, idx) => {
              const isSelected = selectedGame?.id === game.id;
              return (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  onClick={() => { setSelectedGame(game); setStatus("idle"); }}
                  className="group relative text-left transition-all duration-300"
                  style={{
                    transform: isSelected ? "scale(0.97)" : "scale(1)",
                  }}
                >
                  <div
                    className="relative overflow-hidden transition-all duration-300"
                    style={{
                      border: `0.5px solid ${isSelected ? "#D1FF26" : "rgba(209,255,38,0.15)"}`,
                      boxShadow: isSelected ? "0 0 24px rgba(209,255,38,0.25)" : "none",
                    }}
                  >
                    <div className="aspect-[3/4] overflow-hidden relative" style={{ background: "linear-gradient(135deg, #0A0D14 0%, rgba(209,255,38,0.10) 100%)" }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-heading font-black text-5xl" style={{ color: "rgba(209,255,38,0.35)" }}>{game.title.charAt(0)}</span>
                      </div>
                      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(209,255,38,0.12), transparent 70%)" }} />
                    </div>

                    {/* Selected overlay */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(5,7,10,0.7)" }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#D1FF26" }}>
                          <Check size={20} style={{ color: "#05070A" }} />
                        </div>
                      </motion.div>
                    )}

                    {/* Rating badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1" style={{ background: "rgba(5,7,10,0.85)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                      <Star size={8} style={{ color: "#D1FF26" }} fill="#D1FF26" />
                      <span className="font-mono text-[9px] font-bold" style={{ color: "#D1FF26" }}>{game.rating}</span>
                    </div>
                  </div>

                  {/* Game info */}
                  <div className="mt-3 px-1">
                    <p className="font-heading font-bold text-sm mb-0.5" style={{ color: isSelected ? "#D1FF26" : "#F5F5F7" }}>{game.title}</p>
                    <p className="font-mono text-[9px] tracking-wider mb-1" style={{ color: "#8A8F98" }}>{game.genre}</p>
                    <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.6)" }}>{game.downloads} downloads</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-6">
            <Smartphone size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// HOW IT WORKS</p>
            <div className="flex-1 h-px" style={{ background: "rgba(209,255,38,0.15)" }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative p-5"
                style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[10px] font-bold" style={{ color: "rgba(209,255,38,0.5)" }}>{step.num}</span>
                  <div className="w-8 h-8 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <step.icon size={14} style={{ color: "#D1FF26" }} />
                  </div>
                </div>
                <p className="font-heading font-semibold text-sm mb-1.5" style={{ color: "#F5F5F7" }}>{step.title}</p>
                <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{step.desc}</p>

                {idx < STEPS.length - 1 && (
                  <ChevronRight size={14} className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(209,255,38,0.3)" }} />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="p-6 sm:p-8"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Download size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// TRY IT NOW — LIVE DEMO</p>
            <div className="flex-1 h-px" style={{ background: "rgba(209,255,38,0.15)" }} />
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>DEMO MODE</span>
          </div>

          <AnimatePresence mode="wait">
            {status === "sent" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(209,255,38,0.1)", border: "2px solid #D1FF26" }}
                >
                  <Check size={28} style={{ color: "#D1FF26" }} />
                </motion.div>
                <h3 className="font-heading font-bold text-xl mb-2" style={{ color: "#F5F5F7" }}>Link Sent!</h3>
                <p className="text-sm mb-1" style={{ color: "#8A8F98" }}>
                  A verified play link for <span style={{ color: "#D1FF26" }}>{sentGame?.title}</span> was sent to:
                </p>
                <p className="font-mono text-sm mb-6" style={{ color: "#F5F5F7" }}>{phone}</p>
                <button
                  onClick={resetDemo}
                  className="px-6 py-2.5 font-mono text-[10px] tracking-widest transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]"
                  style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                >
                  SEND ANOTHER GAME
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid lg:grid-cols-2 gap-8"
              >
                {/* Left: Selected game display */}
                <div>
                  <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>SELECTED GAME</p>
                  {selectedGame ? (
                    <div className="flex gap-4 p-4" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      <div className="w-20 h-28 flex items-center justify-center flex-shrink-0" style={{ border: "0.5px solid rgba(209,255,38,0.2)", background: "linear-gradient(135deg, #0A0D14 0%, rgba(209,255,38,0.14) 100%)" }}>
                        <span className="font-heading font-black text-3xl" style={{ color: "rgba(209,255,38,0.5)" }}>{selectedGame.title.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-lg mb-1" style={{ color: "#D1FF26" }}>{selectedGame.title}</p>
                        <p className="font-mono text-[10px] tracking-wider mb-2" style={{ color: "#8A8F98" }}>{selectedGame.genre}</p>
                        <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{selectedGame.blurb}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px dashed rgba(138,143,152,0.2)" }}>
                      <div className="text-center">
                        <Gamepad2 size={24} className="mx-auto mb-2" style={{ color: "rgba(138,143,152,0.3)" }} />
                        <p className="text-xs" style={{ color: "#8A8F98" }}>Tap a game cover above to select it</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: SMS form */}
                <div>
                  <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>YOUR PHONE NUMBER</p>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 mb-3 font-mono text-sm outline-none transition-all"
                    style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                  />
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full px-4 py-3 mb-4 font-mono text-sm outline-none transition-all"
                    style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                  />

                  {status === "error" && (
                    <p className="text-xs mb-3" style={{ color: "#ef4444" }}>Something went wrong. Please try again.</p>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={!selectedGame || !phone || status === "sending"}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 font-mono text-[11px] tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_24px_rgba(209,255,38,0.25)]"
                    style={{ background: "#D1FF26", border: "0.5px solid #D1FF26", color: "#05070A" }}
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        SENDING...
                      </>
                    ) : (
                      <>
                        <MessageSquare size={14} />
                        SEND PLAY LINK
                      </>
                    )}
                  </button>

                  <p className="text-[10px] mt-3 text-center" style={{ color: "rgba(138,143,152,0.5)" }}>
                    Standard SMS rates may apply. Demo sends a real SMS to the number provided.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}