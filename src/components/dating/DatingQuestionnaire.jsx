import React from "react";

// Standard dating questionnaire — dropdown / multi-select fields shared by the
// profile builder. Options live here so the builder and the profile card stay
// in sync. Keys match the DatingProfile entity enum values.
export const QUESTIONNAIRE = [
  { key: "height", label: "Height", options: ["prefer_not_to_say", "under_5ft", "5_0_to_5_3", "5_4_to_5_7", "5_8_to_5_11", "6_0_plus"] },
  { key: "body_type", label: "Body Type", options: ["prefer_not_to_say", "slim", "athletic", "average", "curvy", "plus_size"] },
  { key: "education", label: "Education", options: ["prefer_not_to_say", "high_school", "some_college", "associates", "bachelors", "masters", "doctorate"] },
  { key: "drinking", label: "Drinking", options: ["prefer_not_to_say", "never", "rarely", "socially", "often"] },
  { key: "smoking", label: "Smoking", options: ["prefer_not_to_say", "never", "sometimes", "often", "quit"] },
  { key: "kids", label: "Do you have kids?", options: ["prefer_not_to_say", "no_kids", "has_kids"] },
  { key: "want_kids", label: "Want kids?", options: ["prefer_not_to_say", "want_kids", "dont_want_kids", "open_to_it"] },
  { key: "religion", label: "Religion", options: ["prefer_not_to_say", "christian", "muslim", "jewish", "hindu", "buddhist", "atheist", "agnostic", "spiritual", "other"] },
  { key: "ethnicity", label: "Ethnicity", options: ["prefer_not_to_say", "black", "white", "latino", "asian", "middle_eastern", "native_american", "mixed", "other"] },
  { key: "zodiac", label: "Zodiac", options: ["prefer_not_to_say", "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] },
];

export const INTEREST_OPTIONS = ["music", "sports", "travel", "cooking", "gaming", "reading", "fitness", "art", "movies", "hiking", "tech", "fashion", "photography", "dancing", "yoga"];

// Music-genre tags — selected alongside hobbies so members can match on
// shared music taste. Keys align with the DatingProfile.music_genres enum.
export const MUSIC_GENRE_OPTIONS = ["hip_hop", "electronic", "jazz", "rnb", "pop", "rock", "ambient", "country", "world", "indie", "lofi", "experimental"];

export const MUSIC_LABELS = {
  hip_hop: "Hip-Hop", electronic: "Electronic", jazz: "Jazz", rnb: "R&B", pop: "Pop", rock: "Rock", ambient: "Ambient", country: "Country", world: "World", indie: "Indie", lofi: "Lo-Fi", experimental: "Experimental",
};

// Human-readable labels for display on profile cards.
export const LABELS = {
  height: { under_5ft: "Under 5'0\"", "5_0_to_5_3": "5'0\"–5'3\"", "5_4_to_5_7": "5'4\"–5'7\"", "5_8_to_5_11": "5'8\"–5'11\"", "6_0_plus": "6'0\"+", prefer_not_to_say: "—" },
  body_type: { slim: "Slim", athletic: "Athletic", average: "Average", curvy: "Curvy", plus_size: "Plus-size", prefer_not_to_say: "—" },
  education: { high_school: "High school", some_college: "Some college", associates: "Associate's", bachelors: "Bachelor's", masters: "Master's", doctorate: "Doctorate", prefer_not_to_say: "—" },
  drinking: { never: "Never", rarely: "Rarely", socially: "Socially", often: "Often", prefer_not_to_say: "—" },
  smoking: { never: "Never", sometimes: "Sometimes", often: "Often", quit: "Quit", prefer_not_to_say: "—" },
  kids: { no_kids: "No kids", has_kids: "Has kids", prefer_not_to_say: "—" },
  want_kids: { want_kids: "Want kids", dont_want_kids: "Don't want kids", open_to_it: "Open to it", prefer_not_to_say: "—" },
  religion: { christian: "Christian", muslim: "Muslim", jewish: "Jewish", hindu: "Hindu", buddhist: "Buddhist", atheist: "Atheist", agnostic: "Agnostic", spiritual: "Spiritual", other: "Other", prefer_not_to_say: "—" },
  ethnicity: { black: "Black", white: "White", latino: "Latino/Hispanic", asian: "Asian", middle_eastern: "Middle Eastern", native_american: "Native American", mixed: "Mixed", other: "Other", prefer_not_to_say: "—" },
  zodiac: { aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer", leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio", sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces", prefer_not_to_say: "—" },
  interests: { music: "Music", sports: "Sports", travel: "Travel", cooking: "Cooking", gaming: "Gaming", reading: "Reading", fitness: "Fitness", art: "Art", movies: "Movies", hiking: "Hiking", tech: "Tech", fashion: "Fashion", photography: "Photography", dancing: "Dancing", yoga: "Yoga" },
};

export function Dropdown({ label, value, options, onChange, fieldKey }) {
  const fieldLabels = (fieldKey && LABELS[fieldKey]) || {};
  return (
    <div>
      <label className="font-mono text-[8px] tracking-widest mb-1 block" style={{ color: "#8A8F98" }}>{label.toUpperCase()}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 text-sm outline-none"
        style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
      >
        {!options.includes(value || "") && <option value="">Select…</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>{fieldLabels[opt] || opt.replace(/_/g, " ")}</option>
        ))}
      </select>
    </div>
  );
}

export function InterestPicker({ selected, onToggle }) {
  return (
    <div>
      <label className="font-mono text-[8px] tracking-widest mb-1 block" style={{ color: "#8A8F98" }}>INTERESTS (SELECT ALL THAT APPLY)</label>
      <div className="flex flex-wrap gap-1.5">
        {INTEREST_OPTIONS.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: on ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${on ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
                color: on ? "#D1FF26" : "#8A8F98",
              }}
            >
              {LABELS.interests[opt]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MusicGenrePicker({ selected, onToggle }) {
  return (
    <div>
      <label className="font-mono text-[8px] tracking-widest mb-1 block" style={{ color: "#8A8F98" }}>TOP MUSIC GENRES (SELECT UP TO 5)</label>
      <div className="flex flex-wrap gap-1.5">
        {MUSIC_GENRE_OPTIONS.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              disabled={!on && selected.length >= 5}
              className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
              style={{
                background: on ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${on ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
                color: on ? "#D1FF26" : "#8A8F98",
              }}
            >
              {MUSIC_LABELS[opt]}
            </button>
          );
        })}
      </div>
    </div>
  );
}