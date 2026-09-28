import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, Pause, Upload, FileAudio, X, Loader2, Check, Music2, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import VocalProductionTools from "@/components/music/VocalProductionTools";

/**
 * VocalRecorder — lets artists record vocals over their beat with real-time
 * production tools (gain, EQ, compression, reverb), write lyrics, and upload
 * production sample files. Passes vocal data up to the parent for saving.
 */

const DEFAULT_EFFECTS = {
  inputGain: 1.0,
  lowGain: 0,
  midGain: 0,
  highGain: 0,
  compThreshold: -24,
  compRatio: 4,
  reverbMix: 0,
};

/** Generate a decaying noise impulse response for the convolver (reverb). */
function createReverbImpulse(ctx, duration = 2, decay = 2) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

export default function VocalRecorder({ onVocalDataChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [sampleFileUrl, setSampleFileUrl] = useState(null);
  const [sampleFileName, setSampleFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingSample, setUploadingSample] = useState(false);
  const [error, setError] = useState(null);
  const [effects, setEffects] = useState(DEFAULT_EFFECTS);
  const [monitor, setMonitor] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  // Web Audio API nodes for real-time effects
  const audioCtxRef = useRef(null);
  const inputGainRef = useRef(null);
  const lowEQRef = useRef(null);
  const midEQRef = useRef(null);
  const highEQRef = useRef(null);
  const compressorRef = useRef(null);
  const reverbGainRef = useRef(null);
  const dryGainRef = useRef(null);
  const monitorGainRef = useRef(null);

  // Notify parent of vocal data changes
  const notifyParent = useCallback((data) => {
    if (onVocalDataChange) onVocalDataChange(data);
  }, [onVocalDataChange]);

  // Update effect parameters in real-time during recording
  useEffect(() => {
    if (inputGainRef.current) inputGainRef.current.gain.value = effects.inputGain;
    if (lowEQRef.current) lowEQRef.current.gain.value = effects.lowGain;
    if (midEQRef.current) midEQRef.current.gain.value = effects.midGain;
    if (highEQRef.current) highEQRef.current.gain.value = effects.highGain;
    if (compressorRef.current) {
      compressorRef.current.threshold.value = effects.compThreshold;
      compressorRef.current.ratio.value = effects.compRatio;
    }
    if (reverbGainRef.current) reverbGainRef.current.gain.value = effects.reverbMix;
    if (dryGainRef.current) dryGainRef.current.gain.value = 1 - effects.reverbMix;
  }, [effects]);

  // Toggle monitoring
  useEffect(() => {
    if (monitorGainRef.current && audioCtxRef.current) {
      monitorGainRef.current.gain.value = monitor ? 1 : 0;
    }
  }, [monitor]);

  const handleEffectChange = (param, value) => {
    setEffects((prev) => ({ ...prev, [param]: value }));
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create AudioContext and effects chain
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") await ctx.resume();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // Input gain
      const inputGain = ctx.createGain();
      inputGain.gain.value = effects.inputGain;
      inputGainRef.current = inputGain;

      // 3-band EQ
      const lowEQ = ctx.createBiquadFilter();
      lowEQ.type = "lowshelf";
      lowEQ.frequency.value = 200;
      lowEQ.gain.value = effects.lowGain;
      lowEQRef.current = lowEQ;

      const midEQ = ctx.createBiquadFilter();
      midEQ.type = "peaking";
      midEQ.frequency.value = 1000;
      midEQ.Q.value = 0.8;
      midEQ.gain.value = effects.midGain;
      midEQRef.current = midEQ;

      const highEQ = ctx.createBiquadFilter();
      highEQ.type = "highshelf";
      highEQ.frequency.value = 5000;
      highEQ.gain.value = effects.highGain;
      highEQRef.current = highEQ;

      // Compressor
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = effects.compThreshold;
      compressor.ratio.value = effects.compRatio;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      // Reverb (convolver with generated impulse)
      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbImpulse(ctx, 2, 2);
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = effects.reverbMix;
      reverbGainRef.current = reverbGain;
      const dryGain = ctx.createGain();
      dryGain.gain.value = 1 - effects.reverbMix;
      dryGainRef.current = dryGain;

      // Mix node (combines dry + wet)
      const mixGain = ctx.createGain();

      // Monitor gain (controls whether the artist hears themselves)
      const monitorGain = ctx.createGain();
      monitorGain.gain.value = monitor ? 1 : 0;
      monitorGainRef.current = monitorGain;

      // Connect the chain:
      // source -> inputGain -> lowEQ -> midEQ -> highEQ -> compressor -> [dry + wet reverb] -> mix -> dest + monitor
      source.connect(inputGain);
      inputGain.connect(lowEQ);
      lowEQ.connect(midEQ);
      midEQ.connect(highEQ);
      highEQ.connect(compressor);

      // Dry path
      compressor.connect(dryGain);
      dryGain.connect(mixGain);

      // Wet path (reverb)
      compressor.connect(convolver);
      convolver.connect(reverbGain);
      reverbGain.connect(mixGain);

      // Recording destination
      const dest = ctx.createMediaStreamDestination();
      mixGain.connect(dest);

      // Monitor destination (speakers/headphones)
      mixGain.connect(monitorGain);
      monitorGain.connect(ctx.destination);

      // Record from the processed destination stream
      const recorder = new MediaRecorder(dest.stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Clean up audio context
        if (audioCtxRef.current) {
          try { await audioCtxRef.current.close(); } catch { /* ignore */ }
          audioCtxRef.current = null;
        }
        // Reset node refs
        inputGainRef.current = null;
        lowEQRef.current = null;
        midEQRef.current = null;
        highEQRef.current = null;
        compressorRef.current = null;
        reverbGainRef.current = null;
        dryGainRef.current = null;
        monitorGainRef.current = null;

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "vocal-recording.webm", { type: "audio/webm" });

        setUploading(true);
        try {
          const result = await base44.integrations.Core.UploadFile({ file });
          const url = result.file_url;
          setAudioUrl(url);
          notifyParent({ vocalRecordingUrl: url, lyrics, hasVocals: true });
        } catch {
          setError("Could not upload vocal recording. Please try again.");
        } finally {
          setUploading(false);
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setIsPlaying(false);
    notifyParent({ vocalRecordingUrl: null, lyrics, hasVocals: false });
  };

  const handleLyricsChange = (value) => {
    setLyrics(value);
    notifyParent({ vocalRecordingUrl: audioUrl, lyrics: value, hasVocals: !!audioUrl });
  };

  const handleSampleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingSample(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setSampleFileUrl(result.file_url);
      setSampleFileName(file.name);
      notifyParent({ sampleFileUrl: result.file_url, sampleFileName: file.name });
    } catch {
      setError("Could not upload sample file.");
    } finally {
      setUploadingSample(false);
    }
  };

  const deleteSample = () => {
    setSampleFileUrl(null);
    setSampleFileName("");
    notifyParent({ sampleFileUrl: null, sampleFileName: "" });
  };

  return (
    <div className="mt-6 p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Mic size={16} style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ VOCAL STUDIO & LYRICS</span>
      </div>

      <p className="text-xs mb-6" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Record your vocals over the beat with studio-quality effects, write your lyrics, and upload production samples — then save it all as a complete song.
      </p>

      {error && <p className="font-mono text-[9px] mb-4" style={{ color: "#ef4444" }}>⚠ {error}</p>}

      {/* Vocal Production Tools — always visible so artists can dial in their sound before recording */}
      <VocalProductionTools
        effects={effects}
        onEffectChange={handleEffectChange}
        monitor={monitor}
        onMonitorToggle={() => setMonitor(!monitor)}
      />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Vocal Recording */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Mic size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#F5F5F7" }}>RECORD VOCALS</span>
            {isRecording && (
              <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26" }}>
                FX LIVE
              </span>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-50"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Mic size={12} />}
                {uploading ? "UPLOADING..." : "START RECORDING"}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[9px] tracking-widest uppercase transition-all animate-pulse"
                style={{ background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.5)", color: "#ef4444" }}
              >
                <Square size={12} /> STOP & UPLOAD
              </button>
            )}
          </div>

          {/* Recording waveform indicator */}
          {isRecording && (
            <div className="flex items-end justify-center gap-1 h-12 mb-4 p-3" style={{ background: "rgba(239,68,68,0.05)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
              {[...Array(30)].map((_, i) => (
                <div key={i} className="flex-1" style={{ background: "#ef4444", opacity: 0.3 + Math.random() * 0.7, animation: `eqBar ${0.3 + Math.random() * 0.4}s ${i * 0.03}s ease-in-out infinite` }} />
              ))}
            </div>
          )}

          {/* Recorded vocal playback */}
          <AnimatePresence>
            {audioUrl && !isRecording && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <button onClick={togglePlayback} className="flex items-center justify-center w-9 h-9 flex-shrink-0" style={{ background: "#D1FF26", borderRadius: "50%" }}>
                  {isPlaying ? <Pause size={13} style={{ color: "#05070A" }} /> : <Play size={13} style={{ color: "#05070A" }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#F5F5F7" }}>Vocal Recording</p>
                  <p className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>✓ UPLOADED · READY TO SAVE</p>
                </div>
                <button onClick={deleteRecording} className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "#8A8F98" }}>
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <audio ref={audioRef} preload="none" onEnded={() => setIsPlaying(false)} />
        </div>

        {/* Lyrics Editor */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#F5F5F7" }}>WRITE LYRICS</span>
          </div>
          <textarea
            value={lyrics}
            onChange={(e) => handleLyricsChange(e.target.value)}
            placeholder="Write your lyrics here...&#10;&#10;[Verse 1]&#10;Your words go here...&#10;&#10;[Chorus]&#10;The hook that they'll remember..."
            rows={6}
            maxLength={5000}
            className="w-full px-3 py-2.5 text-sm outline-none resize-none"
            style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7", fontFamily: "monospace", lineHeight: 1.6 }}
          />
          <p className="font-mono text-[8px] mt-1 text-right" style={{ color: "#8A8F98" }}>{lyrics.length}/5000</p>
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Upload size={12} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#F5F5F7" }}>UPLOAD PRODUCTION FILES</span>
        </div>
        <p className="text-xs mb-3" style={{ color: "#8A8F98" }}>Upload loops, samples, reference tracks, or sheet music to assist your production.</p>

        {!sampleFileUrl ? (
          <label className="flex flex-col items-center justify-center py-8 cursor-pointer transition-all hover:bg-[rgba(209,255,38,0.04)]" style={{ background: "rgba(5,7,10,0.4)", border: "1px dashed rgba(209,255,38,0.3)" }}>
            {uploadingSample ? (
              <>
                <Loader2 size={24} className="animate-spin mb-2" style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>UPLOADING...</span>
              </>
            ) : (
              <>
                <FileAudio size={24} className="mb-2" style={{ color: "rgba(209,255,38,0.4)" }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CLICK TO UPLOAD</span>
                <span className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98" }}>Audio, PDF, or image files</span>
              </>
            )}
            <input type="file" accept="audio/*,image/*,.pdf" onChange={handleSampleUpload} disabled={uploadingSample} className="hidden" />
          </label>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <div className="flex items-center justify-center w-9 h-9 flex-shrink-0" style={{ background: "rgba(209,255,38,0.15)", borderRadius: "50%" }}>
              <Check size={14} style={{ color: "#D1FF26" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "#F5F5F7" }}>{sampleFileName}</p>
              <p className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>✓ UPLOADED</p>
            </div>
            <button onClick={deleteSample} className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "#8A8F98" }}>
              <X size={12} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Complete song indicator */}
      {(audioUrl || lyrics.trim()) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center gap-2 p-3" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
          <Music2 size={12} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
            COMPLETE SONG READY — {audioUrl ? "VOCALS + " : ""}{lyrics.trim() ? "LYRICS + " : ""}BEAT WILL BE SAVED TOGETHER
          </span>
        </motion.div>
      )}
    </div>
  );
}