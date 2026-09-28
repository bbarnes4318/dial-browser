import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Cloud, Sun, CloudRain, Wind, Droplets, Eye, Thermometer, Globe2, Phone, Loader2, Mic, MicOff, MapPin, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const QUICK_CITIES = [
  { name: "New York", query: "New York City current weather" },
  { name: "London", query: "London UK current weather" },
  { name: "Tokyo", query: "Tokyo Japan current weather" },
  { name: "Lagos", query: "Lagos Nigeria current weather" },
  { name: "São Paulo", query: "Sao Paulo Brazil current weather" },
  { name: "Mumbai", query: "Mumbai India current weather" },
  { name: "Dubai", query: "Dubai UAE current weather" },
  { name: "Sydney", query: "Sydney Australia current weather" },
];

const WEATHER_SCHEMA = {
  type: "object",
  properties: {
    location: { type: "string" },
    temperature_c: { type: "number" },
    temperature_f: { type: "number" },
    condition: { type: "string" },
    humidity: { type: "number" },
    wind_kmh: { type: "number" },
    visibility_km: { type: "number" },
    feels_like_c: { type: "number" },
    sunrise: { type: "string" },
    sunset: { type: "string" },
    forecast: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          high_c: { type: "number" },
          low_c: { type: "number" },
          condition: { type: "string" },
        },
      },
    },
  },
};

function getWeatherIcon(condition) {
  const c = (condition || "").toLowerCase();
  if (c.includes("sun") || c.includes("clear") || c.includes("hot")) return Sun;
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return CloudRain;
  return Cloud;
}

export default function OneCallWeather() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [subName, setSubName] = useState("");
  const [subPhone, setSubPhone] = useState("");
  const [subLocation, setSubLocation] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubscribing(true);
    try {
      await base44.entities.WeatherSubscription.create({
        full_name: subName,
        phone: subPhone,
        location: subLocation,
        active: true,
      });
      setSubscribed(true);
      setSubName(""); setSubPhone(""); setSubLocation("");
    } catch (err) {}
    setSubscribing(false);
  };
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setListening(false);
      fetchWeather(transcript);
    };
    recognition.onerror = (event) => {
      setVoiceError(event.error === "not-allowed" ? "Microphone permission denied" : "Voice input failed");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      setVoiceError("Voice input not supported in this browser");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setVoiceError(null);
      setWeather(null);
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        setListening(false);
      }
    }
  };

  const fetchWeather = async (cityQuery) => {
    if (!cityQuery) return;
    setLoading(true);
    setWeather(null);
    try {
      const res = (await base44.functions.invoke("weather-briefing", { query: cityQuery })).data;
      setWeather(res);
    } catch (e) {
      setWeather(null);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeather(query);
  };

  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Cloud;

  return (
    <section id="weather" className="snap-section relative overflow-hidden py-20 px-6 lg:px-16" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06), transparent 70%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Globe2 size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// 1 CALL WEATHER™</span>
          </div>
          <h2 className="font-heading font-black text-4xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            AI Global Weather<br /><span style={{ color: "#D1FF26" }}>24/7 Forecasting</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#8A8F98" }}>
            Get real-time weather and forecasts for any location on Earth — by voice or text search. Powered by AI with live web data.
          </p>
        </motion.div>

        {/* Dial code banner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <div className="flex items-center gap-2 px-5 py-2.5" style={{ background: "rgba(209,255,38,0.1)", border: "1px solid rgba(209,255,38,0.4)" }}>
            <Phone size={14} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-sm font-bold" style={{ color: "#D1FF26" }}>*109#</span>
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>SAY "WEATHER"</span>
          </div>
        </motion.div>

        {/* Search bar with voice button */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto mb-4">
          <div className="flex-1 relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter any city, zip code, or location..."
              className="w-full pl-11 pr-12 py-3.5 font-mono text-sm bg-transparent focus:outline-none transition-all"
              style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
            />
            <button
              type="button"
              onClick={toggleVoice}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-all"
              style={{
                background: listening ? "rgba(239,68,68,0.15)" : "rgba(209,255,38,0.08)",
                border: `0.5px solid ${listening ? "rgba(239,68,68,0.4)" : "rgba(209,255,38,0.3)"}`,
              }}
              title="Search by voice"
            >
              {listening ? <MicOff size={14} style={{ color: "#EF4444" }} /> : <Mic size={14} style={{ color: "#D1FF26" }} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !query}
            className="px-8 py-3.5 font-mono text-sm font-bold tracking-widest transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)] disabled:opacity-40"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "GET FORECAST"}
          </button>
        </form>

        {/* Voice status / error */}
        {listening && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#EF4444" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#EF4444", animationDelay: "0.2s" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#EF4444", animationDelay: "0.4s" }} />
              </div>
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#EF4444" }}>LISTENING... SPEAK A LOCATION</span>
            </div>
          </div>
        )}
        {voiceError && !listening && (
          <p className="text-center font-mono text-[10px] tracking-widest mb-6" style={{ color: "rgba(239,68,68,0.6)" }}>⚠ {voiceError.toUpperCase()}</p>
        )}

        {/* Quick cities */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {QUICK_CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => { setQuery(city.name); fetchWeather(city.query); }}
              disabled={loading}
              className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.1)] disabled:opacity-40"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        )}

        {weather && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {/* Main card */}
            <div className="lg:col-span-2 p-8" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>// CURRENT CONDITIONS</p>
                  <h3 className="font-heading font-bold text-2xl" style={{ color: "#F5F5F7" }}>{weather.location}</h3>
                </div>
                <WeatherIcon size={48} style={{ color: "#D1FF26" }} />
              </div>
              <div className="flex items-end gap-6 mb-6">
                <div>
                  <p className="font-heading font-black text-6xl" style={{ color: "#F5F5F7" }}>{Math.round(weather.temperature_c)}°C</p>
                  <p className="font-mono text-sm" style={{ color: "#8A8F98" }}>{Math.round(weather.temperature_f)}°F · Feels like {Math.round(weather.feels_like_c)}°C</p>
                </div>
                <p className="font-heading font-semibold text-lg pb-2" style={{ color: "#D1FF26" }}>{weather.condition}</p>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-1 p-3" style={{ background: "rgba(209,255,38,0.04)" }}>
                  <Droplets size={16} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>HUMIDITY</span>
                  <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{weather.humidity}%</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3" style={{ background: "rgba(209,255,38,0.04)" }}>
                  <Wind size={16} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>WIND</span>
                  <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{weather.wind_kmh} km/h</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3" style={{ background: "rgba(209,255,38,0.04)" }}>
                  <Eye size={16} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>VISIBILITY</span>
                  <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{weather.visibility_km} km</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3" style={{ background: "rgba(209,255,38,0.04)" }}>
                  <Thermometer size={16} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>FEELS</span>
                  <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{Math.round(weather.feels_like_c)}°</span>
                </div>
              </div>
              {weather.sunrise && weather.sunset && (
                <div className="flex justify-between mt-4 pt-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>🌅 Sunrise: {weather.sunrise}</span>
                  <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>🌇 Sunset: {weather.sunset}</span>
                </div>
              )}
            </div>

            {/* 5-day forecast */}
            <div className="p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>// 5-DAY FORECAST</p>
              {weather.forecast && weather.forecast.map((day, i) => {
                const FIcon = getWeatherIcon(day.condition);
                return (
                  <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < weather.forecast.length - 1 ? "0.5px solid rgba(138,143,152,0.08)" : "none" }}>
                    <span className="font-mono text-xs w-12" style={{ color: "#8A8F98" }}>{day.day}</span>
                    <FIcon size={18} style={{ color: "#D1FF26" }} />
                    <span className="text-xs flex-1 text-right pr-2" style={{ color: "#8A8F98" }}>{day.condition}</span>
                    <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{Math.round(day.high_c)}°</span>
                    <span className="font-mono text-xs ml-1" style={{ color: "rgba(138,143,152,0.5)" }}>{Math.round(day.low_c)}°</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {!weather && !loading && (
          <div className="text-center py-12">
            <Cloud size={64} className="mx-auto mb-4" style={{ color: "rgba(209,255,38,0.2)" }} />
            <p className="font-mono text-xs tracking-widest" style={{ color: "#8A8F98" }}>SEARCH ANY CITY, USE VOICE 🎤, OR DIAL *109# FOR LIVE WEATHER</p>
          </div>
        )}

        {/* Daily SMS Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-10 max-w-2xl mx-auto p-6"
          style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Phone size={14} style={{ color: "#D1FF26" }} />
            <h3 className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>Daily Forecast by SMS</h3>
          </div>
          <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
            Get your local weather forecast texted to you every morning at 7 AM EST. Just a simple text message — no app required.
          </p>
          {subscribed ? (
            <div className="flex items-center gap-2 p-4" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
              <CheckCircle2 size={18} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-xs" style={{ color: "#D1FF26" }}>SUBSCRIBED! You'll receive your first forecast tomorrow morning.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={subName} onChange={(e) => setSubName(e.target.value)} required placeholder="Your name" className="flex-1 px-4 py-3 font-mono text-sm bg-transparent focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
              <input type="tel" value={subPhone} onChange={(e) => setSubPhone(e.target.value)} required placeholder="Phone number" className="flex-1 px-4 py-3 font-mono text-sm bg-transparent focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
              <input type="text" value={subLocation} onChange={(e) => setSubLocation(e.target.value)} required placeholder="Your city" className="flex-1 px-4 py-3 font-mono text-sm bg-transparent focus:outline-none" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
              <button type="submit" disabled={subscribing} className="px-6 py-3 font-mono text-[10px] tracking-widest font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)] disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                {subscribing ? <Loader2 size={14} className="animate-spin mx-auto" /> : "SUBSCRIBE"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}