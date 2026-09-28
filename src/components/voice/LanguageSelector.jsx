import React from "react";
import { Globe, Volume2 } from "lucide-react";
import { languages, useLanguage } from "@/lib/LanguageContext";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

// Short confirmation phrases spoken in-language (real human voice) on change.
const CONFIRM = {
  en: "Language set to English.",
  es: "Idioma configurado a Español.",
  fr: "Langue définie sur Français.",
  de: "Sprache auf Deutsch eingestellt.",
  pt: "Idioma definido como Português.",
  it: "Lingua impostata su Italiano.",
  nl: "Taal ingesteld op Nederlands.",
  ru: "Язык установлен на Русский.",
  zh: "语言已设置为中文。",
  ja: "言語を日本語に設定しました。",
  ko: "언어가 한국어로 설정되었습니다.",
  ar: "تم تعيين اللغة إلى العربية.",
  hi: "भाषा हिन्दी पर सेट की गई।",
  tr: "Dil Türkçe olarak ayarlandı.",
  pl: "Język ustawiony na Polski.",
  sv: "Språk inställt på Svenska.",
};

export default function LanguageSelector({ compact = false }) {
  const { lang, setLang } = useLanguage();

  const handleChange = (e) => {
    const code = e.target.value;
    setLang(code);
    const native = languages.find((l) => l.code === code)?.native || code;
    const phrase = CONFIRM[code] || `Language set to ${native}.`;
    stopSpeaking();
    speak(phrase, { lang: code });
  };

  return (
    <div data-no-translate className={compact ? "flex items-center gap-3 flex-wrap" : "flex flex-col gap-2"}>
      <div className="flex items-center gap-2">
        <Globe size={14} style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LANGUAGE</span>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={lang}
          onChange={handleChange}
          className="px-3 py-2 font-mono text-xs outline-none cursor-pointer"
          style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#F5F5F7" }}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code} style={{ background: "#10141D", color: "#F5F5F7" }}>
              {l.native} — {l.label}
            </option>
          ))}
        </select>
        <Volume2 size={12} style={{ color: "#D1FF26" }} title="Confirmation spoken in a real human voice" />
      </div>
    </div>
  );
}