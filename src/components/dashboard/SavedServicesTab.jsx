import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkX, Phone, ExternalLink, Search, Loader2, Plus, X, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

const TYPE_ICONS = {
  voice_service: "🎙️",
  grocery_list: "🛒",
  host_profile: "👤",
  dial_service: "📞",
  marketplace_listing: "📦",
  contractor: "🔨",
};

const TYPE_LABELS = {
  voice_service: "Voice Service",
  grocery_list: "Grocery List",
  host_profile: "Host Profile",
  dial_service: "Dial Service",
  marketplace_listing: "Marketplace",
  contractor: "Contractor",
};

export default function SavedServicesTab() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [name, setName] = useState("");
  const [type, setType] = useState("voice_service");
  const [dialCode, setDialCode] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("📞");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.SavedService.list("-created_date", 100);
      setSaved(res || []);
    } catch (e) {
      setSaved([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.SavedService.create({
        service_name: name.trim(),
        service_type: type,
        dial_code: dialCode.trim(),
        link_url: linkUrl.trim(),
        description: desc.trim(),
        icon_emoji: emoji,
        category: category.trim(),
      });
      setName(""); setDialCode(""); setLinkUrl(""); setDesc(""); setEmoji("📞"); setCategory("");
      setShowAdd(false);
      loadSaved();
    } catch (err) {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.SavedService.delete(id);
      setSaved((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {}
  };

  const filtered = saved.filter((s) => {
    const matchesType = filter === "all" || s.service_type === filter;
    const q = query.toLowerCase();
    const matchesQuery = !q ||
      (s.service_name || "").toLowerCase().includes(q) ||
      (s.description || "").toLowerCase().includes(q) ||
      (s.category || "").toLowerCase().includes(q);
    return matchesType && matchesQuery;
  });

  const types = ["all", ...new Set(saved.map((s) => s.service_type))];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Bookmark size={18} style={{ color: "#D1FF26" }} />
          <h2 className="font-heading font-bold text-xl" style={{ color: "#F5F5F7" }}>Saved Services</h2>
          <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            {saved.length}
          </span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest font-bold transition-all"
          style={{ background: showAdd ? "rgba(16,20,29,0.8)" : "#D1FF26", color: showAdd ? "#D1FF26" : "#05070A", border: "0.5px solid rgba(209,255,38,0.3)" }}
        >
          {showAdd ? <><X size={12} /> CANCEL</> : <><Plus size={12} /> ADD BOOKMARK</>}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleSave} className="p-5 space-y-4" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>SERVICE NAME *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Dr. Smith, Weather Lookup" className="w-full px-3 py-2.5 text-sm focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>TYPE</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2.5 text-sm focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>DIAL CODE</label>
                  <input value={dialCode} onChange={(e) => setDialCode(e.target.value)} placeholder="*101#" className="w-full px-3 py-2.5 font-mono text-sm focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>LINK URL</label>
                  <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/directory or /host/123" className="w-full px-3 py-2.5 font-mono text-sm focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>CATEGORY</label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Medical, Music..." className="w-full px-3 py-2.5 text-sm focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>ICON EMOJI</label>
                  <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="📞" className="w-full px-3 py-2.5 text-sm focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NOTES</label>
                <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Why did you save this?" className="w-full px-3 py-2.5 text-sm focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
              </div>
              <button type="submit" disabled={saving || !name.trim()} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest font-bold disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <><Bookmark size={13} /> SAVE BOOKMARK</>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
          <Search size={14} style={{ color: "#8A8F98" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saved services…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F5F5F7" }} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {types.map((t) => (
            <button key={t} onClick={() => setFilter(t)} className="px-3 py-2.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap transition-all" style={{ background: filter === t ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${filter === t ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: filter === t ? "#D1FF26" : "#8A8F98" }}>
              {t === "all" ? "ALL" : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 p-8" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
          <Bookmark size={48} className="mx-auto mb-4" style={{ color: "rgba(209,255,38,0.2)" }} />
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO SAVED SERVICES YET</p>
          <p className="text-sm" style={{ color: "rgba(138,143,152,0.6)" }}>Bookmark your favorite services for quick access.</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>
            <Plus size={12} /> ADD YOUR FIRST BOOKMARK
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((item) => {
              const emoji = item.icon_emoji || TYPE_ICONS[item.service_type] || "📞";
              const hasLink = item.link_url || item.dial_code;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative p-5 transition-all hover:border-[rgba(209,255,38,0.4)]"
                  style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}
                >
                  {/* Delete */}
                  <button onClick={() => handleDelete(item.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <BookmarkX size={14} style={{ color: "#8A8F98" }} />
                  </button>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{item.service_name}</p>
                      <span className="font-mono text-[7px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>{TYPE_LABELS[item.service_type] || item.service_type}</span>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs mb-3" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{item.description}</p>
                  )}

                  {item.category && (
                    <span className="inline-block font-mono text-[7px] tracking-widest px-2 py-0.5 mb-3" style={{ background: "rgba(209,255,38,0.06)", color: "#8A8F98" }}>
                      {item.category.toUpperCase()}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {item.dial_code && (
                      <a href={`tel:${item.dial_code}`} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest font-bold transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                        <Phone size={11} /> {item.dial_code}
                      </a>
                    )}
                    {item.link_url && (
                      <Link to={item.link_url} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                        <ExternalLink size={11} /> OPEN
                      </Link>
                    )}
                    {!hasLink && (
                      <span className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.4)" }}>No quick action</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}