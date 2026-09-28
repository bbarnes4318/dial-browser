import React from "react";
import { Users, CheckCircle2, Timer, Target, AlertTriangle } from "lucide-react";

const fmtHours = (h) => {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${h}h`;
};

export default function InstructorAnalytics({ course, color }) {
  const a = course?.analytics || {};
  const fp = a.failure_points || [];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="ACTIVE STUDENTS" value={a.active_enrollments ?? 0} icon={Users} color={color} />
        <Stat label="COMPLETED" value={a.completed_enrollments ?? 0} icon={CheckCircle2} color={color} />
        <Stat label="AVG COMPLETION" value={fmtHours(a.avg_completion_hours)} icon={Timer} color={color} />
        <Stat label="EXAM PASS RATE" value={a.pass_rate == null ? "—" : `${a.pass_rate}%`} icon={Target} color={color} />
      </div>

      {/* Failure points */}
      <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color }}>▸ COMMON QUIZ FAILURE POINTS</p>
          </div>
          <span className="font-mono text-[8px] tracking-wider" style={{ color: "#8A8F98" }}>{a.attempt_count ?? 0} ATTEMPTS</span>
        </div>
        {fp.length === 0 ? (
          <p className="font-mono text-[9px] py-8 text-center" style={{ color: "#4A4F58" }}>NO ATTEMPT DATA YET</p>
        ) : (
          <div className="space-y-2">
            {fp.map((f, i) => (
              <div key={i} className="p-3" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(239,68,68,0.15)" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs leading-snug" style={{ color: "#F5F5F7" }}>{f.prompt}</p>
                  <span className="font-mono text-[8px] tracking-widest uppercase flex-shrink-0 px-1.5 py-0.5" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>{f.fails}/{f.total} wrong</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 h-1.5" style={{ background: "rgba(138,143,152,0.12)" }}>
                    <div className="h-full" style={{ width: `${f.fail_rate}%`, background: "linear-gradient(90deg, #ef4444, #f97316)" }} />
                  </div>
                  <span className="font-mono text-[8px] flex-shrink-0" style={{ color: "#8A8F98" }}>{f.fail_rate}% fail · {f.type || "q"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }) {
  return (
    <div className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} style={{ color }} />
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
      </div>
      <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{value}</p>
    </div>
  );
}