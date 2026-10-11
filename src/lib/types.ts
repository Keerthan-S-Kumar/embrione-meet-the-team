import type { Status } from "./constants";

/** One row of public.members, exactly as Supabase returns it. */
export interface Member {
  id: string;
  name: string;
  domain: string;
  position: string;
  srn: string;
  email: string;
  linkedin_url: string | null;
  github_url: string | null;
  branch: string;
  semester: number;
  bio: string | null;
  photo_url: string;
  status: Status;
  rejection_note: string | null;
  created_at: string;
}

/** What the register form holds while the user is typing (everything is a string in an <input>). */
export interface FormState {
  name: string;
  domain: string;
  position: string;
  srn: string;
  email: string;
  linkedin: string;
  github: string;
  branch: string;
  semester: string;
  bio: string;
}

export const EMPTY_FORM: FormState = {
  name: "",
  domain: "",
  position: "",
  srn: "",
  email: "",
  linkedin: "",
  github: "",
  branch: "",
  semester: "",
  bio: "",
};
