import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TrackComments({ track }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadComments = useCallback(async () => {
    try {
      const all = await base44.entities.Comment.list("-created_date", 50);
      const filtered = (all || []).filter(
        (c) => c.content_type === "artist_track" && c.content_id === track.id
      );
      setComments(filtered);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [track.id]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await base44.entities.Comment.create({
        content_type: "artist_track",
        content_id: track.id,
        content_title: track.track_title,
        author_name: authorName.trim(),
        body: body.trim(),
      });
      setBody("");
      await loadComments();
    } catch {
      setError("Could not post comment. Please log in and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Your name *"
          maxLength={50}
          className="w-full px-3 py-2 text-sm outline-none"
          style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a comment for the artist..."
            maxLength={500}
            className="flex-1 px-3 py-2 text-sm outline-none"
            style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
          />
          <button
            type="submit"
            disabled={!authorName.trim() || !body.trim() || submitting}
            className="flex items-center justify-center px-4 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-2" style={{ background: "rgba(239,68,68,0.1)" }}>
          <AlertCircle size={11} style={{ color: "#ef4444" }} />
          <p className="font-mono text-[9px]" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 size={14} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center font-mono text-[9px] tracking-widest py-3" style={{ color: "#8A8F98" }}>
          NO COMMENTS YET · BE THE FIRST
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 p-2"
                style={{ background: "rgba(5,7,10,0.3)", border: "0.5px solid rgba(138,143,152,0.08)" }}
              >
                <div className="flex items-center justify-center w-6 h-6 flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", borderRadius: "50%" }}>
                  <span className="font-mono text-[8px] font-bold" style={{ color: "#D1FF26" }}>
                    {(comment.author_name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[8px] mb-0.5" style={{ color: "#D1FF26" }}>{comment.author_name}</p>
                  <p className="text-xs" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{comment.body}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Comment count */}
      {!loading && comments.length > 0 && (
        <div className="flex items-center gap-1.5">
          <MessageSquare size={10} style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{comments.length} COMMENT{comments.length !== 1 ? "S" : ""}</span>
        </div>
      )}
    </div>
  );
}