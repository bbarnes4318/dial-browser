import React, { createContext, useContext, useState, useEffect } from "react";
import { setCurrentLang } from "./voiceSynthesis";

const translations = {
  en: {
    "hero.signal": "Signal Active — System Online",
    "hero.tagline": "The Internet Is Just One Call Away",
    "hero.powered": "Powered by The Dial Browser™",
    "hero.cta": "Registration",
    "dialpad.title": "DIAL BROWSER™",
    "dialpad.hint": "PRESS 0–9 TO NAVIGATE",
    "dialpad.section.Hero": "Hero",
    "dialpad.section.Services": "Services",
    "dialpad.section.Catalog": "Catalog",
    "dialpad.section.Compare": "Compare",
    "dialpad.section.Creators": "Creators",
    "dialpad.section.Music": "Music",
    "dialpad.section.Demo": "Demo",
    "dialpad.section.Global": "Global",
    "dialpad.section.Revenue": "Revenue",
    "dialpad.section.Pricing": "Pricing",
    "dialpad.section.Contact": "Contact",
    "dialpad.section.FAQ": "FAQ",
    "footer.tagline": "The Internet Is Just One Call Away",
    "footer.contact": "Contact",
    "footer.earlyAccess": "Early Access",
    "footer.rights": "© {year} 1 CALL AWAY™ — All Rights Reserved",
    "switcher.label": "Language",
  },
  es: {
    "hero.signal": "Señal Activa — Sistema En Línea",
    "hero.tagline": "El Internet Está A Solo Una Llamada",
    "hero.powered": "Impulsado por The Dial Browser™",
    "hero.cta": "Registro",
    "dialpad.title": "MARCAR NAVEGADOR™",
    "dialpad.hint": "PRESIONA 0–9 PARA NAVEGAR",
    "dialpad.section.Hero": "Inicio",
    "dialpad.section.Services": "Servicios",
    "dialpad.section.Catalog": "Catálogo",
    "dialpad.section.Compare": "Comparar",
    "dialpad.section.Creators": "Creadores",
    "dialpad.section.Music": "Música",
    "dialpad.section.Demo": "Demo",
    "dialpad.section.Global": "Global",
    "dialpad.section.Revenue": "Ingresos",
    "dialpad.section.Pricing": "Precios",
    "dialpad.section.Contact": "Contacto",
    "dialpad.section.FAQ": "Preguntas",
    "footer.tagline": "El Internet Está A Solo Una Llamada",
    "footer.contact": "Contacto",
    "footer.earlyAccess": "Acceso Anticipado",
    "footer.rights": "© {year} 1 CALL AWAY™ — Todos los Derechos Reservados",
    "switcher.label": "Idioma",
  },
};

export const languages = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "fa", label: "Persian", native: "فارسی" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "pl", label: "Polish", native: "Polski" },
  { code: "uk", label: "Ukrainian", native: "Українська" },
  { code: "sv", label: "Swedish", native: "Svenska" },
  { code: "no", label: "Norwegian", native: "Norsk" },
  { code: "da", label: "Danish", native: "Dansk" },
  { code: "fi", label: "Finnish", native: "Suomi" },
  { code: "cs", label: "Czech", native: "Čeština" },
  { code: "el", label: "Greek", native: "Ελληνικά" },
  { code: "he", label: "Hebrew", native: "עברית" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", label: "Malay", native: "Bahasa Melayu" },
  { code: "sw", label: "Swahili", native: "Kiswahili" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "yo", label: "Yoruba", native: "Yorùbá" },
  { code: "ig", label: "Igbo", native: "Igbo" },
  { code: "ha", label: "Hausa", native: "Hausa" },
  { code: "zu", label: "Zulu", native: "isiZulu" },
  { code: "af", label: "Afrikaans", native: "Afrikaans" },
  { code: "tl", label: "Filipino", native: "Filipino" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ro", label: "Romanian", native: "Română" },
  { code: "hu", label: "Hungarian", native: "Magyar" },
  { code: "sk", label: "Slovak", native: "Slovenčina" },
  { code: "bg", label: "Bulgarian", native: "Български" },
  { code: "hr", label: "Croatian", native: "Hrvatski" },
  { code: "sr", label: "Serbian", native: "Српски" },
  { code: "lt", label: "Lithuanian", native: "Lietuvių" },
  { code: "lv", label: "Latvian", native: "Latviešu" },
  { code: "et", label: "Estonian", native: "Eesti" },
  { code: "sl", label: "Slovenian", native: "Slovenščina" },
  { code: "ga", label: "Irish", native: "Gaeilge" },
  { code: "cy", label: "Welsh", native: "Cymraeg" },
  { code: "is", label: "Icelandic", native: "Íslenska" },
  { code: "mt", label: "Maltese", native: "Malti" },
  { code: "kk", label: "Kazakh", native: "Қазақша" },
  { code: "uz", label: "Uzbek", native: "Oʻzbekcha" },
  { code: "km", label: "Khmer", native: "ខ្មែរ" },
  { code: "my", label: "Burmese", native: "မြန်မာ" },
  { code: "ne", label: "Nepali", native: "नेपाली" },
  { code: "si", label: "Sinhala", native: "සිංහල" },
];

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("lang") || "en";
    } catch (e) {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch (e) {}
    setCurrentLang(lang);
  }, [lang]);

  const t = (key, vars = {}) => {
    let str = translations.en[key] ?? key;
    Object.keys(vars).forEach((v) => {
      str = str.replace(`{${v}}`, vars[v]);
    });
    return str;
  };

  const toggleLang = () => setLang((l) => (l === "en" ? "es" : "en"));

  const isRTL = lang === "ar" || lang === "he" || lang === "ur" || lang === "fa";

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}