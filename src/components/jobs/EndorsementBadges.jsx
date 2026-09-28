import React from "react";
import { Star, BadgeCheck } from "lucide-react";

/**
 * EndorsementBadges — compact display of skill endorsements on a candidate card.
 * Shows top-endorsed skills with their star rating and endorsement count.
 */
export default function EndorsementBadges({ endorsements = [], maxDisplay = 3 }) {
  if (!endorsements || endorsements.length === 0) return null;

  // Group by skill, compute average rating + count
  const bySkill = {};
  for (const end of endorsements) {
    if (!bySkill[end.skill]) {
      bySkill[end.skill] = { skill: end.skill, total: 0, count: 0, ratingSum: 0 };
    }
    bySkill[end.skill].ratingSum += end.rating || 0;
    bySkill[end.skill].count += 1;
  }

  const skills = Object.values(bySkill)
    .map((s) => ({ ...s, avg: s.ratingSum / s.count }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg)
    .slice(0, maxDisplay);

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {skills.map((s) => (
        <span
          key={s.skill}
          className="inline-flex items-center gap-1 font-mono text-[7px] tracking-widest px-1.5 py-0.5"
          style={{
            background: "rgba(209,255,38,0.1)",
            border: "0.5px solid rgba(209,255,38,0.2)",
            color: "#D1FF26",
          }}
          title={`${s.skill}: ${s.avg.toFixed(1)}★ from ${s.count} endorser${s.count === 1 ? "" : "s"}`}
        >
          <BadgeCheck size={8} />
          {s.skill.toUpperCase()}
          <span className="flex items-center gap-0.5" style={{ color: "rgba(209,255,38,0.7)" }}>
            <Star size={7} fill="#D1FF26" style={{ color: "#D1FF26" }} />
            {s.avg.toFixed(1)}
          </span>
          {s.count > 1 && <span style={{ color: "rgba(138,143,152,0.6)" }}>×{s.count}</span>}
        </span>
      ))}
      {Object.keys(bySkill).length > maxDisplay && (
        <span className="font-mono text-[7px] py-0.5" style={{ color: "rgba(138,143,152,0.5)" }}>
          +{Object.keys(bySkill).length - maxDisplay}
        </span>
      )}
    </div>
  );
}