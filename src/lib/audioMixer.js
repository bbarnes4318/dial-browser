// Client-side voice + music mixdown. Decodes a voice track and a music bed,
// renders them together (music looped under the voice at a lower gain) with
// OfflineAudioContext, and encodes the result as a 16-bit PCM WAV Blob ready
// to upload. Pure browser — no credits. Falls back gracefully if the music
// bed can't be decoded (returns null so the caller can keep voice-only).

async function decodeAudio(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(buf);
  } finally {
    try { ctx.close(); } catch { /* ignore */ }
  }
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);

  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); writeStr(8, "WAVE");
  writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeStr(36, "data"); view.setUint32(40, dataSize, true);

  const channels = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

export async function mixVoiceAndMusic(voiceUrl, musicUrl, voiceGain = 1, musicGain = 0.15) {
  const voiceBuf = await decodeAudio(voiceUrl);
  let musicBuf = null;
  if (musicUrl) {
    try { musicBuf = await decodeAudio(musicUrl); } catch { /* music unavailable — voice only */ }
  }
  const length = voiceBuf.length;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const offline = new Offline(2, length, voiceBuf.sampleRate);

  const vSrc = offline.createBufferSource();
  vSrc.buffer = voiceBuf;
  const vGain = offline.createGain();
  vGain.gain.value = Math.max(0, Math.min(1, voiceGain));
  vSrc.connect(vGain).connect(offline.destination);
  vSrc.start(0);

  if (musicBuf) {
    const mSrc = offline.createBufferSource();
    mSrc.buffer = musicBuf;
    mSrc.loop = true;
    const mGain = offline.createGain();
    mGain.gain.value = Math.max(0, Math.min(1, musicGain));
    mSrc.connect(mGain).connect(offline.destination);
    mSrc.start(0);
    mSrc.stop(length / voiceBuf.sampleRate);
  }

  const rendered = await offline.startRendering();
  return audioBufferToWav(rendered);
}