import React, { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

export default function SaveServiceButton({
  serviceName,
  serviceType = "voice_service",
  referenceId,
  dialCode = "",
  linkUrl = "",
  description = "",
  iconEmoji = "📞",
  category = "",
}) {
  const [saved, setSaved] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!referenceId) { setLoading(false); return; }
      try {
        const existing = await base44.entities.SavedService.filter(
          { reference_id: referenceId, service_type: serviceType },
          "-created_date",
          1
        );
        if (existing && existing.length > 0) {
          setSaved(true);
          setRecordId(existing[0].id);
        }
      } catch { /* not authenticated */ }
      setLoading(false);
    };
    check();
  }, [referenceId, serviceType]);

  const toggle = async () => {
    const isAuthed = await base44.auth.isAuthenticated();
    if (!isAuthed) {
      openRegistrationModal();
      return;
    }
    setToggling(true);
    try {
      if (saved && recordId) {
        await base44.entities.SavedService.delete(recordId);
        setSaved(false);
        setRecordId(null);
      } else {
        const record = await base44.entities.SavedService.create({
          service_name: serviceName,
          service_type: serviceType,
          reference_id: referenceId,
          dial_code: dialCode,
          link_url: linkUrl,
          description: description,
          icon_emoji: iconEmoji,
          category: category,
        });
        setSaved(true);
        setRecordId(record.id);
      }
    } catch { /* ignore */ }
    setToggling(false);
  };

  if (loading) {
    return (
      <button disabled className="flex items-center justify-center gap-2 px-6 py-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <Loader2 size={16} className="animate-spin" style={{ color: "#8A8F98" }} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={toggling}
      className="flex items-center justify-center gap-2 px-6 py-4 transition-all"
      style={{
        background: saved ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
        border: `0.5px solid ${saved ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.2)"}`,
        boxShadow: saved ? "0 0 20px rgba(209,255,38,0.15)" : "none",
      }}
    >
      {toggling ? (
        <Loader2 size={16} className="animate-spin" style={{ color: saved ? "#D1FF26" : "#8A8F98" }} />
      ) : saved ? (
        <BookmarkCheck size={16} style={{ color: "#D1FF26" }} />
      ) : (
        <Bookmark size={16} style={{ color: "#8A8F98" }} />
      )}
      <span className="font-mono text-[10px] tracking-widest" style={{ color: saved ? "#D1FF26" : "#8A8F98" }}>
        {saved ? "BOOKMARKED" : "BOOKMARK"}
      </span>
    </button>
  );
}