import React, { useState, useEffect, useCallback } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { base44 } from "@/api/base44Client";
import { Loader2, Radio, Send, Calendar, X, CheckCircle2, AlertCircle, Users, Play, Ban } from "lucide-react";
import BroadcastRecorder from "@/components/broadcasts/BroadcastRecorder";
import BroadcastAnalytics from "@/components/broadcasts/BroadcastAnalytics";
import BroadcastTemplates from "@/components/broadcasts/BroadcastTemplates";
import RecipientPreviewModal from "@/components/broadcasts/RecipientPreviewModal";
import { Users as UsersIcon } from "lucide-react";

// Earliest selectable launch time for the scheduler (now, in datetime-local format)
const nowLocalInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Subscribers" },
  { value: "medical", label: "Medical" },
  { value: "dental", label: "Dental" },
  { value: "real_estate", label: "Real Estate" },
  { value: "construction", label: "Construction" },
  { value: "grocery", label: "Grocery" },
  { value: "weather", label: "Weather" },
  { value: "music", label: "Music" },
  { value: "jobs", label: "Jobs" },
  { value: "bill_payment", label: "Bill Payment" },
  { value: "marketplace", label: "Marketplace" },
];

const REGION_OPTIONS = [
  { value: "all", label: "All Regions" },
  { value: "northeast", label: "Northeast" },
  { value: "southeast", label: "Southeast" },
  { value: "midwest", label: "Midwest" },
  { value: "southwest", label: "Southwest" },
  { value: "west", label: "West" },
  { value: "national", label: "National" },
];

const STATUS_STYLES = {
  draft: { color: "#8A8F98", bg: "rgba(138,143,152,0.1)" },
  scheduled: { color: "#A4FF00", bg: "rgba(164,255,0,0.1)" },
  sending: { color: "#BC00FF", bg: "rgba(188,0,255,0.1)" },
  sent: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  failed: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  cancelled: { color: "#8A8F98", bg: "rgba(138,143,152,0.05)" },
};

export default function VoiceBroadcastDashboard() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [targetAudience, setTargetAudience] = useState("all");
  const [region, setRegion] = useState("all");
  const [scheduledTime, setScheduledTime] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [previewGroup, setPreviewGroup] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.ContactGroup.list("-created_date", 200);
        setGroups(Array.isArray(list) ? list : []);
      } catch { setGroups([]); }
    })();
  }, []);

  const loadBroadcasts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await base44.entities.VoiceBroadcast.list("-created_date", 50);
      setBroadcasts(result || []);
    } catch {
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBroadcasts();
  }, [loadBroadcasts]);

  const resetForm = () => {
    setTitle("");
    setMessageText("");
    setAudioUrl(null);
    setAudioDuration(0);
    setTargetAudience("all");
    setRegion("all");
    setScheduledTime("");
  };

  const handleCreate = async (sendNow) => {
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Please enter a title for your broadcast.");
      return;
    }
    if (!audioUrl) {
      setError("Please record a voice message first.");
      return;
    }
    if (sendNow && scheduledTime) {
      setError("Choose either Send Now or Schedule — not both.");
      return;
    }

    setSubmitting(true);
    try {
      let creatorName = "Admin";
      try {
        const me = await base44.auth.me();
        creatorName = me.full_name || me.email || "Admin";
      } catch { /* default */ }

      const status = sendNow ? "draft" : scheduledTime ? "scheduled" : "draft";
      const scheduledISO = scheduledTime ? new Date(scheduledTime).toISOString() : null;

      const broadcast = await base44.entities.VoiceBroadcast.create({
        title: title.trim(),
        message_text: messageText.trim(),
        audio_url: audioUrl,
        duration_seconds: audioDuration,
        target_audience: targetAudience,
        region,
        scheduled_time: scheduledISO,
        status,
        created_by_name: creatorName,
      });

      if (sendNow) {
        const response = await base44.functions.invoke("sendVoiceBroadcast", {
          action: "send",
          broadcast_id: broadcast.id,
        });
        const data = response.data || response;
        setSuccess(`Broadcast sent to ${data.sent || 0} subscribers (${data.failed || 0} failed).`);
      } else if (scheduledTime) {
        setSuccess("Broadcast scheduled. It will appear in the list below.");
      } else {
        setSuccess("Broadcast saved as draft. Click Send Now to deliver it.");
      }

      resetForm();
      await loadBroadcasts();
    } catch (err) {
      setError(err.message || "Failed to create broadcast. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNow = async (id) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await base44.functions.invoke("sendVoiceBroadcast", {
        action: "send",
        broadcast_id: id,
      });
      const data = response.data || response;
      setSuccess(`Broadcast sent to ${data.sent || 0} subscribers (${data.failed || 0} failed).`);
      await loadBroadcasts();
    } catch (err) {
      setError(err.message || "Failed to send broadcast.");
    } finally {
      setSubmitting(false);
    }
  };

  const applyTemplate = (t) => {
    setTitle(t.name || "");
    if (typeof t.message_text === "string") setMessageText(t.message_text);
    if (t.audio_url) { setAudioUrl(t.audio_url); setAudioDuration(t.duration_seconds || 0); }
    if (t.target_audience) setTargetAudience(t.target_audience);
    if (t.region) setRegion(t.region);
  };

  const handleCancel = async (id) => {
    setError(null);
    setSuccess(null);
    try {
      await base44.functions.invoke("sendVoiceBroadcast", {
        action: "cancel",
        broadcast_id: id,
      });
      setSuccess("Broadcast cancelled.");
      await loadBroadcasts();
    } catch (err) {
      setError(err.message || "Failed to cancel broadcast.");
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " EST";
  };

  const inputStyle = {
    background: "rgba(16,20,29,0.6)",
    border: "0.5px solid rgba(164,255,0,0.2)",
    color: "#F5F5F7",
  };

  const labelStyle = {
    color: "#8A8F98",
  };

  return (
    <div className="min-h-screen relative" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(188,0,255,0.08) 0%, transparent 55%)" }} />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "rgba(188,0,255,0.1)", border: "0.5px solid rgba(188,0,255,0.4)" }}>
            <Radio size={20} style={{ color: "#BC00FF" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#F5F5F7" }}>Voice Broadcast Dashboard</h1>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
              Record audio and send mass voice alerts to opted-in subscribers
            </p>
          </div>
        </div>

        {/* Get Connected banner */}
        <div className="mb-8">
          <img
            src="https://media.base44.com/images/public/6a422320311efd575ae6536c/358f988c2_Gemini_Generated_Image_et9b5cet9b5cet9b.jpg"
            alt="Get Connected, Stay Connected — Dial Now Browse Now"
            style={{ width: "100%", height: "auto", display: "block", borderRadius: "2px" }}
          />
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
            <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 p-3" style={{ background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.3)" }}>
            <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
            <p className="text-sm" style={{ color: "#22c55e" }}>{success}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Create Broadcast ── */}
          <div className="p-6 space-y-5" style={{ background: "rgba(10,13,20,0.7)", border: "0.5px solid rgba(164,255,0,0.25)", boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#A4FF00" }}>// NEW BROADCAST</p>

            <div className="space-y-2">
              <label className="font-mono text-[9px] tracking-widest uppercase block" style={labelStyle}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Severe Weather Advisory"
                className="w-full px-3 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[9px] tracking-widest uppercase block" style={labelStyle}>
                Message Text (optional)
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Brief text summary included in the SMS alongside the audio link"
                rows={2}
                className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                style={inputStyle}
              />
            </div>

            <BroadcastRecorder
              onRecorded={(url, dur) => {
                setAudioUrl(url);
                setAudioDuration(dur || 0);
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-mono text-[9px] tracking-widest uppercase block" style={labelStyle}>Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm outline-none cursor-pointer"
                  style={inputStyle}
                >
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ background: "#10141D" }}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[9px] tracking-widest uppercase block" style={labelStyle}>Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm outline-none cursor-pointer"
                  style={inputStyle}
                >
                  {REGION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ background: "#10141D" }}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[9px] tracking-widest uppercase block" style={labelStyle}>
                Schedule for Later (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={nowLocalInput()}
                className="w-full px-3 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
              {scheduledTime && (
                <p className="font-mono text-[9px] tracking-wider mt-1" style={{ color: "#A4FF00" }}>
                  ▸ Launches automatically at {formatTime(new Date(scheduledTime).toISOString())}
                </p>
              )}
            </div>

            {/* Verify uploaded contact list */}
            <div className="space-y-2 pt-1" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
              <label className="font-mono text-[9px] tracking-widest uppercase block pt-3" style={labelStyle}>
                Verify Uploaded List
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm outline-none cursor-pointer"
                  style={inputStyle}
                >
                  <option value="" style={{ background: "#10141D" }}>Select a contact group…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id} style={{ background: "#10141D" }}>
                      {g.name} ({g.member_count || 0})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setPreviewGroup(groups.find((g) => g.id === selectedGroupId) || null)}
                  disabled={!selectedGroupId}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: "rgba(66,225,246,0.1)", border: "0.5px solid rgba(66,225,246,0.4)", color: "#42E1F6" }}
                >
                  <UsersIcon size={12} /> Preview
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleCreate(true)}
                disabled={submitting || !title.trim() || !audioUrl}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase font-medium transition-all hover:shadow-[0_0_18px_rgba(164,255,0,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "#A4FF00", color: "#05070A" }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send Now
              </button>
              <button
                onClick={() => handleCreate(false)}
                disabled={submitting || !title.trim() || !audioUrl || !scheduledTime}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_18px_rgba(188,0,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "rgba(188,0,255,0.12)", border: "0.5px solid rgba(188,0,255,0.4)", color: "#BC00FF" }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                Schedule
              </button>
            </div>
          </div>

          {/* ── Recent Broadcasts ── */}
          <div className="p-6" style={{ background: "rgba(10,13,20,0.7)", border: "0.5px solid rgba(188,0,255,0.25)", boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#BC00FF" }}>// RECENT BROADCASTS</p>
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{broadcasts.length} total</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2">
                <Loader2 size={20} className="animate-spin" style={{ color: "#BC00FF" }} />
                <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING...</span>
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-12">
                <Users size={28} className="mx-auto mb-3" style={{ color: "rgba(138,143,152,0.3)" }} />
                <p className="text-sm" style={{ color: "rgba(138,143,152,0.5)" }}>No broadcasts yet</p>
                <p className="font-mono text-[10px] mt-1" style={{ color: "rgba(138,143,152,0.3)" }}>Create your first broadcast</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {broadcasts.map((b) => {
                  const statusStyle = STATUS_STYLES[b.status] || STATUS_STYLES.draft;
                  const canSend = b.status === "draft" || b.status === "scheduled" || b.status === "failed";
                  const canCancel = b.status === "scheduled" || b.status === "draft";
                  return (
                    <div key={b.id} className="p-3" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#F5F5F7" }}>{b.title}</p>
                          <p className="font-mono text-[9px] mt-0.5" style={{ color: "#8A8F98" }}>
                            {AUDIENCE_OPTIONS.find((o) => o.value === b.target_audience)?.label || b.target_audience} · {REGION_OPTIONS.find((o) => o.value === b.region)?.label || b.region}
                          </p>
                        </div>
                        <span
                          className="flex-shrink-0 px-2 py-0.5 font-mono text-[8px] tracking-widest uppercase rounded"
                          style={{ color: statusStyle.color, background: statusStyle.bg }}
                        >
                          {b.status}
                        </span>
                      </div>

                      {b.audio_url && (
                        <div className="flex items-center gap-2 mb-2">
                          <audio controls src={proxyMediaUrl(b.audio_url)} className="h-7 flex-1" style={{ filter: "invert(0.85) hue-rotate(70deg)", maxWidth: "200px" }} />
                        </div>
                      )}

                      <div className="flex items-center gap-3 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                        {b.status === "sent" && (
                          <span className="flex items-center gap-1">
                            <Users size={9} /> {b.sent_count}/{b.total_recipients} sent
                          </span>
                        )}
                        {b.scheduled_time && (
                          <span className="flex items-center gap-1">
                            <Calendar size={9} /> {formatTime(b.scheduled_time)}
                          </span>
                        )}
                        {b.sent_at && (
                          <span className="flex items-center gap-1">
                            <Send size={9} /> {formatTime(b.sent_at)}
                          </span>
                        )}
                      </div>

                      {(canSend || canCancel) && (
                        <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                          {canSend && (
                            <button
                              onClick={() => handleSendNow(b.id)}
                              disabled={submitting}
                              className="flex items-center gap-1 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
                              style={{ background: "rgba(164,255,0,0.1)", border: "0.5px solid rgba(164,255,0,0.4)", color: "#A4FF00" }}
                            >
                              <Send size={10} /> Send Now
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={submitting}
                              className="flex items-center gap-1 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
                              style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
                            >
                              <Ban size={10} /> Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Analytics + Templates ── */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <BroadcastAnalytics />
          <BroadcastTemplates
            form={{ messageText, audioUrl, audioDuration, targetAudience, region }}
            onApply={applyTemplate}
          />
        </div>
      </div>

      {previewGroup && (
        <RecipientPreviewModal group={previewGroup} onClose={() => setPreviewGroup(null)} />
      )}
    </div>
  );
}