import React, { useState, useRef } from "react";
import { User, AtSign, FileText, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SocialVoiceRecorder from "./SocialVoiceRecorder";

/**
 * Holographic opt-in profile creation card. Creates a SocialProfile owned by the current user.
 */
export default function SocialCreateProfile({ user, onCreated }) {
  const [form, setForm] = useState({ handle: "", display_name: "", bio: "", avatar_url: "" });
  const [greeting, setGreeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const handle = form.handle.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!handle) { setError("Handle required (letters, numbers, underscore)"); return; }
    if (!form.display_name.trim()) { setError("Display name required"); return; }
    setLoading(true);
    try {
      const existing = await base44.entities.SocialProfile.filter({ handle });
      if (existing.length > 0) { setError("That handle is taken"); setLoading(false); return; }
      const profile = await base44.entities.SocialProfile.create({
        handle,
        display_name: form.display_name.trim(),
        bio: form.bio.trim(),
        avatar_url: form.avatar_url,
        voice_greeting_url: greeting?.url || "",
        voice_greeting_transcript: greeting?.transcript || "",
        owner_user_id: user.id,
        follower_count: 0,
        following_count: 0,
        post_count: 0,
        active: true,
      });
      onCreated?.(profile);
    } catch (err) {
      setError(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#05070A" }}>
      <div className="w-full max-w-md" style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 20px 80px rgba(0,0,0,0.7)" }}>
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
        </div>
        <div className="p-6">
          <p className="font-mono text-[10px] tracking-[0.3em] mb-2" style={{ color: "#D1FF26" }}>// CREATE SOCIAL PROFILE</p>
          <h2 className="font-heading font-black text-2xl mb-1" style={{ color: "#F5F5F7" }}>Join Dial Social</h2>
          <p className="text-xs mb-5" style={{ color: "#8A8F98" }}>Create your holographic social profile to start posting, following, and sharing by voice.</p>

          {error && <div className="mb-4 p-2.5 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>}

          <form onSubmit={submit} className="space-y-3">
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : uploadingAvatar ? (
                  <Loader2 size={18} className="animate-spin" style={{ color: "#8A8F98" }} />
                ) : (
                  <ImageIcon size={18} style={{ color: "#8A8F98" }} />
                )}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-[10px] font-mono uppercase tracking-wider px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                Upload Avatar
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
            </div>

            <Field icon={AtSign} placeholder="@handle" value={form.handle} onChange={(v) => setForm({ ...form, handle: v })} />
            <Field icon={User} placeholder="Display name" value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} />
            <div className="relative">
              <FileText className="absolute left-3 top-3" size={14} style={{ color: "#8A8F98" }} />
              <textarea
                placeholder="Bio (optional)"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                maxLength={300}
                rows={2}
                className="w-full pl-9 pr-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
              />
            </div>

            <div>
              <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#42E1F6" }}>// VOICE GREETING (OPTIONAL)</p>
              {greeting ? (
                <div className="flex items-center justify-between p-2.5" style={{ background: "rgba(66,225,246,0.06)", border: "0.5px solid rgba(66,225,246,0.2)" }}>
                  <span className="text-xs" style={{ color: "#42E1F6" }}>✓ Voice greeting recorded</span>
                  <button type="button" onClick={() => setGreeting(null)} className="text-[10px]" style={{ color: "#ef4444" }}>Remove</button>
                </div>
              ) : (
                <SocialVoiceRecorder onComplete={setGreeting} onClear={() => setGreeting(null)} />
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Create Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, placeholder, value, onChange, type = "text" }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: "#8A8F98" }} />
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
    </div>
  );
}