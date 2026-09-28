export const FIELDS = [
  "Technology", "Telecom", "Marketing", "Design", "Hardware",
  "Sales", "Logistics", "Community", "Accessibility", "General",
];

export const JOB_TYPES = ["Full-Time", "Part-Time", "Contract"];

export const ALERT_TAGS = [
  { id: "remote", label: "Remote", description: "Work from anywhere" },
  { id: "full-time", label: "Full-Time", description: "Permanent full-time roles" },
  { id: "part-time", label: "Part-Time", description: "Flexible part-time hours" },
  { id: "contract", label: "Contract", description: "Project-based contract work" },
];

export const FIELD_ICONS = {
  Technology: "💻", Telecom: "📡", Marketing: "📣", Design: "🎨",
  Hardware: "🔧", Sales: "🤝", Logistics: "📦", Community: "🌍",
  Accessibility: "♿", General: "📋",
};

export const STATUS_STYLES = {
  submitted: { color: "#8A8F98", bg: "rgba(138,143,152,0.08)" },
  viewed: { color: "#60A5FA", bg: "rgba(96,165,250,0.08)" },
  shortlisted: { color: "#D1FF26", bg: "rgba(209,255,38,0.08)" },
  interview_requested: { color: "#FBBF24", bg: "rgba(251,191,36,0.08)" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  hired: { color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  archived: { color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
};

export const EXPERIENCE_LEVELS = [
  { id: "all", label: "All Levels", min: 0, max: Infinity },
  { id: "entry", label: "Entry (0-2 yr)", min: 0, max: 2 },
  { id: "mid", label: "Mid (3-5 yr)", min: 3, max: 5 },
  { id: "senior", label: "Senior (6+ yr)", min: 6, max: Infinity },
];

export const FIELD_KEYWORDS = {
  Technology: ["javascript", "python", "react", "node", "sql", "java", "aws", "docker", "git", "typescript", "html", "css", "api", "backend", "frontend", "fullstack", "devops", "linux", "kubernetes", "go", "rust", "c++", "php", "ruby"],
  Telecom: ["network", "voip", "sip", "fiber", "wireless", "lte", "5g", "rf", "telecom", "broadband", "cisco", "routing", "switching"],
  Marketing: ["seo", "social", "content", "email", "campaign", "analytics", "branding", "ads", "ppc", "sem", "copywriting", "hubspot", "google ads"],
  Design: ["figma", "photoshop", "illustrator", "ui", "ux", "sketch", "indesign", "graphic", "logo", "wireframe", "prototyping", "after effects"],
  Hardware: ["arduino", "raspberry", "pcb", "soldering", "embedded", "iot", "robotics", "circuit", "firmware", "verilog", "fpga", "sensors"],
  Sales: ["crm", "negotiation", "pipeline", "b2b", "b2c", "lead", "closing", "account", "territory", "salesforce", "outbound"],
  Logistics: ["supply", "chain", "warehouse", "inventory", "shipping", "freight", "forklift", "procurement", "dispatch", "customs"],
  Community: ["outreach", "organizing", "event", "volunteer", "coordinator", "social work", "nonprofit", "grassroots", "facilitation"],
  Accessibility: ["screen reader", "wcag", "a11y", "accessibility", "assistive", "adaptive", "sign language", "captioning"],
  General: [],
};