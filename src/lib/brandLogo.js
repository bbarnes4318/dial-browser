import { proxyMediaUrl } from "@/lib/mediaProxy";

// The new compass-dial brand mark. Routed through the app's media proxy so the
// raw storage URL never reaches the browser. Safe to use in <img src>, favicon,
// and sidebar lockups.
export const LOGO_RAW_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/217d51501_Gemini_Generated_Image_tp93ltp93ltp93lt.jpg";
export const LOGO_URL = proxyMediaUrl(LOGO_RAW_URL);

// The new cyber-retro "Dial Browser" branding banner — the hero focal mark.
// Also proxied so the raw storage URL never reaches the browser.
export const HERO_LOGO_RAW_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/fb6ce1439_Gemini_Generated_Image_k2rmf3k2rmf3k2rm.jpg";
export const HERO_LOGO_URL = proxyMediaUrl(HERO_LOGO_RAW_URL);

// The new vertical "phone dial" device graphic — a compact hero focal mark.
// Also proxied so the raw storage URL never reaches the browser.
export const HERO_DEVICE_LOGO_RAW_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/67b75214d_generated_image.png";
export const HERO_DEVICE_LOGO_URL = proxyMediaUrl(HERO_DEVICE_LOGO_RAW_URL);

// The cyber-retro "Dial Browser" promotional flyer — used as a homepage
// showcase image above the audio-demos section. Also proxied.
export const FLYER_RAW_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/f9f5a6cc4_Gemini_Generated_Image_4qvb644qvb644qvb.jpg";
export const FLYER_URL = proxyMediaUrl(FLYER_RAW_URL);

// The Dial Browser "Call. Connect. Browse." closing banner — shown at the
// bottom of the homepage. Routed through the media proxy like all platform media.
export const HOMEPAGE_BOTTOM_BANNER_RAW_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/4aa40472f_Gemini_Generated_Image_m5qpd9m5qpd9m5qp1.jpg";
export const HOMEPAGE_BOTTOM_BANNER_URL = proxyMediaUrl(HOMEPAGE_BOTTOM_BANNER_RAW_URL);