import React, { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Inline editor for the signed-in instructor to create/update their public
// InstructorProfile (bio, experience, credentials, specializations). Lives on
// the InstructorDashboard "My Profile" tab so instructors populate the data
// that the public profile page renders.
export default function InstructorProfileEditor() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState({
    display_name: "", headline: "", photo_url: "", bio: "",
    specializations: "", credentials: "", experience: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const list = await base44.entities.InstructorProfile.filter({ owner_user_id: user.id }, "-created_date", 1).catch(() => []);
      const p = (list || [])[0];
      if (p) {
        setProfileId(p.id);
        setForm({
          display_name: p.display_name || user.full_name || "",
          headline: p.headline || "",
          photo_url: p.photo_url || "",
          bio: p.bio || "",
          specializations: (p.specializations || []).join(", "),
          credentials: (p.credentials || []).join(", "),
          experience: p.experience || [],
        });
      } else {
        setForm((f) => ({ ...f, display_name: user.full_name || "" }));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    setSaving(true); setFeedback(null);
    const payload = {
      owner_user_id: user.id,
      display_name: form.display_name || user.full_name || "",
      headline: form.headline,
      photo_url: form.photo_url,
      bio: form.bio,
      specializations: form.specializations.split(",").map((s) => s.trim()).filter(Boolean),
      credentials: form.credentials.split(",").map((s) => s.trim()).filter(Boolean),
      experience: form.experience,
    };
    try {
      if (profileId) {
        await base44.entities.InstructorProfile.update(profileId, payload);
      } else {
        const created = await base44.entities.InstructorProfile.create(payload);
        if (created?.id) setProfileId(created.id);
      }
      setFeedback({ ok: true, msg: "Profile saved" });
    } catch (e) {
      setFeedback({ ok: false, msg: e?.response?.data?.error || e.message || "Save failed" });
    } finally { setSaving(false); }
  };

  const addExp = () => setForm((f) => ({ ...f, experience: [...f.experience, { role: "", organization: "", period: "", description: "" }] }));
  const updExp = (i, key, val) => setForm((f) => ({ ...f, experience: f.experience.map((e, x) => x === i ? { ...e, [key]: val } : e) }));
  const delExp = (i) => setForm((f) => ({ ...f, experience: f.experience.filter((_, x) => x !== i) }));

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} /></div>;

  const cls = "w-full px-3 py-2 text-sm outline-none";
  const st = { background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" };

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: feedback.ok ? "rgba(209,255,38,0.08)" : "rgba(239,68,68,0.08)", border: `0.5px solid ${feedback.ok ? "rgba(209,255,38,0.3)" : "rgba(239,68,68,0.3)"}` }}>
          {feedback.ok ? <CheckCircle2 size={12} style={{ color: "#D1FF26" }} /> : <AlertCircle size={12} style={{ color: "#ef4444" }} />}
          <p className="font-mono text-[9px] tracking-wider" style={{ color: feedback.ok ? "#D1FF26" : "#ef4444" }}>{feedback.msg}</p>
        </div>
      )}

      <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>▸ PROFILE DETAILS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Display name" className={cls} style={st} />
          <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Headline (e.g. Senior AI Engineer · 12 yrs)" className={cls} style={st} />
        </div>
        <input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="Photo URL (optional)" className={`${cls} mt-3`} style={st} />
        <input value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })} placeholder="Specializations (comma-separated)" className={`${cls} mt-3`} style={st} />
        <input value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} placeholder="Credentials / certifications (comma-separated)" className={`${cls} mt-3`} style={st} />
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio — share your background and teaching philosophy..." rows={4} className={`${cls} mt-3 resize-y`} style={{ ...st, lineHeight: 1.5 }} />
      </div>

      <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>▸ EXPERIENCE</p>
          <button onClick={addExp} className="flex items-center gap-1 px-2 py-1 font-mono text-[8px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <Plus size={10} /> Add
          </button>
        </div>
        {form.experience.length === 0 ? (
          <p className="font-mono text-[9px] py-4 text-center" style={{ color: "#4A4F58" }}>NO EXPERIENCE ENTRIES YET</p>
        ) : (
          <div className="space-y-3">
            {form.experience.map((e, i) => (
              <div key={i} className="p-3" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>ENTRY {i + 1}</span>
                  <button onClick={() => delExp(i)} className="font-mono text-[9px]" style={{ color: "#ef4444" }}><Trash2 size={12} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <input value={e.role} onChange={(ev) => updExp(i, "role", ev.target.value)} placeholder="Role" className={cls} style={st} />
                  <input value={e.organization} onChange={(ev) => updExp(i, "organization", ev.target.value)} placeholder="Organization" className={cls} style={st} />
                  <input value={e.period} onChange={(ev) => updExp(i, "period", ev.target.value)} placeholder="Period (e.g. 2018–2024)" className={cls} style={st} />
                </div>
                <textarea value={e.description} onChange={(ev) => updExp(i, "description", ev.target.value)} placeholder="Short description..." rows={2} className={`${cls} resize-y`} style={st} />
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold disabled:opacity-50" style={{ background: "#D1FF26", color: "#05070A" }}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Profile
      </button>
    </div>
  );
}