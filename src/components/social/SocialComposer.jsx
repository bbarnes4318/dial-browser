import React, { useState, useRef } from "react";
import { Image as ImageIcon, Send, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import SocialVoiceRecorder from "./SocialVoiceRecorder";

/**
 * Post composer with text, image upload, and voice note.
 */
export default function SocialComposer({ profile, onPosted }) {
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [voice, setVoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setMediaUrl(file_url);
    } catch {
      setError("Image upload failed");
    } finally {
      setUploadingImg(false);
    }
  };

  const canPost = (text.trim() || voice || mediaUrl) && !loading;

  const submit = async () => {
    if (!canPost) return;
    setLoading(true);
    setError("");
    try {
      await base44.entities.SocialPost.create({
        author_profile_id: profile.id,
        author_handle: profile.handle,
        author_name: profile.display_name,
        author_avatar: profile.avatar_url || "",
        text: text.trim(),
        media_url: mediaUrl,
        voice_note_url: voice?.url || "",
        voice_note_duration: voice?.duration || 0,
        voice_note_transcript: voice?.transcript || "",
        like_count: 0,
        comment_count: 0,
        share_count: 0,
      });
      await base44.entities.SocialProfile.update(profile.id, { post_count: (profile.post_count || 0) + 1 });
      setText("");
      setMediaUrl("");
      setVoice(null);
      onPosted?.();
    } catch (err) {
      setError(err.message || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4" style={{ background: "rgba(10,13,20,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div className="flex gap-3">
        <div className="w-9 h-9 flex-shrink-0 overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {profile.avatar_url ? (
            <img src={proxyMediaUrl(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{profile.display_name?.[0]}</div>
          )}
        </div>
        <div className="flex-1">
          <textarea
            placeholder="Share your voice..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={2}
            className="w-full px-3 py-2 text-sm outline-none resize-none"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
          />

          {/* Previews */}
          {mediaUrl && (
            <div className="relative mt-2 inline-block">
              <img src={proxyMediaUrl(mediaUrl)} alt="preview" className="max-h-40 rounded-sm" style={{ border: "0.5px solid rgba(209,255,38,0.2)" }} />
              <button onClick={() => setMediaUrl("")} className="absolute top-1 right-1 p-1" style={{ background: "rgba(5,7,10,0.8)", color: "#ef4444" }}>
                <X size={12} />
              </button>
            </div>
          )}
          {voice && (
            <div className="mt-2 flex items-center gap-2 p-2" style={{ background: "rgba(66,225,246,0.06)", border: "0.5px solid rgba(66,225,246,0.2)" }}>
              <span className="text-xs" style={{ color: "#42E1F6" }}>✓ Voice note ({Math.floor(voice.duration / 60)}:{String(voice.duration % 60).padStart(2, "0")})</span>
              <button onClick={() => setVoice(null)} className="text-[10px]" style={{ color: "#ef4444" }}>Remove</button>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={uploadingImg} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                {uploadingImg ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />} Image
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              <SocialVoiceRecorder compact onComplete={setVoice} onClear={() => setVoice(null)} />
            </div>
            <button onClick={submit} disabled={!canPost} className="flex items-center gap-1.5 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)] disabled:opacity-30" style={{ background: "#D1FF26", color: "#05070A" }}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Post
            </button>
          </div>
          {error && <p className="mt-2 text-xs" style={{ color: "#ef4444" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}