// Shared region geometry + member-location → region derivation.
// Mirrors the logic in base44/functions/broadcastEmergencySos/entry.ts — keep in sync.

export const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "northeast", label: "Northeast" },
  { value: "southeast", label: "Southeast" },
  { value: "midwest", label: "Midwest" },
  { value: "southwest", label: "Southwest" },
  { value: "west", label: "West" },
  { value: "national", label: "National" },
];

// Stylized rectangles over the continental US for map selection (Leaflet [lat,lng]).
export const REGION_BOUNDS = {
  west: [[32, -125], [49, -115]],
  southwest: [[25, -115], [37, -103]],
  midwest: [[36, -103], [49, -87]],
  southeast: [[24, -94], [37, -75]],
  northeast: [[37, -87], [48, -66]],
};

const STATE_TO_REGION = {
  ct: "northeast", me: "northeast", ma: "northeast", nh: "northeast", ri: "northeast", vt: "northeast",
  nj: "northeast", ny: "northeast", pa: "northeast",
  il: "midwest", in: "midwest", mi: "midwest", oh: "midwest", wi: "midwest",
  ia: "midwest", ks: "midwest", mn: "midwest", mo: "midwest", ne: "midwest", nd: "midwest", sd: "midwest",
  al: "southeast", de: "southeast", fl: "southeast", ga: "southeast", ky: "southeast",
  la: "southeast", md: "southeast", ms: "southeast", nc: "southeast", sc: "southeast",
  tn: "southeast", va: "southeast", wv: "southeast", dc: "southeast", ar: "southeast",
  az: "southwest", nm: "southwest", ok: "southwest", tx: "southwest",
  ak: "west", ca: "west", co: "west", hi: "west", id: "west", mt: "west",
  nv: "west", or: "west", ut: "west", wa: "west", wy: "west",
};

const FULL_NAME_TO_ABBR = {
  connecticut: "ct", maine: "me", massachusetts: "ma", "new hampshire": "nh", "rhode island": "ri", vermont: "vt",
  "new jersey": "nj", "new york": "ny", pennsylvania: "pa",
  illinois: "il", indiana: "in", michigan: "mi", ohio: "oh", wisconsin: "wi",
  iowa: "ia", kansas: "ks", minnesota: "mn", missouri: "mo", nebraska: "ne", "north dakota": "nd", "south dakota": "sd",
  alabama: "al", delaware: "de", florida: "fl", georgia: "ga", kentucky: "ky", louisiana: "la", maryland: "md",
  mississippi: "ms", "north carolina": "nc", "south carolina": "sc", tennessee: "tn", virginia: "va",
  "west virginia": "wv", "district of columbia": "dc", arkansas: "ar",
  arizona: "az", "new mexico": "nm", oklahoma: "ok", texas: "tx",
  alaska: "ak", california: "ca", colorado: "co", hawaii: "hi", idaho: "id", montana: "mt",
  nevada: "nv", oregon: "or", utah: "ut", washington: "wa", wyoming: "wy",
};

const REGION_NAMES = ["northeast", "southeast", "midwest", "southwest", "west"];

// Derive a member's region from their free-text `location` (city/state/region string).
// Returns one of the 5 region codes, or null if unmapped.
export function deriveRegion(location) {
  if (!location) return null;
  const s = String(location).toLowerCase();
  for (const r of REGION_NAMES) {
    if (new RegExp(`\\b${r}\\b`).test(s)) return r;
  }
  for (const [name, abbr] of Object.entries(FULL_NAME_TO_ABBR)) {
    if (s.includes(name)) return STATE_TO_REGION[abbr];
  }
  // 2-letter state code after a comma or at the start of the string ("New York, NY" / "NY")
  const abbrMatch = s.match(/(?:^|,\s*)([a-z]{2})\b/);
  if (abbrMatch && STATE_TO_REGION[abbrMatch[1]]) return STATE_TO_REGION[abbrMatch[1]];
  return null;
}