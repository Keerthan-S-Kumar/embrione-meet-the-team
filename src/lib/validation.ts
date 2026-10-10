import { BIO_MAX, BIO_MIN, BRANCHES, DOMAINS, POSITIONS, SEMESTERS } from "./constants";
import type { FormState } from "./types";

export type FormErrors = Partial<Record<keyof FormState | "photo", string>>;

// PES1UG25CS247 -> PES + campus digit + UG/PG + 2-digit year + 2-4 letter branch + 3-digit roll
export const SRN_PATTERN = /^PES[12](UG|PG)\d{2}[A-Z]{2,4}\d{3}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeSrn = (s: string) => s.trim().toUpperCase();

/** Accepts "linkedin.com/in/me" or a full URL; returns a clean https URL or null if invalid. */
export function normalizeUrl(raw: string, host: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const h = url.hostname.toLowerCase();
    if (h !== host && !h.endsWith(`.${host}`)) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function validate(form: FormState, hasPhoto: boolean): FormErrors {
  const e: FormErrors = {};
  const name = form.name.trim();

  if (name.length < 2) e.name = "Enter your full name.";
  else if (name.length > 60) e.name = "Keep your name under 60 characters.";

  if (!DOMAINS.includes(form.domain as (typeof DOMAINS)[number])) e.domain = "Choose your domain.";
  if (!POSITIONS.includes(form.position as (typeof POSITIONS)[number])) e.position = "Choose your position.";

  if (!SRN_PATTERN.test(normalizeSrn(form.srn))) e.srn = "Use the format PES1UG23CS001.";

  if (!EMAIL_PATTERN.test(form.email.trim())) e.email = "Enter a valid email address.";

  if (form.linkedin.trim() && !normalizeUrl(form.linkedin, "linkedin.com"))
    e.linkedin = "Enter a linkedin.com link, like linkedin.com/in/yourname.";
  if (form.github.trim() && !normalizeUrl(form.github, "github.com"))
    e.github = "Enter a github.com link, like github.com/yourname.";

  if (!BRANCHES.includes(form.branch as (typeof BRANCHES)[number])) e.branch = "Choose your branch.";
  if (!SEMESTERS.includes(Number(form.semester) as (typeof SEMESTERS)[number])) e.semester = "Choose your semester.";

  const bio = form.bio.trim().length;
  if (bio < BIO_MIN) e.bio = `Write at least ${BIO_MIN} characters (${BIO_MIN - bio} to go).`;
  else if (bio > BIO_MAX) e.bio = `Keep it to ${BIO_MAX} characters or fewer.`;

  if (!hasPhoto) e.photo = "Add a profile picture.";
  return e;
}
