import React, { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import SocialVoicePlayer from "./SocialVoicePlayer";
import SocialVoiceRecorder from "./SocialVoiceRecorder";

/**
 * Inline comment thread with text + voice comments.
 */
export default function SocialCommentThread({ postId, myProfile, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [voice, setVoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadComments();
    const unsub = base44.entities.SocialComment.subscribe((event) => {
      if (event.data?.post_id === postId) {
        if (event.type === "create") setComments((prev) => [event.data, ...prev]);
        loadComments();
      }
    });
    return unsub;
  }, [postId]);

  const loadComments = async () => {
    try {
      const list = await base44.entities.SocialComment.filter({ post_id: postId }, "-created_date", 100);
      setComments(list);
      onCountChange?.(list.length);
    } catch {}
    setLoading(false);
  };

  const submit = async () => {
    if (!text.trim() && !voice) return;
    setPosting(true);
    try {
      await base44.entities.SocialComment.create({
        post_id: postId,
        author_profile_id: myProfile.id,
        author_handle: myProfile.handle,
        author_name: myProfile.display_name,
        author_avatar: myProfile.avatar_url || "",
        text: text.trim(),
        voice_note_url: voice?.url || "",
        voice_note_transcript: voice?.transcript || "",
        like_count: 0,
      });
      setText("");
      setVoice(null);
      loadComments();
    } catch {}
    setPosting(false);
  };

  return (
    <div>
      {/* Input */}
      <div className="flex items-start gap-2 mb-3">
        <div className="w-7 h-7 flex-shrink-0 overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {myProfile.avatar_url ? (
            <img src={proxyMediaUrl(myProfile.avatar_url)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{myProfile.display_name?.[0]}</div>
          )}
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
          />
          <div className="flex items-center justify-between mt-2">
            <SocialVoiceRecorder compact onComplete={setVoice} onClear={() => setVoice(null)} />
            <button onClick={submit} disabled={posting || (!text.trim() && !voice)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)] disabled:opacity-30" style={{ background: "#D1FF26", color: "#05070A" }}>
              {posting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Reply
            </button>
          </div>
          {voice && (
            <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "#42E1F6" }}>
              ✓ Voice comment ready
              <button onClick={() => setVoice(null)} className="text-[10px]" style={{ color: "#ef4444" }}>Remove</button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-xs text-center py-3" style={{ color: "#8A8F98" }}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: "#8A8F98" }}>No comments yet — be the first voice.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 flex-shrink-0 overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.15)" }}>
                {c.author_avatar ? (
                  <img src={proxyMediaUrl(c.author_avatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{c.author_name?.[0]}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="px-3 py-2" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "#D1FF26" }}>{c.author_name} <span className="font-mono font-normal text-[9px]" style={{ color: "#8A8F98" }}>· {c.created_date ? formatDistanceToNow(new Date(c.created_date), { addSuffix: true }) : ""}</span></p>
                  {c.text && <p className="text-sm" style={{ color: "#F5F5F7" }}>{c.text}</p>}
                </div>
                {c.voice_note_url && <div className="mt-1.5"><SocialVoicePlayer url={c.voice_note_url} transcript={c.voice_note_transcript} compact /></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}