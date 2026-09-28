// Client-side translation using free, no-key public endpoints.
// Runs in the browser so it uses each user's own IP (no shared backend
// rate-limiting) and consumes zero platform credits. Tries several Google
// translate_a/single client variants, then MyMemory as a fallback. Returns
// null for entries that genuinely fail (so the caller can retry them) and the
// translated string (which may equal the source for proper nouns) on success.
// Results are cached per language in localStorage by the caller.

const G = "https://translate.googleapis.com/translate_a/single";
const MM = "https://api.mymemory.translated.net/get";

function parseGoogle(data) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return "";
  return data[0].map((s) => (s && s[0]) || "").join("");
}

async function googleVariant(client, text, target) {
  const url = `${G}?client=${client}&sl=en&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`google ${client} ${res.status}`);
  const out = parseGoogle(await res.json());
  if (!out) throw new Error(`google ${client} empty`);
  return out;
}

async function myMemoryT(text, target) {
  const url = `${MM}?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(target)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mm ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || /MYMEMORY WARNING|PLEASE SELECT|INVALID|PLEASE ENTER|QUERY LENGTH LIMIT|NO QUERY SPECIFIED/i.test(String(out))) {
    throw new Error("mm reject");
  }
  return out;
}

const VARIANTS = [
  (t, l) => googleVariant("tw-ob", t, l),
  (t, l) => googleVariant("dict-chrome-sentence", t, l),
  (t, l) => googleVariant("gtx", t, l),
  myMemoryT,
];

// Returns the translated string (may equal source for proper nouns), or null on failure.
async function translateOne(text, target) {
  for (const fn of VARIANTS) {
    try {
      const out = await fn(text, target);
      if (out && out.trim()) return out;
    } catch (e) {}
  }
  return null;
}

export async function translateBatch(texts, target, concurrency = 5) {
  const out = new Array(texts.length).fill(null);
  let idx = 0;
  const worker = async () => {
    while (idx < texts.length) {
      const i = idx++;
      out[i] = await translateOne(texts[i], target);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, texts.length) }, worker));
  return out;
}