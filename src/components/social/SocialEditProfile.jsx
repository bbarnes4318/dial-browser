import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, Loader2, Save, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SocialVoiceRecorder from "./SocialVoiceRecorder";

/**
 * Edit-profile modal: update avatar, display name, bio, and voice greeting anytime.
 */
export default function SocialEditProfile({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    display_name: profile.display_name || "",
    bio: profile.bio || "",
    avatar_url: profile.avatar_url || "",
  });
  const [greeting, setGreeting] = useState(
    profile.voice_greeting_url
      ? { url: profile.voice_greeting_url, transcript: profile.voice_greeting_transcript || "", duration: 0 }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((f) => ({ ...f, avatar_url: file_url }));
    } catch {
      setError("Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.display_name.trim()) { setError("Display name required"); return; }
    setLoading(true);
    try {
      const updated = await base44.entities.SocialProfile.update(profile.id, {
        display_name: form.display_name.trim(),
        bio: form.bio.trim(),
        avatar_url: form.avatar_url,
        voice_greeting_url: greeting?.url || "",
        voice_greeting_transcript: greeting?.transcript || "",
      });
      onSaved?.(updated);
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(5,7,10,0.88)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain"
          style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 20px 80px rgba(0,0,0,0.7)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
          </div>
          <div className="flex items-center justify-between p-5" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}>
            <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// EDIT PROFILE</p>
            <button onClick={onClose} className="p-1.5 hover:bg-[rgba(239,68,68,0.1)]"><X size={16} style={{ color: "#8A8F98" }} /></button>
          </div>

          <form onSubmit={save} className="p-5 space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.2)" }}>
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : uploadingAvatar ? (
                  <Loader2 size={20} className="animate-spin" style={{ color: "#8A8F98" }} />
                ) : (
                  <ImageIcon size={20} style={{ color: "#8A8F98" }} />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="text-[10px] font-mono uppercase tracking-wider px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                  Upload New Avatar
                </button>
                {form.avatar_url && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, avatar_url: "" }))} className="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                    <Trash2 size={11} /> Remove Avatar
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
            </div>

            <div>
              <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>DISPLAY NAME</label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm outline-none"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
              />
            </div>

            <div>
              <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>BIO</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                maxLength={300}
                rows={3}
                className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
              />
            </div>

            <div>
              <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#42E1F6" }}>// VOICE GREETING</label>
              {greeting ? (
                <div className="flex items-center justify-between p-2.5" style={{ background: "rgba(66,225,246,0.06)", border: "0.5px solid rgba(66,225,246,0.2)" }}>
                  <span className="text-xs" style={{ color: "#42E1F6" }}>✓ Voice greeting set</span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setGreeting(null)} className="text-[10px]" style={{ color: "#8A8F98" }}>Clear</button>
                  </div>
                </div>
              ) : (
                <SocialVoiceRecorder onComplete={setGreeting} onClear={() => setGreeting(null)} />
              )}
            </div>

            {error && <div className="p-2.5 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Changes
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}