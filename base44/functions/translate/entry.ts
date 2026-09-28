// translate — batch-translate UI text strings to the target language using
// free, no-key public endpoints (no platform credits consumed).
// Primary: Google's translate_a/single (client=tw-ob). Fallback: MyMemory.
// The client caches results per language in localStorage, so each unique
// string is translated once and persists across sessions.

const G = "https://translate.googleapis.com/translate_a/single";
const MM = "https://api.mymemory.translated.net/get";

async function googleT(text, target) {
  const url = `${G}?client=tw-ob&sl=en&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json,*/*" } });
  if (!res.ok) throw new Error(`google ${res.status}`);
  const data = await res.json();
  const out = (data[0] || []).map((seg) => (seg && seg[0]) || "").join("");
  if (!out) throw new Error("google empty");
  return out;
}

async function myMemoryT(text, target) {
  const url = `${MM}?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(target)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || /MYMEMORY WARNING|PLEASE SELECT|INVALID/.test(String(out))) throw new Error("mymemory reject");
  return out;
}

async function translateOne(text, target) {
  try { return await googleT(text, target); }
  catch { return await myMemoryT(text, target); }
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const texts = Array.isArray(body?.texts) ? body.texts.map((t) => String(t)).filter((t) => t.length > 0).slice(0, 100) : [];
    const target = (body?.target || "en").toString().slice(0, 5);
    if (!texts.length || target === "en") return Response.json({ translations: texts });

    const results = new Array(texts.length);
    const CONCURRENCY = 10;
    let idx = 0;
    const worker = async () => {
      while (idx < texts.length) {
        const i = idx++;
        try { results[i] = await translateOne(texts[i], target); }
        catch (e) { console.error("translate err:", texts[i], e.message); results[i] = texts[i]; }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, texts.length) }, worker));
    return Response.json({ translations: results });
  } catch (error) {
    console.error("translate error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});