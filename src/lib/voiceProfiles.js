/**
 * Voice profile system — provides both human-sounding (neural) and
 * robotic-sounding voice profiles for use across the entire app.
 *
 * Human profiles prefer natural/neural browser voices with optimized
 * rate/pitch for lifelike delivery.
 *
 * Robotic profiles use default system voices with higher pitch and
 * metallic resonance for a classic text-to-speech robotic effect.
 */

import { loadVoices, getBestVoice } from "./voiceSynthesis";

let _ctx = null;

function getAudioCtx() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _ctx = new AC();
  }
  return _ctx;
}

// Robotic voice settings — higher pitch, slightly faster, flatter
const ROBOTIC_SETTINGS = {
  rate: 0.92,
  pitch: 0.3, // very low pitch for metallic effect
  volume: 1.0,
};

// Human voice settings — natural conversational pace
const HUMAN_SETTINGS = {
  rate: 0.95,
  pitch: 1.0,
  volume: 1.0,
};

/**
 * Gets a robotic-sounding voice — prefers default/non-neural system voices
 * which have the classic TTS robotic quality.
 */
function getRoboticVoice(voices) {
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith("en")
  );
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  // Patterns for robotic / non-natural voices (avoid neural ones)
  const roboticPatterns = [
    /Microsoft.*David/i,
    /Microsoft.*Mark/i,
    /Microsoft.*Zira/i,
    /Google.*US/i,
    /Daniel/i,
    /Alex/i,
    /Fred/i, // classic Mac robotic voice
  ];

  for (const pattern of roboticPatterns) {
    const match = pool.find((v) => pattern.test(v.name));
    if (match) return match;
  }

  // Fallback: first non-preferred voice (likely default robotic)
  return pool[0] || null;
}

/**
 * Gets the list of TTS voices available for generation, grouped by type.
 * Human voices come from the GenerateSpeech integration; robotic profiles
 * are simulated via browser TTS with metallic effects.
 */
export const TTS_VOICES = {
  human: [
    { id: "river", label: "River", desc: "Calm, neutral", icon: "🌊" },
    { id: "honey", label: "Honey", desc: "Warm, soft", icon: "🍯" },
    { id: "sunny", label: "Sunny", desc: "Bright, upbeat", icon: "☀️" },
    { id: "spark", label: "Spark", desc: "Energetic, quick", icon: "✨" },
  ],
  robotic: [
    { id: "storm", label: "Storm", desc: "Formal, metallic", icon: "⚡" },
  ],
};

/**
 * Speaks text using the specified voice profile.
 * @param {string} text — The text to speak
 * @param {"human"|"robotic"} profile — Voice profile to use
 * @param {object} options — { rate, pitch, volume, onEnd, onError, onStart }
 */
export async function speakWithProfile(text, profile = "human", options = {}) {
  if (!("speechSynthesis" in window)) return null;

  await loadVoices();
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  let voice;
  let settings;

  if (profile === "robotic") {
    voice = getRoboticVoice(voices);
    settings = { ...ROBOTIC_SETTINGS, ...options };
  } else {
    voice = getBestVoice();
    settings = { ...HUMAN_SETTINGS, ...options };
  }

  if (voice) utterance.voice = voice;
  utterance.rate = settings.rate ?? 0.95;
  utterance.pitch = settings.pitch ?? 1.0;
  utterance.volume = settings.volume ?? 1.0;

  if (settings.onEnd) utterance.onend = settings.onEnd;
  if (settings.onError) utterance.onerror = settings.onError;
  if (settings.onStart) utterance.onstart = settings.onStart;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Generates a robotic audio effect using Web Audio API oscillators.
 * Plays a metallic "blip" sound — useful for UI feedback in robotic mode.
 * @param {number} freq — Frequency in Hz
 */
export function playRoboticBlip(freq = 800) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "square";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.1);

  filter.type = "bandpass";
  filter.frequency.value = freq * 2;
  filter.Q.value = 10;

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Generates a human-sounding confirmation chime.
 */
export function playHumanChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}