import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, Reply, CornerDownRight, Pin } from "lucide-react";
import { base44 } from "@/api/base44Client";

const fmtTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function CommentSection({ contentType, contentId, contentTitle = "", authorName = "Guest" }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);
  const listRef = useRef(null);

  const loadComments = async () => {
    try {
      const res = await base44.entities.Comment.filter(
        { content_type: contentType, content_id: contentId },
        "-created_date",
        100
      );
      setComments(res || []);
    } catch {
      setComments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [contentType, contentId]);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = base44.entities.Comment.subscribe((event) => {
      if (event.data?.content_type !== contentType || event.data?.content_id !== contentId) return;
      if (event.type === "create") {
        setComments((prev) => [event.data, ...prev]);
      } else if (event.type === "update") {
        setComments((prev) => prev.map((c) => (c.id === event.data.id ? event.data : c)));
      } else if (event.type === "delete") {
        setComments((prev) => prev.filter((c) => c.id !== event.data.id));
      }
    });
    return unsubscribe;
  }, [contentType, contentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      await base44.entities.Comment.create({
        content_type: contentType,
        content_id: contentId,
        content_title: contentTitle,
        author_name: authorName,
        body: body.trim(),
      });
      setBody("");
    } catch {
      /* error bubbles */
    }
    setPosting(false);
  };

  const handleReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setPosting(true);
    try {
      await base44.entities.Comment.create({
        content_type: contentType,
        content_id: contentId,
        content_title: contentTitle,
        author_name: authorName,
        body: replyBody.trim(),
        parent_comment_id: parentId,
      });
      setReplyBody("");
      setReplyTo(null);
    } catch {
      /* error bubbles */
    }
    setPosting(false);
  };

  // Build threaded structure
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const replies = comments.filter((c) => c.parent_comment_id);
  const getReplies = (parentId) => replies.filter((r) => r.parent_comment_id === parentId);

  return (
    <div className="flex flex-col" style={{ maxHeight: "500px" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="flex items-center gap-2">
          <MessageSquare size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>COMMENTS · {topLevel.length}</p>
        </div>
      </div>

      {/* Comment list */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: "200px" }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : topLevel.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={24} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 8px" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>BE THE FIRST TO COMMENT</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {topLevel.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div
                  className="p-3"
                  style={{
                    background: comment.pinned ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.5)",
                    border: `0.5px solid ${comment.pinned ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}`,
                  }}
                >
                  {comment.pinned && (
                    <div className="flex items-center gap-1 mb-1">
                      <Pin size={9} style={{ color: "#D1FF26" }} />
                      <span className="font-mono text-[7px] tracking-widest" style={{ color: "#D1FF26" }}>PINNED</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex items-center justify-center w-6 h-6 text-[9px] font-bold flex-shrink-0" style={{ background: comment.is_host ? "#D1FF26" : "rgba(209,255,38,0.12)", color: comment.is_host ? "#05070A" : "#D1FF26", borderRadius: "50%" }}>
                      {comment.author_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: comment.is_host ? "#D1FF26" : "#F5F5F7" }}>
                      {comment.author_name.toUpperCase()}{comment.is_host && " · HOST"}
                    </span>
                    <span className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>{fmtTimeAgo(comment.created_date)}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>{comment.body}</p>
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 mt-2 font-mono text-[8px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]"
                    style={{ color: "#8A8F98" }}
                  >
                    <Reply size={9} /> Reply
                  </button>
                </div>

                {/* Reply input */}
                <AnimatePresence>
                  {replyTo === comment.id && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={(e) => handleReply(e, comment.id)}
                      className="flex items-center gap-2 ml-6 overflow-hidden"
                    >
                      <input
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write a reply…"
                        className="flex-1 px-3 py-2 text-[16px] sm:text-xs outline-none"
                        style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                      />
                      <button type="submit" disabled={posting || !replyBody.trim()} className="flex items-center justify-center w-8 h-8 transition-all disabled:opacity-30" style={{ background: "#D1FF26" }}>
                        <Send size={12} style={{ color: "#05070A" }} />
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Replies */}
                {getReplies(comment.id).map((reply) => (
                  <div key={reply.id} className="flex gap-2 ml-6">
                    <CornerDownRight size={12} className="flex-shrink-0 mt-2" style={{ color: "rgba(138,143,152,0.4)" }} />
                    <div className="flex-1 p-2.5" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[7px] tracking-widest" style={{ color: reply.is_host ? "#D1FF26" : "#F5F5F7" }}>
                          {reply.author_name.toUpperCase()}{reply.is_host && " · HOST"}
                        </span>
                        <span className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>{fmtTimeAgo(reply.created_date)}</span>
                      </div>
                      <p className="text-[11px]" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{reply.body}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="p-3 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 px-3 py-2 text-[16px] sm:text-xs outline-none"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
        />
        <button type="submit" disabled={posting || !body.trim()} className="flex items-center justify-center w-9 h-9 transition-all disabled:opacity-30" style={{ background: "#D1FF26" }}>
          {posting ? <Loader2 size={13} className="animate-spin" style={{ color: "#05070A" }} /> : <Send size={13} style={{ color: "#05070A" }} />}
        </button>
      </form>
    </div>
  );
}