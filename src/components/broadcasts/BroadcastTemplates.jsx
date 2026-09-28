import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText, Plus, Trash2, Check, X, Play, Square } from "lucide-react";
import { proxyMediaUrl } from "@/lib/mediaProxy";

/**
 * BroadcastTemplates — save the current broadcast form as a reusable script
 * template and apply a saved template back into the form.
 *
 * Props:
 *   form   — { messageText, audioUrl, audioDuration, targetAudience, region }
 *   onApply(template) — parent loads the template values into its form
 */
export default function BroadcastTemplates({ form, onApply }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [appliedId, setAppliedId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const previewAudioRef = useRef(null);

  useEffect(() => () => {
    try { if (previewAudioRef.current) previewAudioRef.current.pause(); } catch { /* ignore */ }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }, []);

  const stopPreview = useCallback(() => {
    try { if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null; } } catch { /* ignore */ }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    setPreviewingId(null);
  }, []);

  const preview = useCallback((t) => {
    if (previewingId === t.id) { stopPreview(); return; }
    stopPreview();
    if (t.audio_url) {
      const a = new Audio(proxyMediaUrl(t.audio_url));
      a.onended = () => setPreviewingId(null);
      a.play().then(() => { previewAudioRef.current = a; setPreviewingId(t.id); }).catch(() => setPreviewingId(null));
    } else if (t.message_text && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(t.message_text);
      u.onend = () => setPreviewingId(null);
      u.onerror = () => setPreviewingId(null);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      setPreviewingId(t.id);
    }
  }, [previewingId, stopPreview]);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.BroadcastTemplate.list("-created_date", 50);
      setTemplates(Array.isArray(list) ? list : []);
    } catch { setTemplates([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveTemplate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.BroadcastTemplate.create({
        name: name.trim(),
        message_text: form.messageText || "",
        audio_url: form.audioUrl || "",
        duration_seconds: form.audioDuration || 0,
        target_audience: form.targetAudience || "all",
        region: form.region || "all",
      });
      setName("");
      setNaming(false);
      await load();
    } catch { /* empty */ }
    setSaving(false);
  };

  const apply = (t) => {
    if (onApply) onApply(t);
    setAppliedId(t.id);
    setTimeout(() => setAppliedId(null), 1800);
  };

  const remove = async (id) => {
    try {
      await base44.entities.BroadcastTemplate.delete(id);
      setTemplates((p) => p.filter((x) => x.id !== id));
    } catch { /* empty */ }
  };

  return (
    <div className="p-5" style={{ background: "rgba(10,13,20,0.7)", border: "0.5px solid rgba(66,225,246,0.25)", boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={14} style={{ color: "#42E1F6" }} />
          <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#42E1F6" }}>// SCRIPT TEMPLATES</p>
        </div>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{templates.length} saved</span>
      </div>

      {naming ? (
        <div className="mb-3 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name (e.g. Weather Advisory)"
            autoFocus
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(66,225,246,0.3)", color: "#F5F5F7" }}
          />
          <div className="flex gap-2">
            <button onClick={saveTemplate} disabled={saving || !name.trim()} className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase font-bold disabled:opacity-40" style={{ background: "#42E1F6", color: "#05070A" }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
            </button>
            <button onClick={() => { setNaming(false); setName(""); }} className="flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.3)", color: "#8A8F98" }}>
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setNaming(true)}
          disabled={!form.audioUrl && !form.messageText}
          className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 font-mono text-[9px] tracking-widest uppercase font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: "rgba(66,225,246,0.1)", border: "0.5px solid rgba(66,225,246,0.4)", color: "#42E1F6" }}
        >
          <Plus size={12} /> Save Current as Template
        </button>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4 gap-2">
          <Loader2 size={14} className="animate-spin" style={{ color: "#42E1F6" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING...</span>
        </div>
      ) : templates.length === 0 ? (
        <p className="text-center py-4 font-mono text-[10px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>NO TEMPLATES YET</p>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {templates.map((t) => (
            <div key={t.id} className="p-3" style={{ background: "rgba(5,7,10,0.4)", border: appliedId === t.id ? "0.5px solid rgba(34,197,94,0.5)" : "0.5px solid rgba(138,143,152,0.15)" }}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-xs font-semibold truncate flex-1 min-w-0" style={{ color: "#F5F5F7" }}>{t.name}</p>
                <button onClick={() => remove(t.id)} className="flex-shrink-0 p-0.5" aria-label="Delete template"><Trash2 size={11} style={{ color: "#ef4444" }} /></button>
              </div>
              {t.message_text && <p className="text-[10px] line-clamp-2 mb-2" style={{ color: "#8A8F98" }}>{t.message_text}</p>}
              <div className="flex items-center gap-2">
                <button onClick={() => preview(t)} className="flex items-center justify-center gap-1 px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase font-bold" style={{ background: previewingId === t.id ? "rgba(188,0,255,0.15)" : "rgba(138,143,152,0.08)", border: `0.5px solid ${previewingId === t.id ? "rgba(188,0,255,0.5)" : "rgba(138,143,152,0.25)"}`, color: previewingId === t.id ? "#BC00FF" : "#8A8F98" }}>
                  {previewingId === t.id ? <Square size={10} /> : <Play size={10} />} {previewingId === t.id ? "Stop" : "Preview"}
                </button>
                <button onClick={() => apply(t)} className="flex-1 flex items-center justify-center gap-1 py-1.5 font-mono text-[9px] tracking-widest uppercase font-bold" style={{ background: appliedId === t.id ? "rgba(34,197,94,0.15)" : "rgba(66,225,246,0.1)", border: `0.5px solid ${appliedId === t.id ? "rgba(34,197,94,0.5)" : "rgba(66,225,246,0.3)"}`, color: appliedId === t.id ? "#22c55e" : "#42E1F6" }}>
                  {appliedId === t.id ? <Check size={10} /> : <FileText size={10} />} {appliedId === t.id ? "Applied" : "Use"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}