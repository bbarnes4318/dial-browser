import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, Plus, Users, Trash2, X, Send, PhoneCall, Check, AlertCircle, Pencil, UserPlus, Crown, FileSpreadsheet,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import BroadcastDialog from "@/components/phone/BroadcastDialog";
import ContactListImporter from "@/components/phone/ContactListImporter";
import GroupCallStatus from "@/components/phone/GroupCallStatus";

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // group or "new"
  const [form, setForm] = useState({ name: "", description: "", member_contact_ids: [], tags: [] });
  const [tagFilter, setTagFilter] = useState(null); // active tag filter
  const [tagDraft, setTagDraft] = useState(""); // tag being typed in the editor
  const [saving, setSaving] = useState(false);
  const [broadcast, setBroadcast] = useState(null); // group being broadcast to
  const [importing, setImporting] = useState(false); // show contact-list importer
  const [calling, setCalling] = useState(null); // group currently calling
  const [callResult, setCallResult] = useState(null); // { ok, dialed?, error?, gid }

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [g, c] = await Promise.all([
        base44.entities.ContactGroup.filter({ created_by_id: user.id }, "-created_date", 200),
        base44.entities.Contact.filter({ created_by_id: user.id }, "-created_date", 500),
      ]);
      const gs = (Array.isArray(g) ? g : []).sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
      setGroups(gs);
      setContacts(Array.isArray(c) ? c : []);
    } catch { /* empty */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", description: "", member_contact_ids: [], tags: [] }); setTagDraft(""); setEditing("new"); };
  const openEdit = (g) => { setForm({ name: g.name || "", description: g.description || "", member_contact_ids: g.member_contact_ids || [], tags: g.tags || [] }); setTagDraft(""); setEditing(g); };
  const close = () => setEditing(null);

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (!t) return;
    setForm((f) => (f.tags.includes(t) ? f : { ...f, tags: [...f.tags, t] }));
    setTagDraft("");
  };
  const removeTag = (t) => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  const toggleMember = (id) => setForm((f) => {
    const set = new Set(f.member_contact_ids);
    if (set.has(id)) set.delete(id); else set.add(id);
    return { ...f, member_contact_ids: [...set] };
  });

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim(), member_contact_ids: form.member_contact_ids, member_count: form.member_contact_ids.length, tags: form.tags };
      if (editing === "new") await base44.entities.ContactGroup.create(payload);
      else await base44.entities.ContactGroup.update(editing.id, payload);
      await load();
      close();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const remove = async (g) => {
    try { await base44.entities.ContactGroup.delete(g.id); setGroups((p) => p.filter((x) => x.id !== g.id)); } catch {}
  };

  const memberContacts = (g) => (g.member_contact_ids || []).map((id) => contacts.find((c) => c.id === id)).filter(Boolean);

  const allTags = [...new Set(groups.flatMap((g) => g.tags || []))].sort();
  const visibleGroups = tagFilter ? groups.filter((g) => (g.tags || []).includes(tagFilter)) : groups;

  const startCall = async (g) => {
    const members = memberContacts(g);
    if (members.length === 0) return;
    setCalling(g); setCallResult(null);
    try {
      const res = await base44.functions.invoke("start-group-call", { phones: members.map((m) => m.phone), group_name: g.name });
      const d = res?.data || res;
      if (d?.error) setCallResult({ ok: false, error: d.error, gid: g.id });
      else setCallResult({ ok: true, dialed: d.dialed, conference: d.conference, gid: g.id });
    } catch (e) {
      setCallResult({ ok: false, error: e?.response?.data?.error || e?.message || "Failed" });
    }
    setCalling(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 pt-8 pb-24">
        <Link to="/phone" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Dial Phone
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// GROUPS</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl" style={{ color: "#F5F5F7" }}>
            Contact <span style={{ color: "#D1FF26" }}>Groups</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: "#8A8F98" }}>Bundle contacts, then broadcast a text or ring everyone at once with a group call.</p>
        </motion.div>

        <div className="flex justify-end gap-2 mb-5">
          <button onClick={() => setImporting(true)} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}>
            <FileSpreadsheet size={14} /> Import List
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>
            <Plus size={14} /> New Group
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.15)" }}>
            <Users size={28} style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO GROUPS YET</p>
            <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
              <Plus size={12} /> Create a group
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-1 pb-3" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>FILTER:</span>
                <button
                  onClick={() => setTagFilter(null)}
                  className="font-mono text-[9px] px-2 py-1 tracking-widest uppercase"
                  style={{ background: !tagFilter ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${!tagFilter ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`, color: !tagFilter ? "#D1FF26" : "#8A8F98" }}
                >
                  All
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTagFilter(tagFilter === t ? null : t)}
                    className="font-mono text-[9px] px-2 py-1 tracking-widest uppercase"
                    style={{ background: tagFilter === t ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${tagFilter === t ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`, color: tagFilter === t ? "#D1FF26" : "#8A8F98" }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            {visibleGroups.length === 0 && tagFilter && (
              <p className="text-center py-8 font-mono text-[10px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>NO GROUPS WITH TAG "{tagFilter.toUpperCase()}"</p>
            )}
            {visibleGroups.map((g) => {
              const members = memberContacts(g);
              return (
                <div key={g.id} className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{g.name}</p>
                      <p className="font-mono text-[10px] mt-0.5" style={{ color: "#8A8F98" }}>{members.length} member{members.length === 1 ? "" : "s"}{g.description ? ` · ${g.description}` : ""}</p>
                      {(g.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {g.tags.map((t) => (
                            <button
                              key={t}
                              onClick={() => setTagFilter(tagFilter === t ? null : t)}
                              className="font-mono text-[8px] px-1.5 py-0.5 tracking-wider uppercase"
                              style={{ background: "rgba(66,225,246,0.1)", border: "0.5px solid rgba(66,225,246,0.3)", color: "#42E1F6" }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(g)} title="Edit" className="w-8 h-8 flex items-center justify-center hover:bg-[rgba(138,143,152,0.1)]" style={{ border: "0.5px solid rgba(138,143,152,0.2)" }}><Pencil size={12} style={{ color: "#8A8F98" }} /></button>
                      <button onClick={() => remove(g)} title="Delete" className="w-8 h-8 flex items-center justify-center hover:bg-[rgba(239,68,68,0.1)]" style={{ border: "0.5px solid rgba(239,68,68,0.2)" }}><Trash2 size={12} style={{ color: "#ef4444" }} /></button>
                    </div>
                  </div>
                  {members.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {members.slice(0, 8).map((m) => (
                        <span key={m.id} className="font-mono text-[9px] px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>{m.name}</span>
                      ))}
                      {members.length > 8 && <span className="font-mono text-[9px] px-2 py-1" style={{ color: "#8A8F98" }}>+{members.length - 8} more</span>}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setBroadcast({ ...g, _members: members })} disabled={members.length === 0} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold disabled:opacity-40" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}>
                      <Send size={12} /> Broadcast SMS
                    </button>
                    <button onClick={() => startCall(g)} disabled={members.length === 0 || calling} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold disabled:opacity-40" style={{ background: "rgba(66,225,246,0.1)", border: "0.5px solid rgba(66,225,246,0.4)", color: "#42E1F6" }}>
                      {calling?.id === g.id ? <Loader2 size={12} className="animate-spin" /> : <PhoneCall size={12} />} Group Call
                    </button>
                  </div>
                  {callResult && callResult.gid === g.id && !calling && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {callResult.ok ? <Check size={12} style={{ color: "#D1FF26" }} /> : <AlertCircle size={12} style={{ color: "#ef4444" }} />}
                      <p className="font-mono text-[9px]" style={{ color: callResult.ok ? "#D1FF26" : "#ef4444" }}>
                        {callResult.ok ? `Dialing ${callResult.dialed} members into a conference bridge.` : callResult.error}
                      </p>
                    </div>
                  )}
                  {callResult && callResult.ok && callResult.gid === g.id && callResult.conference && !calling && (
                    <GroupCallStatus conference={callResult.conference} expected={callResult.dialed} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={close}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[88vh] flex flex-col p-6" style={{ background: "#10141d", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>{editing === "new" ? "// NEW GROUP" : "// EDIT GROUP"}</p>
              <button onClick={close}><X size={16} style={{ color: "#8A8F98" }} /></button>
            </div>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Group name (e.g. Family)" className="w-full bg-transparent text-sm outline-none px-3 py-2.5 mb-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }} />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="w-full bg-transparent text-sm outline-none px-3 py-2.5 mb-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }} />
            <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>TAGS · INDUSTRY / REGION</p>
            <div className="flex gap-2 mb-2">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="e.g. healthcare, northeast"
                className="flex-1 bg-transparent text-sm outline-none px-3 py-2"
                style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
              />
              <button onClick={addTag} className="flex items-center justify-center px-3 font-mono text-[9px] tracking-widest uppercase font-bold" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}>
                <Plus size={12} /> Add
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {form.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 font-mono text-[9px] px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}>
                    {t}
                    <button onClick={() => removeTag(t)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>MEMBERS · {form.member_contact_ids.length} SELECTED</p>
            <div className="flex-1 overflow-y-auto space-y-1.5 mb-4" style={{ maxHeight: 240 }}>
              {contacts.length === 0 ? (
                <Link to="/address-book" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px]" style={{ border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}>
                  <UserPlus size={12} /> Add contacts first
                </Link>
              ) : contacts.map((c) => {
                const on = form.member_contact_ids.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleMember(c.id)} className="w-full flex items-center gap-3 px-3 py-2 text-left" style={{ background: on ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.5)", border: `0.5px solid ${on ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}` }}>
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0" style={{ background: on ? "#D1FF26" : "transparent", border: `0.5px solid ${on ? "#D1FF26" : "rgba(138,143,152,0.4)"}`, borderRadius: 4 }}>
                      {on && <Check size={12} style={{ color: "#05070A" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-xs truncate" style={{ color: "#F5F5F7" }}>{c.name}</p>
                      <p className="font-mono text-[10px] truncate" style={{ color: "#8A8F98" }}>{c.phone}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={save} disabled={saving || !form.name.trim()} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Group
            </button>
          </motion.div>
        </div>
      )}

      {/* Broadcast dialog */}
      {broadcast && (
        <BroadcastDialog
          contacts={broadcast._members}
          title={`Broadcast · ${broadcast.name}`}
          onClose={() => setBroadcast(null)}
        />
      )}

      {/* Spreadsheet contact-list importer */}
      {importing && (
        <ContactListImporter
          existingGroups={groups}
          onDone={() => load()}
          onClose={() => setImporting(false)}
        />
      )}
    </div>
  );
}