import { describe, expect, it, vi } from "vitest";

import { createMediaManager } from "../mediaManager.js";
import { createFakePeerConnection, createFakeTrack, createManualTimers, flush } from "./fakes.js";

class FakeMediaStream {
  constructor(tracks = []) {
    this.tracks = [...tracks];
  }
  addTrack(t) {
    this.tracks.push(t);
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio");
  }
}

function setup({ playResult } = {}) {
  const appended = [];
  const audio = {
    style: {},
    dataset: {},
    setAttribute() {},
    srcObject: null,
    play: vi.fn(() => (playResult ? playResult() : Promise.resolve())),
    pause: vi.fn(),
    parentNode: null,
  };
  const doc = {
    createElement: () => audio,
    body: {
      appendChild: (el) => {
        appended.push(el);
        el.parentNode = { removeChild: () => appended.splice(appended.indexOf(el), 1) };
      },
    },
  };
  const listeners = {};
  const win = {
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
  };
  const timers = createManualTimers();
  const onPlaybackBlocked = vi.fn();
  const mediaDevices = { getUserMedia: vi.fn() };
  const media = createMediaManager({
    doc,
    win,
    mediaDevices,
    MediaStreamCtor: FakeMediaStream,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    logger: { info() {}, warn() {}, error() {}, debug() {} },
    onPlaybackBlocked,
  });
  return { media, audio, appended, timers, onPlaybackBlocked, mediaDevices, listeners };
}

describe("remote audio", () => {
  it("attaches a remote track delivered by the track event, through one hidden element", () => {
    const { media, audio, appended } = setup();
    const pc = createFakePeerConnection();
    media.wireRemoteAudio(pc);
    const stream = new FakeMediaStream([createFakeTrack("audio")]);
    pc.fire("track", { track: stream.tracks[0], streams: [stream] });
    expect(audio.srcObject).toBe(stream);
    expect(audio.play).toHaveBeenCalled();
    expect(appended).toHaveLength(1);
    // Wiring the same connection again does not add a second listener or element.
    media.wireRemoteAudio(pc);
    expect(appended).toHaveLength(1);
  });

  it("attaches tracks already on the receivers", () => {
    const { media, audio } = setup();
    const pc = createFakePeerConnection();
    pc.receivers = [{ track: createFakeTrack("audio") }];
    media.wireRemoteAudio(pc);
    expect(audio.srcObject.getAudioTracks()).toHaveLength(1);
  });

  it("picks up a track that arrives late without a track event", async () => {
    const { media, audio, timers } = setup();
    const pc = createFakePeerConnection();
    media.wireRemoteAudio(pc);
    expect(audio.srcObject).toBe(null);
    pc.receivers = [{ track: createFakeTrack("audio") }];
    await timers.runAll();
    expect(audio.srcObject.getAudioTracks()).toHaveLength(1);
  });

  it("reports autoplay blocking and retries on the next gesture", async () => {
    let blocked = true;
    const { media, audio, onPlaybackBlocked, listeners } = setup({
      playResult: () => (blocked ? Promise.reject(Object.assign(new Error("no"), { name: "NotAllowedError" })) : Promise.resolve()),
    });
    const pc = createFakePeerConnection();
    pc.receivers = [{ track: createFakeTrack("audio") }];
    media.wireRemoteAudio(pc);
    await flush();
    expect(onPlaybackBlocked).toHaveBeenCalled();
    expect(media.isPlaybackBlocked()).toBe(true);
    blocked = false;
    listeners.click();
    await flush();
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(media.isPlaybackBlocked()).toBe(false);
  });

  it("clears the sink and pending late-track checks when the call ends", async () => {
    const { media, audio, timers } = setup();
    media.ensureAudioElement();
    const pc = createFakePeerConnection();
    media.wireRemoteAudio(pc);
    expect(timers.pending().length).toBeGreaterThan(0);
    media.clearRemoteAudio();
    expect(audio.srcObject).toBe(null);
    expect(audio.pause).toHaveBeenCalled();
    expect(timers.pending()).toHaveLength(0);
  });

  it("removes the element on dispose", () => {
    const { media, appended } = setup();
    media.ensureAudioElement();
    media.dispose();
    expect(appended).toHaveLength(0);
  });
});

describe("microphone", () => {
  it("enables and silences the outgoing audio track itself", () => {
    const { media } = setup();
    const pc = createFakePeerConnection();
    media.setSenderAudioEnabled(pc, false);
    expect(pc.sender.track.enabled).toBe(false);
    media.setSenderAudioEnabled(pc, true);
    expect(pc.sender.track.enabled).toBe(true);
  });

  it("checks permission and releases the microphone immediately", async () => {
    const { media, mediaDevices } = setup();
    const track = createFakeTrack("audio");
    mediaDevices.getUserMedia.mockResolvedValue({ getTracks: () => [track] });
    await media.ensureMicrophone();
    expect(track.stop).toHaveBeenCalled();
  });

  it("names a denied or missing microphone", async () => {
    const { media, mediaDevices } = setup();
    mediaDevices.getUserMedia.mockRejectedValueOnce(Object.assign(new Error(), { name: "NotAllowedError" }));
    await expect(media.ensureMicrophone()).rejects.toMatchObject({ voice: { code: "MIC_PERMISSION_DENIED" } });
    mediaDevices.getUserMedia.mockRejectedValueOnce(Object.assign(new Error(), { name: "NotFoundError" }));
    await expect(media.ensureMicrophone()).rejects.toMatchObject({ voice: { code: "MIC_NOT_FOUND" } });
  });
});
