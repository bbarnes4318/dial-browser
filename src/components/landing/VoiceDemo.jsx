import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, Radio } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

// Simulated 15-second Dial Browser voice interaction script.
// System lines are spoken via on-device natural voice synthesis (no external audio).
const script = [
  { speaker: "system", text: "Welcome to 1 Call Away. How can I help you today?", duration: 3500 },
  { speaker: "user", text: "Order an Uber to the nearest coffee shop.", duration: 2800 },
  { speaker: "system", text: "Connecting you to Uber. A ride will arrive in 4 minutes.", duration: 3500 },
  { speaker: "user", text: "Perfect, thank you.", duration: 1500 },
  { speaker: "system", text: "Done. Have a great day. Goodbye.", duration: 2500 },
];

export default function VoiceDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLine, setActiveLine] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);
  const timeoutsRef = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const clearAll = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopSpeaking();
  };

  const handlePlay = () => {
    if (isPlaying) {
      clearAll();
      setIsPlaying(false);
      setActiveLine(-1);
      setElapsed(0);
      return;
    }

    clearAll();
    setIsPlaying(true);
    setElapsed(0);
    setActiveLine(0);

    const totalDuration = script.reduce((sum, line) => sum + line.duration, 0);
    let cumulative = 0;

    // Timer for progress
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const sec = (Date.now() - startTime) / 1000;
      setElapsed(Math.min(sec, totalDuration / 1000));
    }, 100);

    script.forEach((line, i) => {
      // Speak system lines via on-device natural voice synthesis; user lines are silent
      if (line.speaker === "system") {
        const speakTimeout = setTimeout(() => {
          speak(line.text, { rate: 0.95, volume: 0.95 });
        }, cumulative);
        timeoutsRef.current.push(speakTimeout);
      }

      const lineTimeout = setTimeout(() => {
        setActiveLine(i);
      }, cumulative);
      timeoutsRef.current.push(lineTimeout);

      cumulative += line.duration;
    });

    // End playback
    const endTimeout = setTimeout(() => {
      setIsPlaying(false);
      setActiveLine(-1);
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, totalDuration + 200);
    timeoutsRef.current.push(endTimeout);
  };

  useEffect(() => () => clearAll(), []);

  const totalDuration = script.reduce((sum, line) => sum + line.duration, 0) / 1000;
  const progress = Math.min((elapsed / totalDuration) * 100, 100);

  // Signal wave bars
  const bars = Array.from({ length: 48 }, (_, i) => i);

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10 text-center"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // LIVE VOICE SAMPLE
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Hear the Dial Browser
          </h2>
          <p className="text-base font-light max-w-xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            A 15-second simulated call. Press play to experience how 1 Call Away turns voice into action.
          </p>
        </motion.div>

        {/* Radio signal player */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative p-6 lg:p-10"
          style={{
            background: 'rgba(16,20,29,0.5)',
            border: '0.5px solid rgba(209,255,38,0.15)',
          }}
        >
          {/* Radio header bar */}
          <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.1)' }}>
            <div className="flex items-center gap-2">
              <Radio size={16} style={{ color: '#D1FF26' }} />
              <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: '#D1FF26' }}>
                DIAL BROWSER™ RADIO
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: isPlaying ? '#D1FF26' : '#8A8F98',
                  boxShadow: isPlaying ? '0 0 8px #D1FF26' : 'none',
                  animation: isPlaying ? 'dotPulse 1s ease-in-out infinite' : 'none',
                }}
              />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: isPlaying ? '#D1FF26' : '#8A8F98' }}>
                {isPlaying ? 'ON AIR' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Signal wave visualization */}
          <div className="relative h-32 flex items-center justify-center gap-[3px] mb-6 overflow-hidden">
            {bars.map((i) => {
              const center = bars.length / 2;
              const distance = Math.abs(i - center);
              const baseHeight = Math.max(8, 60 - distance * 2.5);
              const isActive = isPlaying;
              const animDelay = (i * 0.04) % 0.8;
              const animDuration = 0.4 + (i % 5) * 0.08;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full"
                  style={{
                    height: isActive ? `${baseHeight}%` : '8%',
                    background: isActive
                      ? `linear-gradient(180deg, #D1FF26, rgba(209,255,38,0.3))`
                      : 'rgba(138,143,152,0.15)',
                    boxShadow: isActive ? '0 0 6px rgba(209,255,38,0.4)' : 'none',
                    transition: 'height 0.3s ease',
                    animation: isActive
                      ? `waveFloat ${animDuration}s ease-in-out infinite`
                      : 'none',
                    animationDelay: `${animDelay}s`,
                    maxWidth: '6px',
                  }}
                />
              );
            })}
            {/* Center frequency line */}
            <div
              className="absolute left-0 right-0 top-1/2 h-px"
              style={{ background: 'rgba(209,255,38,0.08)' }}
            />
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                {elapsed.toFixed(1)}s
              </span>
              <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                {totalDuration.toFixed(0)}s
              </span>
            </div>
            <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(138,143,152,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, rgba(209,255,38,0.4), #D1FF26)',
                  boxShadow: '0 0 8px rgba(209,255,38,0.4)',
                }}
              />
            </div>
          </div>

          {/* Play button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handlePlay}
              className="group flex items-center gap-3 px-8 py-4 transition-all duration-300 hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]"
              style={{
                background: isPlaying ? 'rgba(209,255,38,0.1)' : '#D1FF26',
                border: '0.5px solid #D1FF26',
              }}
            >
              {isPlaying ? (
                <Pause size={20} style={{ color: '#D1FF26' }} />
              ) : (
                <Play size={20} style={{ color: '#05070A' }} fill="#05070A" />
              )}
              <span
                className="font-mono text-xs tracking-[0.3em] uppercase"
                style={{ color: isPlaying ? '#D1FF26' : '#05070A' }}
              >
                {isPlaying ? 'Stop' : 'Play Sample'}
              </span>
            </button>
          </div>

          {/* Live transcript */}
          <div className="space-y-2 min-h-[120px]">
            <AnimatePresence mode="wait">
              {script.map((line, i) => {
                const isActive = activeLine === i;
                const isPast = activeLine > i;
                if (!isPlaying && activeLine === -1 && !isPast) return null;
                return (
                  <AnimatePresence key={i}>
                    {(isActive || isPast) && (
                      <motion.div
                        initial={{ opacity: 0, x: line.speaker === 'system' ? -20 : 20 }}
                        animate={{ opacity: isActive ? 1 : 0.4, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-3"
                      >
                        <span
                          className="font-mono text-[9px] tracking-widest pt-1 flex-shrink-0 w-12"
                          style={{ color: line.speaker === 'system' ? '#D1FF26' : '#8A8F98' }}
                        >
                          {line.speaker === 'system' ? 'SYSTEM' : 'CALLER'}
                        </span>
                        <p
                          className="text-sm flex-1"
                          style={{
                            color: isActive ? '#F5F5F7' : '#8A8F98',
                            fontStyle: line.speaker === 'user' ? 'italic' : 'normal',
                          }}
                        >
                          {line.text}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })}
            </AnimatePresence>
            {!isPlaying && activeLine === -1 && (
              <p className="text-center font-mono text-[11px] tracking-wider" style={{ color: 'rgba(138,143,152,0.5)' }}>
                ▸ Press play to begin the simulated call
              </p>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 flex items-center justify-center gap-2" style={{ borderTop: '0.5px solid rgba(138,143,152,0.1)' }}>
            <Volume2 size={12} style={{ color: '#8A8F98' }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>
              LIVE VOICE SAMPLE · NATURAL SPEECH · ENABLE SOUND
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}