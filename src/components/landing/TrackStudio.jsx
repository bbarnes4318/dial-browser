import React, { useState, useEffect, useCallback } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Trash2, Radio, Disc3, Music2, Play, Pause, Loader2,
  Check, X, Headphones, TrendingUp, Album, MessageSquare, ImagePlus,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import TrackComments from "@/components/music/TrackComments";

const GENRES = [
  "Hip-Hop", "Electronic", "Jazz", "R&B", "Pop", "Rock",
  "Ambient", "Country", "World", "Indie", "Lo-Fi", "Experimental",
];

export default function TrackStudio({
  // Pattern data passed from the studio
  beatPattern,
  recordedNotes,
  bpm,
  synthType,
  // Vocal recording, lyrics, and sample data from VocalRecorder
  vocalData,
  // Replay functions from the studio
  onReplayPattern,
  onReplayRecording,
}) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [error, setError] = useState(null);

  // Save form
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [trackTitle, setTrackTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("Electronic");
  const [albumName, setAlbumName] = useState("");
  const [description, setDescription] = useState("");
  const [artworkUrl, setArtworkUrl] = useState(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);

  // Load saved tracks
  const loadTracks = useCallback(async () => {
    try {
      const list = await base44.entities.ArtistTrack.list("-updated_date", 50);
      setTracks(list || []);
    } catch {
      setError("Could not load your tracks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTracks(); }, [loadTracks]);

  const handleArtworkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingArtwork(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setArtworkUrl(result.file_url);
    } catch {
      setError("Could not upload cover art.");
    } finally {
      setUploadingArtwork(false);
    }
  };

  const hasPattern = beatPattern && Object.keys(beatPattern).length > 0;
  const hasRecording = recordedNotes && recordedNotes.length > 0;
  const hasVocals = !!(vocalData?.vocalRecordingUrl || vocalData?.lyrics?.trim());
  const canSave = trackTitle.trim() && artistName.trim() && (hasPattern || hasRecording || hasVocals);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Calculate track number within album
      const albumTracks = tracks.filter(t => t.album_name === albumName.trim());
      const trackNum = albumName.trim() ? albumTracks.length + 1 : undefined;

      // Estimate duration from recording
      let duration = 0;
      if (hasRecording) {
        duration = Math.max(...recordedNotes.map(e => e.time || 0));
      }

      const hasVocals = !!(vocalData?.vocalRecordingUrl);
      await base44.entities.ArtistTrack.create({
        track_title: trackTitle.trim(),
        artist_name: artistName.trim(),
        genre,
        bpm,
        synth_type: synthType,
        duration_seconds: Math.ceil(duration) || undefined,
        beat_pattern: JSON.stringify(beatPattern || {}),
        recorded_notes: JSON.stringify(recordedNotes || []),
        vocal_recording_url: vocalData?.vocalRecordingUrl || undefined,
        lyrics: vocalData?.lyrics?.trim() || undefined,
        sample_file_url: vocalData?.sampleFileUrl || undefined,
        has_vocals: hasVocals,
        album_name: albumName.trim() || undefined,
        track_number: trackNum,
        description: description.trim() || undefined,
        artwork_url: artworkUrl || undefined,
        radio_status: "not_submitted",
      });

      setTrackTitle("");
      setAlbumName("");
      setDescription("");
      setArtworkUrl(null);
      setShowSaveForm(false);
      await loadTracks();
    } catch {
      setError("Could not save track. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.ArtistTrack.delete(id);
      setTracks(prev => prev.filter(t => t.id !== id));
    } catch {
      setError("Could not delete track.");
    }
  };

  const handleSubmitToRadio = async (track) => {
    setSubmittingId(track.id);
    setError(null);
    try {
      // Simulate radio approval — in production this would go through admin review
      await base44.entities.ArtistTrack.update(track.id, {
        radio_status: "live",
        play_count: Math.floor(Math.random() * 50) + 10,
      });
      await loadTracks();
    } catch {
      setError("Could not submit to radio.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handlePlayTrack = (track) => {
    if (playingId === track.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(track.id);
    try {
      const pattern = JSON.parse(track.beat_pattern || "{}");
      const notes = JSON.parse(track.recorded_notes || "[]");
      if (Object.keys(pattern).length > 0 && onReplayPattern) onReplayPattern(pattern, track.bpm || bpm);
      if (notes.length > 0 && onReplayRecording) onReplayRecording(notes);
    } catch {
      // ignore parse errors
    }
    // Auto-clear after a few seconds
    setTimeout(() => setPlayingId(null), 4000);
  };

  // Group tracks by album
  const albums = {};
  const singles = [];
  tracks.forEach(t => {
    if (t.album_name) {
      if (!albums[t.album_name]) albums[t.album_name] = [];
      albums[t.album_name].push(t);
    } else {
      singles.push(t);
    }
  });

  const liveCount = tracks.filter(t => t.radio_status === "live").length;
  const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);

  return (
    <div className="mt-6 p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Disc3 size={16} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ TRACK STUDIO</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Radio size={11} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{liveCount} ON AIR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Headphones size={11} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{totalPlays.toLocaleString()} plays</span>
          </div>
        </div>
      </div>

      {/* Save button / form */}
      <AnimatePresence>
        {!showSaveForm ? (
          <motion.button
            key="save-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaveForm(true)}
            disabled={!hasPattern && !hasRecording}
            className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            <Save size={12} /> Save Current Beat as Track
          </motion.button>
        ) : (
          <motion.div
            key="save-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 mb-4 space-y-3" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// SAVE TRACK</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={trackTitle}
                  onChange={e => setTrackTitle(e.target.value)}
                  placeholder="Track title *"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                />
                <input
                  value={artistName}
                  onChange={e => setArtistName(e.target.value)}
                  placeholder="Artist name *"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm outline-none cursor-pointer"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                >
                  {GENRES.map(g => <option key={g} value={g} style={{ background: "#10141D" }}>{g}</option>)}
                </select>
                <input
                  value={albumName}
                  onChange={e => setAlbumName(e.target.value)}
                  placeholder="Album name (optional)"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                />
              </div>
              {/* Cover Art Upload */}
              <div>
                <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>COVER ART</p>
                <div className="flex items-center gap-3">
                  {artworkUrl ? (
                    <div className="relative">
                      <img src={proxyMediaUrl(artworkUrl)} alt="Cover art" className="w-16 h-16 object-cover" style={{ border: "0.5px solid rgba(209,255,38,0.3)" }} />
                      <button
                        onClick={() => setArtworkUrl(null)}
                        className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center"
                        style={{ background: "#ef4444", borderRadius: "50%" }}
                      >
                        <X size={10} style={{ color: "#fff" }} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-16 h-16 cursor-pointer transition-all hover:bg-[rgba(209,255,38,0.04)]" style={{ background: "rgba(5,7,10,0.4)", border: "1px dashed rgba(209,255,38,0.3)" }}>
                      {uploadingArtwork ? <Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} /> : <ImagePlus size={16} style={{ color: "rgba(209,255,38,0.4)" }} />}
                      <input type="file" accept="image/*" onChange={handleArtworkUpload} disabled={uploadingArtwork} className="hidden" />
                    </label>
                  )}
                  <p className="text-xs" style={{ color: "#8A8F98" }}>{artworkUrl ? "Cover art uploaded ✓" : "Click to upload cover art for this track or album"}</p>
                </div>
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description or lyrics notes (optional)"
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {saving ? "SAVING..." : "SAVE TRACK"}
                </button>
                <button
                  onClick={() => { setShowSaveForm(false); setTrackTitle(""); setAlbumName(""); setDescription(""); setArtworkUrl(null); }}
                  className="px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase"
                  style={{ background: "rgba(138,143,152,0.1)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#ef4444" }}>⚠ {error}</p>}

      {/* Saved tracks */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-8">
          <Music2 size={28} className="mx-auto mb-2" style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO TRACKS SAVED YET</p>
          <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>Build a beat above and save it to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Albums */}
          {Object.entries(albums).map(([album, albumTracks]) => (
            <div key={album}>
              <div className="flex items-center gap-2 mb-2">
                <Album size={12} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>{album.toUpperCase()}</span>
                <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>({albumTracks.length} tracks)</span>
              </div>
              <div className="space-y-2">
                {albumTracks.sort((a, b) => (a.track_number || 0) - (b.track_number || 0)).map(track => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    playingId={playingId}
                    submittingId={submittingId}
                    onPlay={handlePlayTrack}
                    onDelete={handleDelete}
                    onSubmitRadio={handleSubmitToRadio}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Singles */}
          {singles.length > 0 && Object.keys(albums).length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Music2 size={12} style={{ color: "#8A8F98" }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SINGLES</span>
            </div>
          )}
          {singles.length > 0 && (
            <div className="space-y-2">
              {singles.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  playingId={playingId}
                  submittingId={submittingId}
                  onPlay={handlePlayTrack}
                  onDelete={handleDelete}
                  onSubmitRadio={handleSubmitToRadio}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrackRow({ track, playingId, submittingId, onPlay, onDelete, onSubmitRadio }) {
  const isPlaying = playingId === track.id;
  const isLive = track.radio_status === "live";
  const [showComments, setShowComments] = useState(false);

  return (
    <div>
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 transition-all"
      style={{
        background: isLive ? "rgba(209,255,38,0.06)" : "rgba(5,7,10,0.4)",
        border: `0.5px solid ${isLive ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}`,
      }}
    >
      {/* Play button */}
      <button
        onClick={() => onPlay(track)}
        className="flex items-center justify-center w-9 h-9 flex-shrink-0 transition-all hover:scale-105"
        style={{
          background: isPlaying ? "#D1FF26" : "rgba(209,255,38,0.1)",
          border: "0.5px solid rgba(209,255,38,0.3)",
          borderRadius: "50%",
        }}
      >
        {isPlaying ? <Pause size={13} style={{ color: "#05070A" }} /> : <Play size={13} style={{ color: "#D1FF26" }} />}
      </button>

      {/* Cover art thumbnail */}
      {track.artwork_url && (
        <img src={proxyMediaUrl(track.artwork_url)} alt={track.track_title} className="w-10 h-10 object-cover flex-shrink-0" style={{ border: "0.5px solid rgba(209,255,38,0.2)" }} />
      )}

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#F5F5F7" }}>{track.track_title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{track.artist_name}</span>
          <span className="font-mono text-[7px] px-1.5 py-0.5" style={{ background: "rgba(138,143,152,0.1)", color: "#8A8F98" }}>{track.genre}</span>
          {track.bpm && <span className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>{track.bpm} BPM</span>}
          {isLive && (
            <span className="flex items-center gap-1 font-mono text-[7px] tracking-widest" style={{ color: "#D1FF26" }}>
              <span className="rounded-full" style={{ width: 4, height: 4, background: "#D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
              ON AIR
            </span>
          )}
        </div>
      </div>

      {/* Play count */}
      {isLive && track.play_count > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <TrendingUp size={10} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{track.play_count}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {track.radio_status === "not_submitted" && (
          <button
            onClick={() => onSubmitRadio(track)}
            disabled={submittingId === track.id}
            className="flex items-center gap-1.5 px-3 py-2 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          >
            {submittingId === track.id ? <Loader2 size={10} className="animate-spin" /> : <Radio size={10} />}
            {submittingId === track.id ? "..." : "TO RADIO"}
          </button>
        )}
        {track.radio_status === "pending" && (
          <span className="font-mono text-[7px] tracking-widest px-2 py-1" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623" }}>PENDING</span>
        )}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 px-2 py-2 font-mono text-[8px] tracking-widest uppercase transition-all"
          style={{
            background: showComments ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)",
            border: `0.5px solid ${showComments ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.2)"}`,
            color: "#D1FF26",
          }}
        >
          <MessageSquare size={10} /> {showComments ? "HIDE" : "COMMENTS"}
        </button>
        <button
          onClick={() => onDelete(track.id)}
          className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)]"
          style={{ color: "#8A8F98" }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <TrackComments track={track} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}