import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Square, Eye, UserX, Send, X, Loader2,
  ChevronDown, AlertCircle,
} from "lucide-react";

/**
 * BulkActionBar — appears when applicants are selected in ManageApplicantsDialog.
 * Actions: Mark as Reviewed, Archive, Send Status Update SMS.
 */
export default function BulkActionBar({ selectedCount, onClear, onMarkReviewed, onArchive, onSendUpdates }) {
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async (status) => {
    setShowSendMenu(false);
    setSending(true);
    try {
      await onSendUpdates(status);
    } finally {
      setSending(false);
    }
  };

  if (selectedCount === 0) return null;

  const btnBase = "flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="sticky bottom-0 z-10"
    >
      <div className="flex items-center gap-2 p-3 flex-wrap" style={{ background: "rgba(5,7,10,0.95)", borderTop: "0.5px solid rgba(209,255,38,0.3)", backdropFilter: "blur(12px)" }}>
        {/* Selection count */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center justify-center w-7 h-7" style={{ background: "rgba(209,255,38,0.15)", borderRadius: "50%" }}>
            <CheckSquare size={14} style={{ color: "#D1FF26" }} />
          </div>
          <span className="font-mono text-[10px] tracking-widest font-bold" style={{ color: "#D1FF26" }}>
            {selectedCount} SELECTED
          </span>
        </div>

        <div className="h-6 w-px" style={{ background: "rgba(209,255,38,0.15)" }} />

        {/* Actions */}
        <button
          onClick={onMarkReviewed}
          disabled={sending}
          className={btnBase}
          style={{ background: "rgba(96,165,250,0.1)", border: "0.5px solid rgba(96,165,250,0.3)", color: "#60A5FA" }}
        >
          <Eye size={11} /> Mark Reviewed
        </button>

        <button
          onClick={onArchive}
          disabled={sending}
          className={btnBase}
          style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.25)", color: "#ef4444" }}
        >
          <UserX size={11} /> Archive
        </button>

        {/* Send status update SMS — dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSendMenu(!showSendMenu)}
            disabled={sending}
            className={btnBase}
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          >
            {sending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            {sending ? "Sending…" : "Send Update"}
            {!sending && <ChevronDown size={9} style={{ transform: showSendMenu ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />}
          </button>
          <AnimatePresence>
            {showSendMenu && !sending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-2 left-0 w-56 p-2"
                style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
              >
                <p className="font-mono text-[8px] tracking-widest mb-2 px-1" style={{ color: "#8A8F98" }}>// SEND SMS STATUS UPDATE</p>
                {[
                  { status: "viewed", label: "Application Reviewed", desc: "We've reviewed your application" },
                  { status: "shortlisted", label: "Shortlisted", desc: "You've been shortlisted!" },
                  { status: "interview_requested", label: "Interview Requested", desc: "We'd like to schedule an interview" },
                  { status: "hired", label: "Offer Extended", desc: "Congratulations! We'd like to offer you the position" },
                  { status: "rejected", label: "Not Selected", desc: "Moved forward with other candidates" },
                  { status: "archived", label: "Application Archived", desc: "Your application has been archived" },
                ].map((opt) => (
                  <button
                    key={opt.status}
                    onClick={() => handleSend(opt.status)}
                    className="w-full text-left p-2 transition-colors hover:bg-[rgba(209,255,38,0.06)]"
                  >
                    <p className="text-[11px] font-semibold" style={{ color: "#F5F5F7" }}>{opt.label}</p>
                    <p className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>"{opt.desc}"</p>
                  </button>
                ))}
                <div className="flex items-center gap-1.5 mt-2 pt-2 px-1" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <AlertCircle size={9} style={{ color: "rgba(138,143,152,0.5)" }} />
                  <p className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>Sends to {selectedCount} applicant{selectedCount === 1 ? "" : "s"}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clear selection */}
        <button
          onClick={onClear}
          disabled={sending}
          className="flex items-center gap-1 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all ml-auto"
          style={{ color: "#8A8F98" }}
        >
          <X size={11} /> Clear
        </button>
      </div>
    </motion.div>
  );
}