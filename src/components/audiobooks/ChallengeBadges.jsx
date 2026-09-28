import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Award, Loader2, Lock, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Genre badges — one unlocked per audiobook genre the listener has finished.
const GENRE_BADGES = {
  Comedy: { name: "Comedy Connoisseur", icon: "🎭", description: "Finish a Comedy audiobook" },
  Action: { name: "Action Adventurer", icon: "💥", description: "Finish an Action audiobook" },
  Thriller: { name: "Thriller Seeker", icon: "🔪", description: "Finish a Thriller audiobook" },
  Mystery: { name: "Mystery Solver", icon: "🔍", description: "Finish a Mystery audiobook" },
  Romance: { name: "Romance Romantic", icon: "💖", description: "Finish a Romance audiobook" },
  War: { name: "War Historian", icon: "🎖️", description: "Finish a War audiobook" },
  History: { name: "History Buff", icon: "📜", description: "Finish a History audiobook" },
  Crime: { name: "Crime Detective", icon: "🚨", description: "Finish a Crime audiobook" },
  Educational: { name: "Lifelong Learner", icon: "🎓", description: "Finish an Educational audiobook" },
  Documentaries: { name: "Documentarian", icon: "🎥", description: "Finish a Documentary audiobook" },
  "Children's": { name: "Storytime Star", icon: "🧸", description: "Finish a Children's audiobook" },
  Drama: { name: "Drama Devotee", icon: "🎬", description: "Finish a Drama audiobook" },
  Urban: { name: "Urban Explorer", icon: "🌃", description: "Finish an Urban audiobook" },
};

// Milestone badges — unlocked by total listening volume across all books.
const MILESTONE_BADGES = [
  { key: "milestone:first_finish", name: "First Finish", icon: "🎧", description: "Complete your first audiobook", check: (s) => s.completedCount >= 1 },
  { key: "milestone:bookworm", name: "Bookworm", icon: "📚", description: "Complete 5 audiobooks", check: (s) => s.completedCount >= 5 },
  { key: "milestone:binge", name: "Binge Listener", icon: "🔥", description: "Complete 10 audiobooks", check: (s) => s.completedCount >= 10 },
  { key: "milestone:marathon", name: "Marathon Listener", icon: "🏆", description: "Listen for 10 hours total", check: (s) => s.totalMinutes >= 600 },
  { key: "milestone:century", name: "Century Listener", icon: "💯", description: "Listen for 100 hours total", check: (s) => s.totalMinutes >= 6000 },
];

export default function ChallengeBadges({ books = [] }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earned, setEarned] = useState({}); // badge_key -> unlocked_at
  const [stats, setStats] = useState({ completedCount: 0, totalMinutes: 0 });

  const bookMap = useMemo(() => new Map((books || []).map((b) => [b.id, b])), [books]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [progress, badges] = await Promise.all([
          base44.entities.AudiobookProgress.filter({ created_by_id: user.id }, "-updated_date", 200),
          base44.entities.ListenerBadge.filter({ created_by_id: user.id }, "-unlocked_at", 200),
        ]);
        if (cancelled) return;

        // Compute listening stats from progress records.
        let totalSeconds = 0;
        let completedCount = 0;
        const genresCompleted = new Set();
        (progress || []).forEach((p) => {
          totalSeconds += p.position_seconds || 0;
          if (p.completed) {
            completedCount += 1;
            const book = bookMap.get(p.audiobook_id);
            if (book?.genre && GENRE_BADGES[book.genre]) genresCompleted.add(book.genre);
          }
        });
        const totalMinutes = totalSeconds / 60;
        const computed = { completedCount, totalMinutes };
        setStats(computed);
        if (cancelled) return;

        // Determine the full set of earned badge keys.
        const earnedKeys = new Set();
        Object.keys(GENRE_BADGES).forEach((g) => {
          if (genresCompleted.has(g)) earnedKeys.add(`genre:${g}`);
        });
        MILESTONE_BADGES.forEach((m) => {
          if (m.check(computed)) earnedKeys.add(m.key);
        });

        // Reconcile against stored ListenerBadge records; persist any newly earned.
        const stored = {};
        (badges || []).forEach((b) => { stored[b.badge_key] = b.unlocked_at || b.created_date; });
        const toCreate = [];
        const merged = { ...stored };
        const now = new Date().toISOString();
        earnedKeys.forEach((key) => {
          if (!stored[key]) {
            merged[key] = now;
            const isGenre = key.startsWith("genre:");
            const def = isGenre
              ? GENRE_BADGES[key.slice(6)]
              : MILESTONE_BADGES.find((m) => m.key === key);
            if (def) {
              toCreate.push(
                base44.entities.ListenerBadge.create({
                  owner_user_id: user.id,
                  badge_type: isGenre ? "genre" : "milestone",
                  badge_key: key,
                  badge_name: def.name,
                  description: def.description,
                  icon: def.icon,
                  unlocked_at: now,
                }).catch(() => {})
              );
            }
          }
        });
        setEarned(merged);
        if (toCreate.length) Promise.all(toCreate).catch(() => {});
      } catch {
        // non-fatal — just show locked state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, bookMap]);

  const allBadges = [
    ...Object.entries(GENRE_BADGES).map(([g, def]) => ({
      key: `genre:${g}`, type: "genre", name: def.name, icon: def.icon, description: def.description,
      unlocked: !!earned[`genre:${g}`], unlockedAt: earned[`genre:${g}`],
    })),
    ...MILESTONE_BADGES.map((m) => ({
      key: m.key, type: "milestone", name: m.name, icon: m.icon, description: m.description,
      unlocked: !!earned[m.key], unlockedAt: earned[m.key],
    })),
  ];

  const unlockedCount = allBadges.filter((b) => b.unlocked).length;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-1.5">
        <Trophy size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ LISTENER BADGES</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{unlockedCount}/{allBadges.length} UNLOCKED</span>
      </div>
      <p className="text-[11px] mb-4 max-w-xl" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Finish audiobooks in new genres and rack up listening hours to unlock digital badges. {stats.completedCount > 0 && (
          <span style={{ color: "#D1FF26" }}>{stats.completedCount} finished · {Math.round(stats.totalMinutes)} min listened.</span>
        )}
      </p>

      {loading ? (
        <div className="flex items-center gap-2 py-6"><Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} /><span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SYNCING BADGES…</span></div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {allBadges.map((b, i) => (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              title={b.unlocked ? `${b.name} — ${b.description}` : `Locked: ${b.description}`}
              className="flex flex-col items-center text-center p-3"
              style={{
                background: b.unlocked ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.5)",
                border: `0.5px solid ${b.unlocked ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
                boxShadow: b.unlocked ? "0 0 14px rgba(209,255,38,0.12)" : "none",
              }}
            >
              <div
                className="flex items-center justify-center w-11 h-11 mb-2 text-xl"
                style={{
                  background: b.unlocked ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
                  border: `0.5px solid ${b.unlocked ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.15)"}`,
                  filter: b.unlocked ? "none" : "grayscale(1)",
                  opacity: b.unlocked ? 1 : 0.4,
                }}
              >
                {b.unlocked ? b.icon : <Lock size={14} style={{ color: "#8A8F98" }} />}
              </div>
              <p className="font-mono text-[8px] tracking-wider uppercase leading-tight" style={{ color: b.unlocked ? "#D1FF26" : "#8A8F98" }}>
                {b.name}
              </p>
              {b.unlocked && b.unlockedAt && (
                <p className="font-mono text-[6px] tracking-wider mt-0.5" style={{ color: "rgba(138,143,152,0.6)" }}>
                  {new Date(b.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}