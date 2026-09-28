import { useState, useRef, useEffect } from "react";

/**
 * useAudioAnalyser — connects an <audio> element to a Web Audio AnalyserNode
 * so frequency data can drive a real-time visualizer.
 *
 * `audioInput` may be either a React ref to the element or the element itself
 * (passing the element lets the graph rebuild when the element is remounted).
 * `active` resumes the AudioContext on playback. `enabled` gates whether the
 * graph is built at all — pass false for streams that are NOT CORS-clean, because
 * createMediaElementSource permanently routes the element's output through the
 * graph and SILENCES any cross-origin stream served without CORS headers.
 *
 * Requirements for analysis to work:
 *  - enabled === true
 *  - The audio element must have crossOrigin="anonymous".
 *  - The stream must be served with Access-Control-Allow-Origin (e.g. via the
 *    app's radio-proxy). Otherwise the graph is tainted and getByteFrequencyData
 *    returns zeros — and worse, the element's audio is silenced.
 *
 * @param {React.RefObject<HTMLAudioElement>|HTMLAudioElement|null} audioInput
 * @param {boolean} active — whether playback is active (resumes the graph)
 * @param {boolean} enabled — whether to build the graph at all (CORS-clean only)
 * @returns {{ analyser: AnalyserNode|null, ready: boolean }}
 */
export function useAudioAnalyser(audioInput, active, enabled = true) {
  const [analyser, setAnalyser] = useState(null);
  const ctxRef = useRef(null);

  // Resolve to the actual element — supports both a ref and a raw element.
  const audio =
    audioInput && typeof audioInput === "object" && "current" in audioInput
      ? audioInput.current
      : audioInput;

  // Build the graph once per element (createMediaElementSource is one-way and
  // can only be called once per element). Rebuild when the element identity
  // changes (e.g. a keyed remount) or when `enabled` flips.
  useEffect(() => {
    if (!audio || !enabled) return;
    let ctx, source, an;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      ctx = new Ctx();
      source = ctx.createMediaElementSource(audio);
      an = ctx.createAnalyser();
      an.fftSize = 64;
      an.smoothingTimeConstant = 0.7;
      source.connect(an);
      an.connect(ctx.destination);
      ctxRef.current = ctx;
      setAnalyser(an);
    } catch {
      // Cross-origin tainted source or unavailable — analysis disabled,
      // audio still plays through the element's default output.
    }
    return () => {
      try { ctx && ctx.close(); } catch {}
      ctxRef.current = null;
      setAnalyser(null);
    };
  }, [audio, enabled]);

  // Resume the AudioContext on playback (autoplay policy requires a gesture).
  useEffect(() => {
    if (active && ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
  }, [active, audio]);

  return { analyser, ready: !!analyser };
}