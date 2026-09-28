import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Music, Play, Pause, Square, Trash2, Mic, Save, Download, Volume2 } from "lucide-react";
import { speak } from "@/lib/voiceSynthesis";
import TrackStudio from "@/components/landing/TrackStudio";
import VocalRecorder from "@/components/music/VocalRecorder";
import AiBeatGenerator from "@/components/landing/AiBeatGenerator";

// AI Music Production Studio — uses Web Audio API for real sound synthesis
// No external audio files needed; all sounds generated programmatically

const DRUM_PADS = [
  { id: "kick", label: "KICK", key: "1", color: "#D1FF26" },
  { id: "snare", label: "SNARE", key: "2", color: "#5AE0C8" },
  { id: "hihat", label: "HI-HAT", key: "3", color: "#E0A85A" },
  { id: "clap", label: "CLAP", key: "4", color: "#E085A8" },
  { id: "tom", label: "TOM", key: "5", color: "#FF6B5A" },
  { id: "crash", label: "CRASH", key: "6", color: "#C8A0FF" },
  { id: "bass", label: "BASS", key: "7", color: "#5A8FE0" },
  { id: "rim", label: "RIM", key: "8", color: "#9AE05A" },
];

const KEYBOARD_NOTES = [
  { note: "C4", freq: 261.63, key: "Q" },
  { note: "D4", freq: 293.66, key: "W" },
  { note: "E4", freq: 329.63, key: "E" },
  { note: "F4", freq: 349.23, key: "R" },
  { note: "G4", freq: 392.00, key: "T" },
  { note: "A4", freq: 440.00, key: "Y" },
  { note: "B4", freq: 493.88, key: "U" },
  { note: "C5", freq: 523.25, key: "I" },
];

const SYNTH_TYPES = [
  { id: "sine", label: "SINE" },
  { id: "square", label: "SQUARE" },
  { id: "sawtooth", label: "SAW" },
  { id: "triangle", label: "TRI" },
];

const SEQUENCER_STEPS = 16;

export default function MusicStudio() {
  const audioCtxRef = useRef(null);
  const [bpm, setBpm] = useState(120);
  const [volume, setVolume] = useState(0.5);
  const [synthType, setSynthType] = useState("sine");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activePads, setActivePads] = useState({});
  const [recording, setRecording] = useState(false);
  const [recordedEvents, setRecordedEvents] = useState([]);
  const [flashPad, setFlashPad] = useState(null);
  const [vocalData, setVocalData] = useState({});
  const stepIntervalRef = useRef(null);
  const recordStartRef = useRef(null);
  const masterGainRef = useRef(null);

  // Initialize audio context on first user interaction
  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = volume;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, [volume]);

  // ---- Drum synthesis ----
  const playKick = (time) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    osc.start(time);
    osc.stop(time + 0.5);
  };

  const playSnare = (time) => {
    const ctx = audioCtxRef.current;
    // Noise buffer for snare body
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGainRef.current);
    noise.start(time);
    noise.stop(time + 0.2);

    // Tonal component
    const osc = ctx.createOscillator();
    osc.frequency.value = 200;
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(masterGainRef.current);
    osc.start(time);
    osc.stop(time + 0.1);
  };

  const playHiHat = (time) => {
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);
    noise.start(time);
    noise.stop(time + 0.1);
  };

  const playClap = (time) => {
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    // Multiple bursts for clap effect
    for (let burst = 0; burst < 3; burst++) {
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1500;
      const gain = ctx.createGain();
      const burstTime = time + burst * 0.01;
      gain.gain.setValueAtTime(0.7, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.01, burstTime + 0.05);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current);
      noise.start(burstTime);
      noise.stop(burstTime + 0.1);
    }
  };

  const playTom = (time) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(250, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.3);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    osc.start(time);
    osc.stop(time + 0.3);
  };

  const playCrash = (time) => {
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 1.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 5000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);
    noise.start(time);
    noise.stop(time + 1.0);
  };

  const playBass = (time) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(65, time); // C2
    osc.frequency.exponentialRampToValueAtTime(55, time + 0.2);
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    osc.start(time);
    osc.stop(time + 0.3);
  };

  const playRim = (time) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    osc.type = "square";
    const gain = ctx.createGain();
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    osc.start(time);
    osc.stop(time + 0.05);
  };

  const DRUM_PLAYERS = {
    kick: playKick,
    snare: playSnare,
    hihat: playHiHat,
    clap: playClap,
    tom: playTom,
    crash: playCrash,
    bass: playBass,
    rim: playRim,
  };

  // ---- Synth keyboard ----
  const playNote = (freq) => {
    ensureAudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = synthType;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  // ---- Drum pad hit ----
  const hitPad = (padId) => {
    ensureAudioContext();
    const ctx = audioCtxRef.current;
    const player = DRUM_PLAYERS[padId];
    if (player) {
      player(ctx.currentTime);
    }
    setFlashPad(padId);
    setTimeout(() => setFlashPad(null), 100);

    // Record if recording
    if (recording && recordStartRef.current !== null) {
      const elapsed = (Date.now() - recordStartRef.current) / 1000;
      setRecordedEvents((prev) => [...prev, { type: "drum", padId, time: elapsed }]);
    }
  };

  // ---- Sequencer ----
  useEffect(() => {
    if (!isPlaying) {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      setCurrentStep(0);
      return;
    }

    ensureAudioContext();
    const stepDuration = (60 / bpm / 4) * 1000; // 16th notes
    let step = 0;
    setCurrentStep(0);

    stepIntervalRef.current = setInterval(() => {
      // Play any active pads at this step
      Object.entries(activePads).forEach(([padId, steps]) => {
        if (steps.includes(step)) {
          const player = DRUM_PLAYERS[padId];
          if (player && audioCtxRef.current) {
            player(audioCtxRef.current.currentTime);
          }
        }
      });
      setCurrentStep(step);
      step = (step + 1) % SEQUENCER_STEPS;
    }, stepDuration);

    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [isPlaying, bpm, activePads]);

  // Toggle a step in the sequencer for a pad
  const toggleStep = (padId, stepIdx) => {
    setActivePads((prev) => {
      const current = prev[padId] || [];
      const updated = current.includes(stepIdx)
        ? current.filter((s) => s !== stepIdx)
        : [...current, stepIdx];
      return { ...prev, [padId]: updated };
    });
  };

  // Recording controls
  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
      recordStartRef.current = null;
    } else {
      ensureAudioContext();
      setRecording(true);
      recordStartRef.current = Date.now();
      setRecordedEvents([]);
    }
  };

  // Playback recorded events
  const playRecording = () => {
    if (recordedEvents.length === 0) return;
    ensureAudioContext();
    recordedEvents.forEach((event) => {
      setTimeout(() => {
        if (event.type === "drum") {
          const player = DRUM_PLAYERS[event.padId];
          if (player && audioCtxRef.current) player(audioCtxRef.current.currentTime);
        } else if (event.type === "note") {
          playNote(event.freq);
        }
      }, event.time * 1000);
    });
  };

  // Replay a saved beat pattern (one loop) — used by TrackStudio
  const replayPattern = useCallback((pattern, patternBpm) => {
    ensureAudioContext();
    const stepDuration = ((60 / (patternBpm || bpm)) / 4) * 1000;
    Object.entries(pattern).forEach(([padId, steps]) => {
      steps.forEach((stepIdx) => {
        setTimeout(() => {
          const player = DRUM_PLAYERS[padId];
          if (player && audioCtxRef.current) player(audioCtxRef.current.currentTime);
        }, stepIdx * stepDuration);
      });
    });
  }, [bpm]);

  // Replay saved recorded notes — used by TrackStudio
  const replayRecording = useCallback((notes) => {
    if (!notes || notes.length === 0) return;
    ensureAudioContext();
    notes.forEach((event) => {
      setTimeout(() => {
        if (event.type === "drum") {
          const player = DRUM_PLAYERS[event.padId];
          if (player && audioCtxRef.current) player(audioCtxRef.current.currentTime);
        } else if (event.type === "note") {
          playNote(event.freq);
        }
      }, event.time * 1000);
    });
  }, [synthType]);

  // Keyboard input
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toUpperCase();
      // Drum pads
      const drumPad = DRUM_PADS.find((p) => p.key === key);
      if (drumPad) { hitPad(drumPad.id); return; }
      // Synth notes
      const note = KEYBOARD_NOTES.find((n) => n.key === key);
      if (note) {
        playNote(note.freq);
        if (recording && recordStartRef.current !== null) {
          const elapsed = (Date.now() - recordStartRef.current) / 1000;
          setRecordedEvents((prev) => [...prev, { type: "note", freq: note.freq, time: elapsed }]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [recording, synthType]);

  // Apply AI-generated beat pattern from user description
  const handleAiGenerate = useCallback(({ pattern, bpm: genBpm, synthType: genSynth }) => {
    setActivePads(pattern);
    if (genBpm) setBpm(genBpm);
    if (genSynth) setSynthType(genSynth);
    setIsPlaying(false);
  }, []);

  const handleSpeak = () => {
    speak("AI Music Production Studio. Tap the drum pads or use your keyboard to play sounds. Toggle sequencer steps to build a beat, then hit play. Use the synth keyboard to play melodies. Record your session and play it back.", { rate: 1.0 });
  };

  return (
    <section id="music-studio" className="snap-section py-20 lg:py-24 px-4 lg:px-8" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// AI MUSIC STUDIO™</p>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Create Beats & <span style={{ color: "#D1FF26" }}>Songs</span>
          </h2>
          <p className="text-sm lg:text-base max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            An AI-powered music production studio right in your browser. Play drum pads, build beats with the step sequencer, and jam on the synth keyboard — no experience needed.
          </p>
          <button onClick={handleSpeak} className="mt-4 flex items-center gap-1.5 px-4 py-2 mx-auto font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <Volume2 size={11} /> How To Use
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Drum Pads */}
          <div className="p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ DRUM PADS</span>
              <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>(PRESS 1-8 OR TAP)</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {DRUM_PADS.map((pad) => (
                <button
                  key={pad.id}
                  onClick={() => hitPad(pad.id)}
                  className="relative aspect-square flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: flashPad === pad.id ? pad.color : `${pad.color}15`,
                    border: `0.5px solid ${flashPad === pad.id ? pad.color : `${pad.color}40`}`,
                    boxShadow: flashPad === pad.id ? `0 0 20px ${pad.color}60` : "none",
                  }}
                >
                  <span className="font-heading font-bold text-xs" style={{ color: flashPad === pad.id ? "#05070A" : pad.color }}>{pad.label}</span>
                  <span className="font-mono text-[7px] mt-0.5" style={{ color: flashPad === pad.id ? "#05070A" : `${pad.color}80` }}>KEY {pad.key}</span>
                </button>
              ))}
            </div>

            {/* Recording controls */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={toggleRecording}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all ${recording ? "animate-pulse" : ""}`}
                style={{
                  background: recording ? "rgba(239,68,68,0.2)" : "rgba(209,255,38,0.08)",
                  border: `0.5px solid ${recording ? "rgba(239,68,68,0.5)" : "rgba(209,255,38,0.3)"}`,
                  color: recording ? "#ef4444" : "#D1FF26",
                }}
              >
                <Mic size={11} /> {recording ? "STOP REC" : "RECORD"}
              </button>
              <button
                onClick={playRecording}
                disabled={recordedEvents.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
              >
                <Play size={11} /> PLAY ({recordedEvents.length})
              </button>
              <button
                onClick={() => setRecordedEvents([])}
                disabled={recordedEvents.length === 0}
                className="flex items-center justify-center w-10 py-2.5 transition-all disabled:opacity-30"
                style={{ background: "rgba(138,143,152,0.1)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Synth Keyboard */}
          <div className="p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ SYNTH KEYBOARD</span>
              <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>(PRESS Q-I)</span>
            </div>

            {/* Synth type selector */}
            <div className="flex gap-1.5 mb-4">
              {SYNTH_TYPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSynthType(s.id)}
                  className="flex-1 py-1.5 font-mono text-[8px] tracking-widest transition-all"
                  style={{
                    background: synthType === s.id ? "rgba(209,255,38,0.15)" : "rgba(5,7,10,0.4)",
                    border: `0.5px solid ${synthType === s.id ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`,
                    color: synthType === s.id ? "#D1FF26" : "#8A8F98",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Keyboard */}
            <div className="flex gap-1">
              {KEYBOARD_NOTES.map((n) => (
                <button
                  key={n.note}
                  onMouseDown={() => playNote(n.freq)}
                  onTouchStart={(e) => { e.preventDefault(); playNote(n.freq); }}
                  className="flex-1 aspect-[3/5] flex flex-col items-center justify-end pb-2 transition-all hover:scale-105 active:scale-95"
                  style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                >
                  <span className="font-heading font-bold text-xs">{n.note}</span>
                  <span className="font-mono text-[7px] mt-0.5" style={{ color: "rgba(209,255,38,0.5)" }}>{n.key}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step Sequencer */}
        <div className="mt-6 p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ STEP SEQUENCER</span>
            </div>
            <div className="flex items-center gap-4">
              {/* BPM control */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>BPM</span>
                <input type="range" min="60" max="180" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-20" style={{ accentColor: "#D1FF26" }} />
                <span className="font-mono text-xs font-bold" style={{ color: "#D1FF26" }}>{bpm}</span>
              </div>
              {/* Volume */}
              <div className="flex items-center gap-2">
                <Volume2 size={11} style={{ color: "#8A8F98" }} />
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-16" style={{ accentColor: "#D1FF26" }} />
              </div>
              {/* Play/Stop */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{
                  background: isPlaying ? "rgba(239,68,68,0.1)" : "#D1FF26",
                  border: `0.5px solid ${isPlaying ? "rgba(239,68,68,0.3)" : "#D1FF26"}`,
                  color: isPlaying ? "#ef4444" : "#05070A",
                }}
              >
                {isPlaying ? <><Square size={11} /> STOP</> : <><Play size={11} /> PLAY BEAT</>}
              </button>
              <button
                onClick={() => setActivePads({})}
                className="flex items-center gap-2 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{ background: "rgba(138,143,152,0.1)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
              >
                <Trash2 size={11} /> CLEAR
              </button>
            </div>
          </div>

          {/* Sequencer grid */}
          <div className="space-y-1.5 overflow-x-auto">
            {DRUM_PADS.map((pad) => (
              <div key={pad.id} className="flex items-center gap-2">
                <span className="font-mono text-[8px] tracking-widest w-14 flex-shrink-0" style={{ color: pad.color }}>{pad.label}</span>
                <div className="flex gap-1">
                  {Array.from({ length: SEQUENCER_STEPS }).map((_, stepIdx) => {
                    const isActive = (activePads[pad.id] || []).includes(stepIdx);
                    const isCurrent = isPlaying && currentStep === stepIdx;
                    return (
                      <button
                        key={stepIdx}
                        onClick={() => toggleStep(pad.id, stepIdx)}
                        className="w-7 h-7 flex-shrink-0 transition-all"
                        style={{
                          background: isActive ? pad.color : isCurrent ? `${pad.color}20` : "rgba(5,7,10,0.5)",
                          border: `0.5px solid ${isActive ? pad.color : isCurrent ? `${pad.color}60` : "rgba(138,143,152,0.1)"}`,
                          boxShadow: isCurrent && !isActive ? `0 0 8px ${pad.color}30` : "none",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            <span className="font-mono text-[8px] tracking-widest w-14 flex-shrink-0" style={{ color: "#8A8F98" }}>STEP</span>
            <div className="flex gap-1">
              {Array.from({ length: SEQUENCER_STEPS }).map((_, i) => (
                <div key={i} className="w-7 h-1 flex-shrink-0" style={{ background: isPlaying && currentStep === i ? "#D1FF26" : "rgba(138,143,152,0.1)" }} />
              ))}
            </div>
          </div>
        </div>

        {/* AI Beat Generator — describe a beat in plain language */}
        <AiBeatGenerator onGenerate={handleAiGenerate} onPreview={replayPattern} currentBpm={bpm} currentSynth={synthType} />

        {/* Vocal Studio — record vocals, write lyrics, upload samples */}
        <VocalRecorder onVocalDataChange={setVocalData} />

        {/* Track Studio — save beats, build albums, submit to radio */}
        <TrackStudio
          beatPattern={activePads}
          recordedNotes={recordedEvents}
          bpm={bpm}
          synthType={synthType}
          vocalData={vocalData}
          onReplayPattern={replayPattern}
          onReplayRecording={replayRecording}
        />
      </div>
    </section>
  );
}