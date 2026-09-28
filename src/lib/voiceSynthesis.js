import { translateBatch } from "./clientTranslate";

/**
 * Shared voice synthesis utility — selects the most natural-sounding
 * voice available in the browser and provides a consistent speak() API.
 * Prefers neural/natural voices (Microsoft Natural, Google) over default
 * robotic ones, with optimized rate/pitch for human-like delivery.
 */

let cachedVoices = null;
let voicesLoaded = false;
let voiceLoadPromise = null;

// Active narration language — kept in sync with the LanguageContext so every
// voice feature on the platform speaks the user's selected language.
let currentLang = "en";
try {
  if (typeof localStorage !== "undefined") {
    currentLang = localStorage.getItem("lang") || "en";
  }
} catch (e) {}

export function setCurrentLang(lang) {
  if (lang && typeof lang === "string") currentLang = lang;
}

export function getCurrentLang() {
  return currentLang;
}

// Reuse the UI translation cache (written by AppTranslator) so a spoken string
// that already appears on the page is translated once and reused — no extra
// network calls and zero platform credits.
const TR_CACHE_PREFIX = "trCache:v2:";
function getCachedTr(lang, key) {
  try { return JSON.parse(localStorage.getItem(TR_CACHE_PREFIX + lang) || "{}")[key]; } catch { return undefined; }
}
function setCachedTr(lang, key, val) {
  try {
    const c = JSON.parse(localStorage.getItem(TR_CACHE_PREFIX + lang) || "{}");
    c[key] = val;
    localStorage.setItem(TR_CACHE_PREFIX + lang, JSON.stringify(c));
  } catch {}
}

const PREFERRED_VOICE_PATTERNS = [
  // Microsoft Natural (neural) voices — most human-like
  /Microsoft.*Natural/i,
  /Microsoft.*Online/i,
  /Microsoft.*Aria/i,
  /Microsoft.*Jenny/i,
  /Microsoft.*Guy/i,
  // Google voices — good quality
  /Google.*US/i,
  /Google.*English/i,
  // Apple premium voices
  /Samantha/i,
  /Alex/i,
  /Karen/i,
  /Daniel/i,
  /Allison/i,
  /Ava/i,
  /Serena/i,
];

// Voices that sound robotic — deprioritize these
const ROBOTIC_VOICE_PATTERNS = [
  /Microsoft.*David.*Desktop/i,
  /Microsoft.*Zira.*Desktop/i,
  /Microsoft.*Mark/i,
  /Google.*eSpeak/i,
  /espeak/i,
  /Robot/i,
];

/**
 * Loads available voices (handles async voice loading on Chrome).
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
export function loadVoices() {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      cachedVoices = existing;
      voicesLoaded = true;
      resolve(existing);
      return;
    }

    let resolved = false;
    const handler = () => {
      if (resolved) return;
      resolved = true;
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(cachedVoices);
    };

    window.speechSynthesis.addEventListener("voiceschanged", handler);
    // Fallback timeout — some browsers never fire the event
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(cachedVoices);
    }, 1000);
  });
}

/**
 * Ensures voices are loaded before proceeding. Returns a promise that
 * resolves once voices are available (or after timeout).
 */
function ensureVoicesLoaded() {
  if (voicesLoaded && cachedVoices && cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }
  if (!voiceLoadPromise) {
    voiceLoadPromise = loadVoices();
  }
  return voiceLoadPromise;
}

/**
 * Selects the best available natural voice for the active language
 * (defaults to the platform's selected language), preferring neural voices.
 * @param {string} [lang] — BCP-47 / ISO 639-1 code; falls back to current lang.
 * @returns {SpeechSynthesisVoice | null}
 */
export function getBestVoice(lang) {
  return getBestVoiceForLang(lang || currentLang);
}

/**
 * Selects the best available natural voice for a specific language,
 * preferring neural/natural voices and deprioritizing robotic ones.
 * @param {string} lang
 * @returns {SpeechSynthesisVoice | null}
 */
export function getBestVoiceForLang(lang) {
  if (!cachedVoices || cachedVoices.length === 0) {
    if (voicesLoaded) return null;
    if ("speechSynthesis" in window) {
      cachedVoices = window.speechSynthesis.getVoices();
    }
  }
  if (!cachedVoices || cachedVoices.length === 0) return null;

  const wanted = (lang || currentLang || "en").toLowerCase();
  const langVoices = cachedVoices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith(wanted)
  );
  const englishVoices = cachedVoices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith("en")
  );
  const pool = langVoices.length > 0 ? langVoices : englishVoices.length > 0 ? englishVoices : cachedVoices;

  // Filter out known robotic voices
  const nonRobotic = pool.filter(
    (v) => !ROBOTIC_VOICE_PATTERNS.some((p) => p.test(v.name))
  );
  const searchPool = nonRobotic.length > 0 ? nonRobotic : pool;

  // Try preferred patterns in order (English-centric; non-English falls through)
  for (const pattern of PREFERRED_VOICE_PATTERNS) {
    const match = searchPool.find((v) => pattern.test(v.name));
    if (match) return match;
  }

  // Fallback to first non-robotic voice for the language
  return searchPool[0] || pool[0] || cachedVoices[0] || null;
}

/**
 * Speaks text using the best available natural voice.
 * Waits for voices to load before speaking to avoid falling back to robotic voices.
 * @param {string} text — The text to speak
 * @param {object} options — { rate, pitch, volume, onEnd, onError, onStart }
 * @returns {Promise<SpeechSynthesisUtterance | null>}
 */
export async function speak(text, options = {}) {
  if (!("speechSynthesis" in window)) return null;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Ensure voices are loaded before selecting one
  await ensureVoicesLoaded();

  const speakLang = options.lang || currentLang || "en";
  let spokenText = text;
  if (speakLang !== "en" && !options.skipTranslate && /[a-zA-Z]/.test(text)) {
    const key = text.trim();
    const cached = getCachedTr(speakLang, key);
    if (cached) {
      spokenText = cached;
    } else {
      try {
        const [tr] = await translateBatch([text], speakLang);
        if (tr != null && tr.trim()) {
          spokenText = tr;
          setCachedTr(speakLang, key, tr);
        }
      } catch (e) {}
    }
  }
  const utterance = new SpeechSynthesisUtterance(spokenText);
  const voice = getBestVoice(speakLang);

  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = speakLang;

  // Optimized settings for natural-sounding speech
  utterance.rate = options.rate ?? 0.92;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;
  if (options.onStart) utterance.onstart = options.onStart;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stops any ongoing speech.
 */
export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Plays a pre-generated English audio URL when the app language is English,
 * otherwise speaks the translated fallbackText in the selected language via
 * TTS. Keeps pre-recorded English prompts in sync with non-English users.
 * @param {string} url — English audio file URL
 * @param {string} fallbackText — English text used for translated TTS / audio fallback
 * @param {object} options — { onEnd, onError, ...speak options }
 */
export function playVoiceLocalized(url, fallbackText, options = {}) {
  const lang = options.lang || currentLang || "en";
  const onEnd = options.onEnd;
  const onError = options.onError;
  if (lang !== "en" && fallbackText) {
    return speak(fallbackText, { ...options, onEnd, onError });
  }
  if (url) {
    try {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      const a = new Audio(url);
      if (onEnd) a.onended = onEnd;
      a.onerror = () => {
        if (fallbackText) speak(fallbackText, { ...options, lang: "en", onEnd, onError, skipTranslate: true });
        else if (onError) onError();
      };
      a.play().catch(() => {
        if (fallbackText) speak(fallbackText, { ...options, lang: "en", onEnd, onError, skipTranslate: true });
        else if (onError) onError();
      });
      return a;
    } catch (e) {
      if (fallbackText) return speak(fallbackText, { ...options, lang: "en", onEnd, onError, skipTranslate: true });
    }
  }
  if (fallbackText) return speak(fallbackText, { ...options, onEnd, onError });
  return null;
}

/**
 * Initializes voice loading on app startup. Call once early.
 */
export function initVoices() {
  if ("speechSynthesis" in window) {
    ensureVoicesLoaded();
  }
}