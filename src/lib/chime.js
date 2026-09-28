// Clean, futuristic success chime using the Web Audio API.
// No external files — synthesized in-browser to match the Phosphor Pulse aesthetic.
// Ascending major triad with smooth exponential decay.

let audioCtx = null;

export function playSuccessChime() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    // C6, E6, G6 — bright major triad, subtle and futuristic
    const freqs = [1046.5, 1318.5, 1568.0];
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    masterGain.connect(audioCtx.destination);

    freqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = audioCtx.createGain();
      const start = now + i * 0.06;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch {
    // Audio not available — silently skip
  }
}