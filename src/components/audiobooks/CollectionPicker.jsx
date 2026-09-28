import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Check, Plus, Loader2, Bookmark, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function CollectionPicker({ book, onClose }) {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const list = await base44.entities.AudiobookCollection.filter({ created_by_id: user.id }, "-updated_date", 100);
      setCollections(Array.isArray(list) ? list : []);
    } catch { setCollections([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const ensureFavorites = async () => {
    let fav = collections.find((c) => c.is_favorites);
    if (fav) return fav;
    fav = await base44.entities.AudiobookCollection.create({ name: "Favorites", is_favorites: true, audiobook_ids: [] });
    setCollections((p) => [fav, ...p]);
    return fav;
  };

  const toggleFav = async () => {
    setBusyId("fav");
    try {
      const fav = await ensureFavorites();
      const ids = new Set(fav.audiobook_ids || []);
      if (ids.has(book.id)) ids.delete(book.id); else ids.add(book.id);
      await base44.entities.AudiobookCollection.update(fav.id, { audiobook_ids: [...ids] });
      await load();
    } catch { /* ignore */ } finally { setBusyId(null); }
  };

  const toggle = async (c) => {
    setBusyId(c.id);
    try {
      const ids = new Set(c.audiobook_ids || []);
      if (ids.has(book.id)) ids.delete(book.id); else ids.add(book.id);
      await base44.entities.AudiobookCollection.update(c.id, { audiobook_ids: [...ids] });
      await load();
    } catch { /* ignore */ } finally { setBusyId(null); }
  };

  const create = async () => {
    if (!newName.trim()) return;
    setSavingNew(true);
    try {
      await base44.entities.AudiobookCollection.create({ name: newName.trim(), audiobook_ids: [book.id] });
      setNewName("");
      await load();
    } catch { /* ignore */ } finally { setSavingNew(false); }
  };

  const isFav = collections.find((c) => c.is_favorites)?.audiobook_ids?.includes(book.id);
  const custom = collections.filter((c) => !c.is_favorites);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm p-5"
        style={{ background: "#10141d", border: "0.5px solid rgba(209,255,38,0.3)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bookmark size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SAVE TO COLLECTION</p>
          </div>
          <button onClick={onClose}><X size={16} style={{ color: "#8A8F98" }} /></button>
        </div>
        <p className="text-xs mb-3 truncate" style={{ color: "#F5F5F7" }}>{book.title}</p>

        {!user ? (
          <p className="font-mono text-[10px] text-center py-6" style={{ color: "#8A8F98" }}>Log in to save audiobooks to collections.</p>
        ) : (
          <>
            <button
              onClick={toggleFav}
              disabled={busyId === "fav"}
              className="w-full flex items-center gap-2 px-3 py-2.5 mb-3 transition-all disabled:opacity-50"
              style={{
                background: isFav ? "rgba(239,68,68,0.1)" : "rgba(209,255,38,0.08)",
                border: `0.5px solid ${isFav ? "rgba(239,68,68,0.3)" : "rgba(209,255,38,0.3)"}`,
                color: isFav ? "#ef4444" : "#D1FF26",
              }}
            >
              {busyId === "fav" ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} fill={isFav ? "currentColor" : "none"} />}
              <span className="font-mono text-[10px] tracking-widest uppercase">{isFav ? "Remove from Favorites" : "Add to Favorites"}</span>
            </button>

            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>MY COLLECTIONS</p>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
            ) : custom.length === 0 ? (
              <p className="font-mono text-[9px] text-center py-3" style={{ color: "rgba(138,143,152,0.5)" }}>NO COLLECTIONS YET — CREATE ONE BELOW</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 mb-3">
                {custom.map((c) => {
                  const on = (c.audiobook_ids || []).includes(book.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggle(c)}
                      disabled={busyId === c.id}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all disabled:opacity-50"
                      style={{
                        background: on ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.5)",
                        border: `0.5px solid ${on ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
                      }}
                    >
                      {busyId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} style={{ color: on ? "#D1FF26" : "transparent" }} />}
                      <span className="flex-1 text-xs truncate" style={{ color: "#F5F5F7" }}>{c.name}</span>
                      <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{(c.audiobook_ids || []).length}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") create(); }}
                placeholder="New collection name…"
                className="flex-1 bg-transparent text-xs outline-none px-3 py-2.5"
                style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
              />
              <button
                onClick={create}
                disabled={savingNew || !newName.trim()}
                className="flex items-center justify-center gap-1.5 px-3 font-mono text-[9px] tracking-widest uppercase font-bold disabled:opacity-40"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                {savingNew ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}