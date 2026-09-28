// Neon-cyberpunk portal palette — matches the Dial Browser social portal mockup.
// Cyan + magenta neon over deep navy/black glass.
export const PORTAL = {
  bg: "#050515",
  panel: "rgba(12,12,32,0.6)",
  panelSolid: "#0a0a22",
  cyan: "#00f0ff",
  magenta: "#ff00ff",
  pink: "#ff0055",
  text: "#ffffff",
  muted: "#a0a0a0",
  border: "rgba(0,240,255,0.18)",
  borderMagenta: "rgba(255,0,255,0.22)",
};

export const glassPanel = (accent = "cyan") => ({
  background: "linear-gradient(135deg, rgba(0,240,255,0.05) 0%, rgba(10,10,30,0.65) 50%, rgba(255,0,255,0.05) 100%)",
  border: `0.5px solid ${accent === "magenta" ? "rgba(255,0,255,0.28)" : "rgba(0,240,255,0.22)"}`,
  boxShadow: "0 0 24px rgba(0,240,255,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
  backdropFilter: "blur(8px)",
});