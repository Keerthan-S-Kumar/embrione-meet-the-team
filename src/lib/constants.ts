// Single source of truth for every dropdown. The same lists are enforced in supabase/schema.sql.

export const DOMAINS = [
  "Web Development",
  "Design",
  "Logistics",
  "Operations",
  "Sponsorship",
  "Hospitality",
  "Social Media",
  "Event Management",
] as const;

export const POSITIONS = ["Head", "Vice-Head", "Core Member", "Member"] as const;

export const BRANCHES = ["CSE", "AIML", "ECE", "EEE", "ME", "Civil", "Biotech", "Other"] as const;

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type Domain = (typeof DOMAINS)[number];
export type Position = (typeof POSITIONS)[number];
export type Status = "pending" | "approved" | "rejected";

/** Each domain gets its own hue so a card's colour tells you what the person does. */
export const DOMAIN_COLORS: Record<Domain, string> = {
  "Web Development": "#7aa2ff",
  Design: "#ff8cb8",
  Logistics: "#f5b66b",
  Operations: "#6fd3c0",
  Sponsorship: "#c6e26a",
  Hospitality: "#ff9e7a",
  "Social Media": "#c39bff",
  "Event Management": "#8fe0f2",
};

export const DEFAULT_COLOR = "#a097b8";
export const domainColor = (d: string) => DOMAIN_COLORS[d as Domain] ?? DEFAULT_COLOR;

/** Lower number = more senior. Used to put heads first on the team page. */
export const POSITION_RANK: Record<Position, number> = {
  Head: 0,
  "Vice-Head": 1,
  "Core Member": 2,
  Member: 3,
};

export const BIO_MIN = 150;
export const BIO_MAX = 200;

export const ADMIN_EMAIL = "admin@embrione.pes.edu";
export const PHOTO_BUCKET = "member-photos";
