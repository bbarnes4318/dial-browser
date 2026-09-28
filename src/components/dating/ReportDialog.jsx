import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, Loader2, Check, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";

const REASONS = [
  { value: "inappropriate_photo", label: "Inappropriate photo" },
  { value: "harassment", label: "Harassment / threats" },
  { value: "fake_profile", label: "Fake / scam profile" },
  { value: "spam", label: "Spam / solicitation" },
  { value: "underage", label: "Underage member" },
  { value: "other", label: "Other" },
];

// Lets a member flag another dating profile for admin review. The report is
// private — only admins can read DatingReport records (enforced by RLS), and
// it surfaces immediately in the admin dashboard's Flagged Reports panel.
export default function ReportDialog({ profile, myProfile, onClose }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!reason) {
      setError("Pick a reason.");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.DatingReport.create({
        reported_profile_id: profile.id,
        reported_name: profile.full_name,
        reported_by_id: myProfile ? myProfile.id : "",
        reported_by_name: myProfile ? myProfile.full_name : "",
        reason,
        description,
        status: "pending",
      });
      setDone(true);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style={{ background: "rgba(5,7,10,0.85)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          className="w-full max-w-md p-5"
          style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(239,68,68,0.3)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} style={{ color: "#ef4444" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>
                // REPORT {profile.full_name.toUpperCase()}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close">
              <X size={15} style={{ color: "#8A8F98" }} />
            </button>
          </div>

          {done ? (
            <div className="text-center py-6">
              <div className="flex items-center justify-center mb-3">
                <Check size={28} style={{ color: "#D1FF26" }} />
              </div>
              <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>
                REPORT SUBMITTED
              </p>
              <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                Thanks for keeping 1 Call Dating safe. Our team will review this profile privately and take action if needed.
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full py-3 font-mono text-[10px] tracking-widest uppercase"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                Close
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                Flag <span style={{ color: "#F5F5F7" }}>{profile.full_name}</span> for inappropriate behavior. Reports are private — only the admin team sees them.
              </p>
              {error && (
                <div className="mb-3 p-2.5 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                  {error}
                </div>
              )}
              <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>REASON *</p>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className="px-2.5 py-2 font-mono text-[9px] tracking-wide text-left transition-all"
                    style={{
                      background: reason === r.value ? "rgba(239,68,68,0.15)" : "rgba(16,20,29,0.6)",
                      border: `0.5px solid ${reason === r.value ? "rgba(239,68,68,0.5)" : "rgba(138,143,152,0.12)"}`,
                      color: reason === r.value ? "#ef4444" : "#8A8F98",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>DETAILS (OPTIONAL)</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="What happened?"
                className="w-full p-2.5 text-sm outline-none resize-none"
                style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
              />
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase disabled:opacity-40"
                style={{ background: "#ef4444", color: "#05070A" }}
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Flag size={13} />} Submit Report
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}