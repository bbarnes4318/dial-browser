import React, { useState, useRef } from "react";
import { Mic, X, Search } from "lucide-react";

/**
 * Voice + text search bar. Uses the browser SpeechRecognition API for voice.
 * Calls onSearch(query) with the recognized or typed text.
 */
export default function SocialVoiceSearch({ onSearch, placeholder = "Speak or type to search posts & profiles" }) {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice search not supported in this browser. Type your search instead.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setQuery(text);
      onSearch?.(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stopListening = () => {
    recRef.current?.stop();
    setListening(false);
  };

  const handleChange = (v) => {
    setQuery(v);
    onSearch?.(v.trim());
  };

  const clear = () => {
    setQuery("");
    onSearch?.("");
  };

  return (
    <div className="relative flex items-center gap-2 w-full">
      <Search size={14} className="absolute left-3" style={{ color: "#8A8F98" }} />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={listening ? "Listening..." : placeholder}
        className="w-full pl-9 pr-24 py-2.5 text-sm outline-none"
        style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
      />
      <div className="absolute right-2 flex items-center gap-1">
        {query && (
          <button onClick={clear} className="p-1.5 hover:opacity-80" style={{ color: "#8A8F98" }}>
            <X size={13} />
          </button>
        )}
        <button
          onClick={listening ? stopListening : startListening}
          className="flex items-center justify-center w-8 h-8 transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.3)]"
          style={{
            background: listening ? "rgba(239,68,68,0.15)" : "rgba(209,255,38,0.08)",
            border: listening ? "0.5px solid rgba(239,68,68,0.4)" : "0.5px solid rgba(209,255,38,0.3)",
            color: listening ? "#ef4444" : "#D1FF26",
          }}
        >
          <Mic size={14} className={listening ? "animate-pulse" : ""} />
        </button>
      </div>
    </div>
  );
}