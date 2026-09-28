import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music, Image, Heart, Calendar, Link2, Phone, Mail,
  Loader2, Check, Upload, ChevronRight, User, X, Plus, MapPin,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const GENRE_PRESETS = ["Hip-Hop", "Jazz", "Afrobeats", "R&B", "Pop", "Electronic", "Rock", "Country", "Reggae", "Latin"];

export default function ArtistOnboarding() {
  const [form, setForm] = useState({
    artist_name: "",
    genre: "",
    phone: "",
    email: "",
    bio: "",
    dedication: "",
  });
  const [shows, setShows] = useState([{ date: "", venue: "", city: "" }]);
  const [socials, setSocials] = useState([""]);
  const [musicFile, setMusicFile] = useState(null);
  const [artworkFile, setArtworkFile] = useState(null);
  const [artworkPreview, setArtworkPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleArtworkChange = (file) => {
    setArtworkFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setArtworkPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setArtworkPreview(null);
    }
  };

  const updateShow = (idx, field, value) => {
    setShows((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };
  const addShow = () => setShows((prev) => [...prev, { date: "", venue: "", city: "" }]);
  const removeShow = (idx) => setShows((prev) => prev.filter((_, i) => i !== idx));

  const updateSocial = (idx, value) => {
    setSocials((prev) => prev.map((s, i) => (i === idx ? value : s)));
  };
  const addSocial = () => setSocials((prev) => [...prev, ""]);
  const removeSocial = (idx) => setSocials((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.artist_name.trim() || !form.phone.trim()) {
      setError("Artist name and phone number are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let music_url = "";
      let artwork_url = "";

      if (musicFile) {
        const res = await base44.integrations.Core.UploadFile({ file: musicFile });
        music_url = res.file_url;
      }
      if (artworkFile) {
        const res = await base44.integrations.Core.UploadFile({ file: artworkFile });
        artwork_url = res.file_url;
      }

      const formattedShows = shows
        .filter((s) => s.venue.trim())
        .map((s) => `${s.date ? s.date + " — " : ""}${s.venue}${s.city ? ", " + s.city : ""}`);

      await base44.entities.ArtistProfile.create({
        ...form,
        music_url,
        artwork_url,
        upcoming_shows: formattedShows,
        social_links: socials.filter((s) => s.trim()),
      });

      setSubmitted(true);
    } catch {
      setError("Could not submit your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 text-center" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4" style={{ background: "rgba(209,255,38,0.1)", border: "1px solid rgba(209,255,38,0.3)" }}>
          <Check size={28} style={{ color: "#D1FF26" }} />
        </div>
        <p className="font-heading font-black text-2xl mb-2" style={{ color: "#F5F5F7" }}>Profile Submitted!</p>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Welcome to 1 CALL ARTIST™. Your music, artwork, and show dates are now on the network.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="p-6 lg:p-8" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div className="flex items-center gap-2 mb-2">
        <User size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ARTIST ONBOARDING</p>
      </div>
      <h3 className="font-heading font-black text-2xl lg:text-3xl mb-2" style={{ color: "#F5F5F7" }}>
        Join the <span style={{ color: "#D1FF26" }}>Network</span>
      </h3>
      <p className="text-sm mb-6 max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        Upload your music, artwork, dedications, upcoming show dates, and links. Reach fans across the 1 Call network — no streaming app required.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === GALLERY SECTION: Artwork + Music === */}
        <div>
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>▸ CONTENT GALLERY</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Artwork upload tile with live preview */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer group overflow-hidden transition-all hover:border-[rgba(209,255,38,0.5)]"
              style={{ aspectRatio: "1/1", background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
            >
              {artworkPreview ? (
                <>
                  <img src={artworkPreview} alt="Cover artwork" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: "rgba(5,7,10,0.7)" }}>
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>CHANGE ARTWORK</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <Image size={20} style={{ color: "#D1FF26" }} />
                  </div>
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>UPLOAD COVER ART</p>
                  <p className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>JPG, PNG · Square</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleArtworkChange(e.target.files?.[0] || null)} />
            </div>

            {/* Music upload tile */}
            <label className="relative cursor-pointer group overflow-hidden transition-all hover:border-[rgba(209,255,38,0.5)] flex flex-col" style={{ aspectRatio: "1/1", background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center justify-center w-12 h-12" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <Music size={20} style={{ color: musicFile ? "#D1FF26" : "#8A8F98" }} />
                </div>
                <p className="font-mono text-[9px] tracking-widest text-center px-3" style={{ color: musicFile ? "#D1FF26" : "#8A8F98" }}>
                  {musicFile ? musicFile.name : "UPLOAD MUSIC TRACK"}
                </p>
                {!musicFile && <p className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>MP3, WAV, M4A</p>}
              </div>
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => setMusicFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        {/* === BASIC INFO === */}
        <div>
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>▸ ARTIST INFO</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Music size={10} /> ARTIST NAME *</label>
              <input value={form.artist_name} onChange={(e) => update("artist_name", e.target.value)} className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
            </div>
            <div>
              <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>GENRE</label>
              <div className="flex flex-wrap gap-1.5">
                {GENRE_PRESETS.map((g) => (
                  <button key={g} type="button" onClick={() => update("genre", g)} className="px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all" style={{ background: form.genre === g ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${form.genre === g ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`, color: form.genre === g ? "#D1FF26" : "#8A8F98" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Phone size={10} /> PHONE *</label>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Mail size={10} /> EMAIL</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
            </div>
          </div>
          <div className="mt-4">
            <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>ARTIST BIO</label>
            <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={2} className="w-full px-3 py-2.5 text-sm resize-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Heart size={10} /> DEDICATION TO FANS</label>
            <input value={form.dedication} onChange={(e) => update("dedication", e.target.value)} placeholder="This one's for everyone who believed…" className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
          </div>
        </div>

        {/* === TOUR DATES GRID === */}
        <div>
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>▸ TOUR DATES</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {shows.map((show, idx) => (
              <div key={idx} className="relative p-3 group" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar size={10} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>SHOW {String(idx + 1).padStart(2, "0")}</span>
                  {shows.length > 1 && (
                    <button type="button" onClick={() => removeShow(idx)} className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity">
                      <X size={11} style={{ color: "#8A8F98" }} />
                    </button>
                  )}
                </div>
                <input type="date" value={show.date} onChange={(e) => updateShow(idx, "date", e.target.value)} className="w-full px-2.5 py-2 text-[16px] sm:text-xs mb-1.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)", color: "#F5F5F7" }} />
                <input value={show.venue} onChange={(e) => updateShow(idx, "venue", e.target.value)} placeholder="Venue name" className="w-full px-2.5 py-2 text-[16px] sm:text-xs mb-1.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)", color: "#F5F5F7" }} />
                <div className="relative">
                  <MapPin size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
                  <input value={show.city} onChange={(e) => updateShow(idx, "city", e.target.value)} placeholder="City" className="w-full pl-7 pr-2.5 py-2 text-[16px] sm:text-xs" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)", color: "#F5F5F7" }} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addShow} className="flex flex-col items-center justify-center gap-1.5 p-3 transition-all hover:border-[rgba(209,255,38,0.3)]" style={{ background: "rgba(5,7,10,0.3)", border: "0.5px dashed rgba(138,143,152,0.2)", minHeight: "120px" }}>
              <Plus size={16} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>ADD SHOW</span>
            </button>
          </div>
        </div>

        {/* === LINKS: Socials + Merch === */}
        <div>
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>▸ LINKS</p>
          <div className="space-y-2 mb-3">
            {socials.map((social, idx) => (
              <div key={idx} className="flex gap-2">
                <div className="flex items-center justify-center w-9 flex-shrink-0" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                  <Link2 size={12} style={{ color: "#8A8F98" }} />
                </div>
                <input value={social} onChange={(e) => updateSocial(idx, e.target.value)} placeholder="https://instagram.com/yourname" className="flex-1 px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                {socials.length > 1 && (
                  <button type="button" onClick={() => removeSocial(idx)} className="px-3 transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}>✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addSocial} className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
              <Plus size={11} /> Add Social Link
            </button>
          </div>
        </div>

        {error && <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {error}</p>}

        <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />} Submit Artist Profile
        </button>
      </form>
    </motion.div>
  );
}