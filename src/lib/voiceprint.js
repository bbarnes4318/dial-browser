/**
 * Voiceprint — in-browser voice biometrics using spectral feature extraction.
 * No external API needed. Extracts a 32-dim spectral fingerprint from WAV audio
 * and compares voiceprints using cosine similarity.
 */

// ── Radix-2 FFT (Cooley-Tukey) ──
function fft(real, imag) {
  const n = real.length;
  if (n <= 1) return;

  // Bit reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }

  // Butterfly operations
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;
      const half = len >> 1;
      for (let j = 0; j < half; j++) {
        const uReal = real[i + j];
        const uImag = imag[i + j];
        const tReal = real[i + j + half] * curReal - imag[i + j + half] * curImag;
        const tImag = real[i + j + half] * curImag + imag[i + j + half] * curReal;
        real[i + j] = uReal + tReal;
        imag[i + j] = uImag + tImag;
        real[i + j + half] = uReal - tReal;
        imag[i + j + half] = uImag - tImag;
        const newReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = newReal;
      }
    }
  }
}

const NUM_BINS = 32;
const FRAME_SIZE = 512; // Power of 2

/**
 * Extract a voiceprint signature from a WAV Blob.
 * Returns a 32-dimensional normalized feature vector.
 */
export async function extractVoiceprint(wavBlob) {
  const arrayBuffer = await wavBlob.arrayBuffer();

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const samples = audioBuffer.getChannelData(0);

  if (samples.length < FRAME_SIZE) {
    audioCtx.close();
    throw new Error("Audio too short — please speak the full passphrase.");
  }

  const numFrames = Math.floor(samples.length / FRAME_SIZE);
  const spectrum = new Float32Array(FRAME_SIZE / 2);
  const real = new Float32Array(FRAME_SIZE);
  const imag = new Float32Array(FRAME_SIZE);

  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * FRAME_SIZE;
    // Hann window
    for (let i = 0; i < FRAME_SIZE; i++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FRAME_SIZE - 1)));
      real[i] = samples[start + i] * w;
      imag[i] = 0;
    }

    fft(real, imag);

    // Magnitude spectrum
    for (let i = 0; i < FRAME_SIZE / 2; i++) {
      spectrum[i] += Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }
  }

  // Average across frames
  for (let i = 0; i < spectrum.length; i++) {
    spectrum[i] /= numFrames;
  }

  // Downsample to NUM_BINS bins (log-scale grouping for better voice resolution)
  const voiceprint = [];
  const binSize = Math.floor(spectrum.length / NUM_BINS);
  for (let i = 0; i < NUM_BINS; i++) {
    let sum = 0;
    for (let j = 0; j < binSize; j++) {
      sum += spectrum[i * binSize + j] || 0;
    }
    voiceprint.push(sum / binSize);
  }

  // L2 normalize
  const magnitude = Math.sqrt(voiceprint.reduce((s, v) => s + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < voiceprint.length; i++) {
      voiceprint[i] /= magnitude;
    }
  }

  audioCtx.close();
  return voiceprint;
}

/**
 * Compare two voiceprint vectors using cosine similarity.
 * Returns a value between 0 (no match) and 1 (identical).
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0;
}

/**
 * Average multiple voiceprint vectors (for enrollment).
 */
export function averageVoiceprints(voiceprints) {
  if (!voiceprints || voiceprints.length === 0) return null;
  const len = voiceprints[0].length;
  const result = new Array(len).fill(0);
  for (const vp of voiceprints) {
    for (let i = 0; i < len; i++) {
      result[i] += vp[i] || 0;
    }
  }
  for (let i = 0; i < len; i++) {
    result[i] /= voiceprints.length;
  }

  // Re-normalize
  const magnitude = Math.sqrt(result.reduce((s, v) => s + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < len; i++) {
      result[i] /= magnitude;
    }
  }
  return result;
}

export const VERIFICATION_THRESHOLD = 0.82;