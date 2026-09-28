// Unique digital badge config for each of the 16 certified courses, keyed by
// the course's stable dial_code. Each badge pairs a distinct Lucide icon with
// the course's cover gradient so completed courses earn visually unique marks.
import {
  Sparkles, Ruler, HeartPulse, CalendarDays, Presentation, Wrench, Zap,
  ShieldCheck, Calculator, BatteryCharging, Microscope, Megaphone, Briefcase,
  Smartphone, Bug, Server,
} from "lucide-react";

export const COURSE_BADGES = [
  { dial_code: "*AI01", icon: Sparkles, name: "AI Earner", gradient: "linear-gradient(135deg, #D1FF26, #0A0F0A)" },
  { dial_code: "*ENG1", icon: Ruler, name: "Engineering Foundations", gradient: "linear-gradient(135deg, #5AC8E0, #0A0F1A)" },
  { dial_code: "*NURS", icon: HeartPulse, name: "Patient Care", gradient: "linear-gradient(135deg, #5AE0C8, #06121A)" },
  { dial_code: "*EVT1", icon: CalendarDays, name: "Event Planner", gradient: "linear-gradient(135deg, #E085A8, #1A0A12)" },
  { dial_code: "*TEACH", icon: Presentation, name: "Educator", gradient: "linear-gradient(135deg, #FBBF24, #1A1408)" },
  { dial_code: "*PLMB", icon: Wrench, name: "Plumbing Pro", gradient: "linear-gradient(135deg, #5A8FE0, #0A0F1A)" },
  { dial_code: "*ELEC", icon: Zap, name: "Electrical Safety", gradient: "linear-gradient(135deg, #FBBF24, #1A1402)" },
  { dial_code: "*SEC1", icon: ShieldCheck, name: "Security Officer", gradient: "linear-gradient(135deg, #94A3B8, #0A0E14)" },
  { dial_code: "*ACCT", icon: Calculator, name: "Bookkeeper", gradient: "linear-gradient(135deg, #60A5FA, #0A0E1A)" },
  { dial_code: "*EV01", icon: BatteryCharging, name: "EV Technician", gradient: "linear-gradient(135deg, #A3E635, #06120A)" },
  { dial_code: "*BIO1", icon: Microscope, name: "Life Scientist", gradient: "linear-gradient(135deg, #5AE07A, #06140A)" },
  { dial_code: "*MKT1", icon: Megaphone, name: "Marketer", gradient: "linear-gradient(135deg, #E0A85A, #1A1208)" },
  { dial_code: "*BUS1", icon: Briefcase, name: "Manager", gradient: "linear-gradient(135deg, #5A8FE0, #0A0E1A)" },
  { dial_code: "*SOC1", icon: Smartphone, name: "Social Specialist", gradient: "linear-gradient(135deg, #E085A8, #1A0A12)" },
  { dial_code: "*PEST", icon: Bug, name: "Pest Control", gradient: "linear-gradient(135deg, #9AE05A, #06120A)" },
  { dial_code: "*IT01", icon: Server, name: "IT Specialist", gradient: "linear-gradient(135deg, #5AC8E0, #06121A)" },
];

export function getCourseBadge(dialCode) {
  return COURSE_BADGES.find((b) => b.dial_code === dialCode) || null;
}