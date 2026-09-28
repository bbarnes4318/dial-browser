import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bookmark, Heart, Plus, Trash2, Loader2, Play, X, Clock, Headphones, BookOpen, Folder,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import ContinueListening from "@/components/audiobooks/ContinueListening";
import AudiobookPlayer from "@/components/audiobooks/AudiobookPlayer";
import ChallengeBadges from "@/components/audiobooks/ChallengeBadges";

const GENRE_COLORS = {
  Comedy: "#A3E635", Action: "#FB923C", Thriller: "#EF4444", Mystery: "#8B5CF6",
  Romance: "#F472B6", War: "#94A3B8", History: "#D4A574", Crime: "#DC2626",
  Educational: "#22D3EE", Documentaries: "#60A5FA", "Children's": "#FBBF24", Drama: "#60AFA0", Urban: "#94A3B8",
};

export default function MyLibrary() {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [openCollection, setOpenCollection] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [cols, allBooks] = await Promise.all([
        base44.entities.AudiobookCollection.filter({ created_by_id: user.id }, "-updated_date", 100),
        base44.entities.Audiobook.list("-created_date", 300),
      ]);
      setCollections(Array.isArray(cols) ? cols : []);
      setBooks(Array.isArray(allBooks) ? allBooks : []);
    } catch { setCollections([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createCollection = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await base44.entities.AudiobookCollection.create({ name: newName.trim(), audiobook_ids: [] });
      setNewName("");
      await load();
    } catch { /* ignore */ } finally { setCreating(false); }
  };

  const removeCollection = async (c) => {
    try {
      await base44.entities.AudiobookCollection.delete(c.id);
      setCollections((p) => p.filter((x) => x.id !== c.id));
      if (openCollection?.id === c.id) setOpenCollection(null);
    } catch { /* ignore */ }
  };

  const removeBook = async (c, bookId) => {
    try {
      const ids = (c.audiobook_ids || []).filter((id) => id !== bookId);
      await base44.entities.AudiobookCollection.update(c.id, { audiobook_ids: ids });
      await load();
    } catch { /* ignore */ }
  };

  const bookMap = new Map(books.map((b) => [b.id, b]));
  const favorites = collections.find((c) => c.is_favorites);
  const customCollections = collections.filter((c) => !c.is_favorites);
  const favBooks = (favorites?.audiobook_ids || []).map((id) => bookMap.get(id)).filter(Boolean);

  const renderTile = (book, collection) => {
    const genreColor = GENRE_COLORS[book.genre] || "#D1FF26";
    const hasAudio = (book.audio_url && book.audio_url.length > 0) || (book.chapter_audio_urls && book.chapter_audio_urls.length > 0);
    return (
      <div key={book.id} className="flex flex-col overflow-hidden" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${genreColor}22` }}>
        <Link to={`/narrator/${encodeURIComponent(book.narrator || "")}`} className="block relative aspect-[3/2] overflow-hidden" style={{ background: `linear-gradient(135deg, ${genreColor}12, rgba(5,7,10,0.9))` }} onClick={(e) => { if (!book.narrator) e.preventDefault(); }}>
          {book.cover_art_url ? (
            <img src={proxyMediaUrl(book.cover_art_url)} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><BookOpen size={32} style={{ color: `${genreColor}66` }} /></div>
          )}
          <div className="absolute top-2 left-2 px-2 py-0.5 font-mono text-[7px] tracking-widest uppercase" style={{ background: `${genreColor}33`, color: genreColor }}>{book.genre}</div>
        </Link>
        <div className="p-3 flex-1 flex flex-col">
          <p className="font-heading font-bold text-xs leading-tight mb-1" style={{ color: "#F5F5F7" }}>{book.title}</p>
          <p className="text-[10px] mb-2" style={{ color: "#8A8F98" }}>{book.author}</p>
          <div className="flex items-center gap-2 mb-2 font-mono text-[7px]" style={{ color: "#8A8F98" }}>
            {book.duration_minutes > 0 && <span className="flex items-center gap-1"><Clock size={8} /> {book.duration_minutes}m</span>}
            {book.chapter_count > 1 && <span className="flex items-center gap-1"><Headphones size={8} /> {book.chapter_count}ch</span>}
          </div>
          <div className="flex gap-2 mt-auto">
            <button onClick={() => setSelectedBook(book)} disabled={!hasAudio} className="flex-1 flex items-center justify-center gap-1 py-2 font-mono text-[8px] tracking-widest uppercase font-bold disabled:opacity-30" style={{ background: "#D1FF26", color: "#05070A" }}>
              <Play size={10} /> Play
            </button>
            {collection && (
              <button onClick={() => removeBook(collection, book.id)} className="flex items-center justify-center px-2.5 transition-all" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }} title="Remove from collection">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/library" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Library
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// MY LIBRARY</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Your <span style={{ color: "#D1FF26" }}>Collections.</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Save favorite audiobooks, organize them into custom playlists, and pick up exactly where you left off.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : (
          <>
            {/* Continue Listening */}
            <ContinueListening onPlay={setSelectedBook} />

            {/* Listener Badge Challenges */}
            <ChallengeBadges books={books} />

            {/* Favorites */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Heart size={14} style={{ color: "#ef4444" }} fill="currentColor" />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>▸ FAVORITES</p>
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{favBooks.length}</span>
              </div>
              {favBooks.length === 0 ? (
                <p className="font-mono text-[10px] tracking-widest text-center py-8" style={{ color: "rgba(138,143,152,0.4)" }}>NO FAVORITES YET — TAP THE BOOKMARK ON ANY AUDIOBOOK</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favBooks.map((b) => renderTile(b, favorites))}
                </div>
              )}
            </div>

            {/* My Collections */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Folder size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ MY COLLECTIONS</p>
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{customCollections.length}</span>
              </div>

              {/* Create new */}
              <div className="flex gap-2 mb-4">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") createCollection(); }}
                  placeholder="New collection name (e.g. Road Trip, Bedtime)…"
                  className="flex-1 bg-transparent text-sm outline-none px-3 py-2.5"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
                <button
                  onClick={createCollection}
                  disabled={creating || !newName.trim()}
                  className="flex items-center justify-center gap-1.5 px-4 font-mono text-[9px] tracking-widest uppercase font-bold disabled:opacity-40"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
                </button>
              </div>

              {customCollections.length === 0 ? (
                <p className="font-mono text-[10px] tracking-widest text-center py-8" style={{ color: "rgba(138,143,152,0.4)" }}>NO COLLECTIONS YET — CREATE ONE ABOVE</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customCollections.map((c) => {
                    const items = (c.audiobook_ids || []).map((id) => bookMap.get(id)).filter(Boolean);
                    const firstCover = items[0]?.cover_art_url;
                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 cursor-pointer transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.15)]"
                        style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
                        onClick={() => setOpenCollection(c)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: firstCover ? "transparent" : "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                            {firstCover ? <img src={proxyMediaUrl(firstCover)} alt={c.name} className="w-full h-full object-cover" /> : <Folder size={20} style={{ color: "#D1FF26" }} />}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeCollection(c); }}
                            className="p-1.5 transition-all hover:bg-[rgba(239,68,68,0.1)]"
                            style={{ border: "0.5px solid rgba(239,68,68,0.2)" }}
                            title="Delete collection"
                          >
                            <Trash2 size={12} style={{ color: "#ef4444" }} />
                          </button>
                        </div>
                        <p className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>{c.name}</p>
                        <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{items.length} title{items.length === 1 ? "" : "s"}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Collection detail modal */}
      <AnimatePresence>
        {openCollection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setOpenCollection(null)}>
            <motion.div initial={{ scale: 0.97, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl my-8 p-6" style={{ background: "#10141d", border: "0.5px solid rgba(209,255,38,0.3)" }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// COLLECTION</p>
                  <h2 className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{openCollection.name}</h2>
                </div>
                <button onClick={() => setOpenCollection(null)}><X size={20} style={{ color: "#8A8F98" }} /></button>
              </div>
              {(() => {
                const items = (openCollection.audiobook_ids || []).map((id) => bookMap.get(id)).filter(Boolean);
                if (items.length === 0) {
                  return <p className="font-mono text-[10px] tracking-widest text-center py-12" style={{ color: "rgba(138,143,152,0.5)" }}>NO TITLES IN THIS COLLECTION YET</p>;
                }
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {items.map((b) => renderTile(b, openCollection))}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBook && <AudiobookPlayer book={selectedBook} onClose={() => setSelectedBook(null)} />}
      </AnimatePresence>
    </div>
  );
}