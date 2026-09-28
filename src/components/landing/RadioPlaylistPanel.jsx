import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, Plus, Trash2, Play, X, Check, ChevronRight, ChevronLeft, Loader2, Music } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Personalized radio playlist manager.
 * Lets logged-in users create, save, and queue their favorite stations
 * for sequential on-air listening.
 */
export default function RadioPlaylistPanel({ stations, playing, onPlayStation }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [error, setError] = useState(null);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.RadioPlaylist.filter({}, "-created_date", 50);
      setPlaylists(data);
    } catch {
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  const handleCreate = async () => {
    if (!newName.trim() || selectedIds.length === 0) return;
    setError(null);
    try {
      const created = await base44.entities.RadioPlaylist.create({
        playlist_name: newName.trim(),
        station_ids: selectedIds,
      });
      setPlaylists(prev => [created, ...prev]);
      setNewName("");
      setSelectedIds([]);
      setCreating(false);
    } catch (err) {
      setError(err.message || "Could not save playlist. Please log in.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.RadioPlaylist.delete(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      if (activePlaylistId === id) setActivePlaylistId(null);
    } catch { /* ignore */ }
  };

  const toggleStationSelect = (stationId) => {
    setSelectedIds(prev =>
      prev.includes(stationId) ? prev.filter(id => id !== stationId) : [...prev, stationId]
    );
  };

  const playPlaylist = (playlist) => {
    setActivePlaylistId(playlist.id);
    if (playlist.station_ids?.length > 0) {
      onPlayStation(playlist.station_ids[0]);
    }
  };

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const activeQueue = activePlaylist?.station_ids || [];
  const currentIndex = activeQueue.indexOf(playing);
  const canNext = currentIndex >= 0 && currentIndex < activeQueue.length - 1;
  const canPrev = currentIndex > 0;

  return (
    <div className="mt-6 p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListMusic size={16} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ MY PLAYLISTS</span>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
          style={{
            background: creating ? "rgba(138,143,152,0.1)" : "rgba(209,255,38,0.08)",
            border: "0.5px solid rgba(209,255,38,0.3)",
            color: creating ? "#8A8F98" : "#D1FF26",
          }}
        >
          {creating ? <X size={12} /> : <Plus size={12} />} {creating ? "CANCEL" : "NEW"}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mb-4 pb-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.15)" }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Playlist name (e.g. Late Night Chill)"
                className="w-full px-3 py-3 bg-transparent font-mono text-sm outline-none mb-3"
                style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7", fontSize: "16px" }}
              />
              <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>SELECT STATIONS TO QUEUE</p>
              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {stations.map((s) => {
                  const selected = selectedIds.includes(s.id);
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleStationSelect(s.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left transition-all"
                      style={{
                        background: selected ? s.accent : "rgba(5,7,10,0.4)",
                        border: `0.5px solid ${selected ? s.border : "rgba(138,143,152,0.1)"}`,
                      }}
                    >
                      <Icon size={14} style={{ color: selected ? s.color : "#8A8F98" }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-xs truncate" style={{ color: selected ? s.color : "#F5F5F7" }}>{s.name}</p>
                        <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{s.genre} · {s.dj}</p>
                      </div>
                      {selected && <Check size={14} style={{ color: s.color }} />}
                    </button>
                  );
                })}
              </div>
              {error && <p className="font-mono text-[9px] mt-2" style={{ color: "#ef4444" }}>{error}</p>}
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || selectedIds.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 mt-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                <Plus size={12} /> SAVE PLAYLIST ({selectedIds.length} STATIONS)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue controls (when playlist active) */}
      {activePlaylist && activeQueue.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <button
            onClick={() => canPrev && onPlayStation(activeQueue[currentIndex - 1])}
            disabled={!canPrev}
            className="w-9 h-9 flex items-center justify-center transition-all disabled:opacity-20"
            style={{ border: "0.5px solid rgba(209,255,38,0.3)" }}
            aria-label="Previous station"
          >
            <ChevronLeft size={14} style={{ color: "#D1FF26" }} />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
              QUEUE {currentIndex >= 0 ? `${currentIndex + 1}/${activeQueue.length}` : "—"}
            </p>
            <p className="font-heading font-bold text-xs truncate" style={{ color: "#D1FF26" }}>{activePlaylist.playlist_name}</p>
          </div>
          <button
            onClick={() => canNext && onPlayStation(activeQueue[currentIndex + 1])}
            disabled={!canNext}
            className="w-9 h-9 flex items-center justify-center transition-all disabled:opacity-20"
            style={{ border: "0.5px solid rgba(209,255,38,0.3)" }}
            aria-label="Next station"
          >
            <ChevronRight size={14} style={{ color: "#D1FF26" }} />
          </button>
        </div>
      )}

      {/* Saved playlists list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin" style={{ color: "#8A8F98" }} />
        </div>
      ) : playlists.length === 0 && !creating ? (
        <div className="text-center py-6">
          <Music size={24} className="mx-auto mb-2" style={{ color: "rgba(138,143,152,0.3)" }} />
          <p className="font-mono text-[10px] tracking-wider" style={{ color: "#8A8F98" }}>No playlists yet — tap NEW to create one</p>
        </div>
      ) : (
        <div className="space-y-2">
          {playlists.map((pl) => {
            const isActive = activePlaylistId === pl.id;
            const stationCount = pl.station_ids?.length || 0;
            return (
              <div
                key={pl.id}
                className="flex items-center gap-2 p-3 transition-all"
                style={{
                  background: isActive ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.4)",
                  border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                }}
              >
                <button
                  onClick={() => playPlaylist(pl)}
                  disabled={stationCount === 0}
                  className="flex-1 flex items-center gap-3 text-left transition-all disabled:opacity-30"
                >
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    {isActive && playing ? <EqualizerMini color="#D1FF26" /> : <Play size={12} style={{ color: "#D1FF26" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-xs truncate" style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}>{pl.playlist_name}</p>
                    <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{stationCount} {stationCount === 1 ? "STATION" : "STATIONS"}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(pl.id)}
                  className="w-8 h-8 flex items-center justify-center transition-all hover:bg-[rgba(239,68,68,0.1)]"
                  style={{ color: "rgba(138,143,152,0.5)" }}
                  aria-label="Delete playlist"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EqualizerMini({ color }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-0.5 rounded-full"
          style={{
            background: color,
            height: "100%",
            animation: `eqBar ${0.6 + i * 0.2}s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}