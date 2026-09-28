import React, { useState, useRef } from "react";
import { Sparkles, Loader2, Play, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PADS = ["kick", "snare", "hihat", "clap", "tom", "crash", "bass", "rim"];
const SYNTHS = ["sine", "square", "sawtooth", "triangle"];

const EXAMPLES = [
  "A hard-hitting trap beat with rapid hi-hats and deep 808 bass",
  "A chill lo-fi hip-hop groove with soft kicks and jazzy snare",
  "An upbeat dance track with a four-on-the-floor kick and clapping",
  "A slow R&B groove with sparse snares and warm bass",
];

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    bpm: { type: "number", description: "Tempo in BPM (60-180)" },
    synth_type: { type: "string", enum: SYNTHS, description: "Synthesizer waveform for melody" },
    kick: { type: "array", items: { type: "number" }, description: "Step indices (0-15) where kick drum hits" },
    snare: { type: "array", items: { type: "number" }, description: "Step indices (0-15) where snare hits" },
    hihat: { type: "array", items: { type: "number" }, description: "Step indices (0-15) where hi-hat hits" },
    clap: { type: "array", items: { type: "number" }, description: "Step indices (0-15) where clap hits" },
    tom: { type: "array", items: { type: "number" }, description: "Step indices (0-15) where tom hits" },
    crash: { type: "array", items: { type: "number" }, description: "Step indices (0-15) where crash hits" },
    bass: { type: "array", items: { type: "number" }, description: "Step indices (0-15) where bass hits" },
    rim: { type: "array", items: { type: "number" }, description: "Step indices (0-15) where rim hits" },
  },
  required: ["bpm", "synth_type"]
};

export default function AiBeatGenerator({ onGenerate, onPreview, currentBpm, currentSynth }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const previewTimeoutRef = useRef(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const prompt = `You are an AI beat producer. A user described the beat or song they want. Generate a step sequencer pattern that matches their description.

The sequencer has 16 steps (indices 0-15). Each drum pad is a separate field in the JSON — set it to an array of step indices where that drum should hit. Omit or leave empty arrays for pads that should not play.

Drum pads: kick, snare, hihat, clap, tom, crash, bass, rim.

User's description: "${description.trim()}"

Guidelines:
- Step 0 is the downbeat. Kick usually goes on 0, 4, 8, 12 for a four-on-the-floor.
- Snare typically on 4 and 12.
- Hi-hats can be on every step or every other step for fast patterns.
- Keep patterns musical — don't overcrowd. Usually 3-5 pads active.
- Match BPM and intensity to the user's description (e.g., trap = 140-160, lo-fi = 70-90, dance = 120-130).
- All step indices must be integers from 0 to 15.`;

      const res = (await base44.functions.invoke("ai-beat-pattern", { description: description.trim() })).data;

      const result = typeof res === "string" ? JSON.parse(res) : res;
      console.log("[AiBeatGenerator] LLM response:", result);
      const pattern = {};
      PADS.forEach((padId) => {
        const steps = result[padId];
        if (Array.isArray(steps) && steps.length > 0) {
          pattern[padId] = steps.filter((s) => s >= 0 && s < 16);
        }
      });
      console.log("[AiBeatGenerator] Parsed pattern:", pattern);

      const generatedBpm = Math.min(180, Math.max(60, Math.round(result.bpm || currentBpm)));
      const generatedSynth = SYNTHS.includes(result.synth_type) ? result.synth_type : currentSynth;

      onGenerate({
        pattern,
        bpm: generatedBpm,
        synthType: generatedSynth,
      });
      setLastGenerated({ pattern, bpm: generatedBpm, synthType: generatedSynth });
    } catch (err) {
      console.error("AI beat generation failed:", err);
      setError("Could not generate beat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!lastGenerated || !onPreview || previewing) return;
    onPreview(lastGenerated.pattern, lastGenerated.bpm);
    setPreviewing(true);
    // One full loop = 16 sixteenth-notes = (240000 / bpm) ms
    const loopMs = 240000 / lastGenerated.bpm;
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => setPreviewing(false), loopMs);
  };

  return (
    <div className="mt-6 p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ DESCRIBE YOUR BEAT</span>
        <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>(AI-GENERATED PATTERN)</span>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the beat or song you want… e.g. 'A dark trap beat with booming 808s, fast hi-hat rolls, and sparse snare hits'"
        rows={3}
        className="w-full px-4 py-3 bg-transparent font-mono text-sm outline-none resize-none"
        style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7", fontSize: "16px", lineHeight: "1.5" }}
        disabled={loading}
      />

      {error && (
        <p className="font-mono text-[10px] mt-2" style={{ color: "#ef4444" }}>{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="flex items-center gap-2 px-5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
          style={{ background: "#D1FF26", border: "0.5px solid #D1FF26", color: "#05070A" }}
        >
          {loading ? <><Loader2 size={11} className="animate-spin" /> GENERATING…</> : <><Sparkles size={11} /> GENERATE BEAT</>}
        </button>
        {lastGenerated && (
          <button
            onClick={handlePreview}
            disabled={loading || previewing}
            className="flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-40"
            style={{
              background: previewing ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.08)",
              border: "0.5px solid rgba(209,255,38,0.3)",
              color: "#D1FF26",
            }}
          >
            {previewing ? <><Volume2 size={11} className="animate-pulse" /> PREVIEWING…</> : <><Play size={11} /> PREVIEW BEAT</>}
          </button>
        )}
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>TRY:</span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => setDescription(ex)}
            disabled={loading}
            className="px-2 py-1 font-mono text-[8px] tracking-wider transition-all hover:bg-[rgba(209,255,38,0.06)]"
            style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}
          >
            {ex.split(" ").slice(0, 2).join(" ")}…
          </button>
        ))}
      </div>
    </div>
  );
}