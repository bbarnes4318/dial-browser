// Shared radio-station allowlist used by voice-route (inbound <Play>) and
// bridge-radio-call (outbound radio bridge). Single source of truth so both
// the inbound and outbound radio paths can only ever stream these vetted MP3
// stations — never attacker-chosen audio. Twilio <Play> does not support HLS
// (BBC) reliably, so only MP3 streams are listed; Radio Paradise uses a
// dedicated MP3 stream for Twilio (the browser uses AAC).

export const RADIO_STATIONS = {
  groove:         { name: "Groove Salad",       streamUrl: "https://ice1.somafm.com/groovesalad-128-mp3" },
  beatblender:    { name: "Beat Blender",       streamUrl: "https://ice1.somafm.com/beatblender-128-mp3" },
  lush:           { name: "Lush Radio",         streamUrl: "https://ice1.somafm.com/lush-128-mp3" },
  indiepop:       { name: "Indie Pop Rocks",    streamUrl: "https://ice1.somafm.com/indiepop-128-mp3" },
  bootliquor:     { name: "Boot Liquor",        streamUrl: "https://ice1.somafm.com/bootliquor-128-mp3" },
  sonicuniverse:  { name: "Sonic Universe",     streamUrl: "https://ice1.somafm.com/sonicuniverse-128-mp3" },
  sevensoul:      { name: "Seven Inch Soul",    streamUrl: "https://ice1.somafm.com/7soul-128-mp3" },
  defcon:         { name: "DEF CON Radio",     streamUrl: "https://ice1.somafm.com/defcon-128-mp3" },
  spacestation:   { name: "Space Station",      streamUrl: "https://ice1.somafm.com/spacestation-128-mp3" },
  missioncontrol: { name: "Mission Control",    streamUrl: "https://ice1.somafm.com/missioncontrol-128-mp3" },
  blackrock:      { name: "Black Rock FM",      streamUrl: "https://ice1.somafm.com/blackrock-128-mp3" },
  cliqhop:        { name: "cliqhop idm",        streamUrl: "https://ice1.somafm.com/cliqhop-128-mp3" },
  doomed:         { name: "Doomed",             streamUrl: "https://ice1.somafm.com/doomed-128-mp3" },
  reggae:         { name: "Heavyweight Reggae", streamUrl: "https://ice1.somafm.com/reggae-128-mp3" },
  secretagent:    { name: "Secret Agent",      streamUrl: "https://ice1.somafm.com/secretagent-128-mp3" },
  thetrip:        { name: "The Trip",           streamUrl: "https://ice1.somafm.com/thetrip-128-mp3" },
  dronezone:      { name: "Drone Zone",         streamUrl: "https://ice1.somafm.com/dronezone-128-mp3" },
  suburbsofgoa:   { name: "Suburbs of Goa",     streamUrl: "https://ice1.somafm.com/suburbsofgoa-128-mp3" },
  folkfwd:        { name: "Folk Forward",       streamUrl: "https://ice1.somafm.com/folkfwd-128-mp3" },
  poptron:        { name: "PopTron",            streamUrl: "https://ice1.somafm.com/poptron-128-mp3" },
  radioparadise:  { name: "Radio Paradise",     streamUrl: "http://stream.radioparadise.com/mp3-192" },
  hot108:         { name: "Hot 108 Jamz",       streamUrl: "https://live.powerhitz.com/hot108?aw_0_req.gdpr=true" },
  lit:            { name: "Lit Hip-Hop+R&B",    streamUrl: "https://live.powerhitz.com/lit?aw_0_req.gdpr=true" },
  onepower:       { name: "1Power Hits",        streamUrl: "https://live.powerhitz.com/1power?aw_0_req.gdpr=true" },
  realrnb:        { name: "Real R&B",           streamUrl: "https://live.powerhitz.com/realrnb?aw_0_req.gdpr=true" },
  bumpin:         { name: "Classic Soul",       streamUrl: "https://live.powerhitz.com/bumpin?aw_0_req.gdpr=true" },
  backbounce:     { name: "BackBounce Old School", streamUrl: "https://live.powerhitz.com/backbounce?aw_0_req.gdpr=true" },
};

// Resolves a station id (e.g. "groove") OR an exact allowlisted stream URL to
// the vetted station object. Returns null for anything not on the allowlist so
// callers can never <Play> attacker-chosen audio.
export function resolveRadioStream(stationIdOrUrl) {
  if (!stationIdOrUrl) return null;
  const key = String(stationIdOrUrl).trim().toLowerCase();
  if (RADIO_STATIONS[key]) return RADIO_STATIONS[key];
  const url = String(stationIdOrUrl).trim();
  for (const s of Object.values(RADIO_STATIONS)) {
    if (s.streamUrl === url) return s;
  }
  return null;
}