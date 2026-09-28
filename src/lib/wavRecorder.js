/**
 * WavRecorder — records PCM audio at 16kHz, 16-bit, mono.
 * Output is a WAV Blob compatible with Azure Speaker Recognition API.
 */
export class WavRecorder {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.source = null;
    this.processor = null;
    this.chunks = [];
    this.recording = false;
  }

  async start() {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.chunks = [];
    this.recording = true;

    this.processor.onaudioprocess = (e) => {
      if (!this.recording) return;
      const input = e.inputBuffer.getChannelData(0);
      this.chunks.push(new Float32Array(input));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop() {
    return new Promise((resolve) => {
      this.recording = false;

      const totalLength = this.chunks.reduce((sum, c) => sum + c.length, 0);
      const combined = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of this.chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const sourceRate = this.audioContext.sampleRate;
      const targetRate = 16000;
      const resampled = this._resample(combined, sourceRate, targetRate);
      const wav = this._encodeWav(resampled, targetRate);

      this._cleanup();
      resolve(wav);
    });
  }

  cancel() {
    this.recording = false;
    this._cleanup();
  }

  _cleanup() {
    try {
      if (this.source) this.source.disconnect();
      if (this.processor) this.processor.disconnect();
      if (this.mediaStream) this.mediaStream.getTracks().forEach((t) => t.stop());
      if (this.audioContext && this.audioContext.state !== "closed") this.audioContext.close();
    } catch {
      // ignore
    }
  }

  _resample(samples, sourceRate, targetRate) {
    if (sourceRate === targetRate) return samples;
    const ratio = sourceRate / targetRate;
    const newLength = Math.round(samples.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcFloor = Math.floor(srcIndex);
      const srcCeil = Math.min(srcFloor + 1, samples.length - 1);
      const frac = srcIndex - srcFloor;
      result[i] = samples[srcFloor] * (1 - frac) + samples[srcCeil] * frac;
    }
    return result;
  }

  _encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  }
}