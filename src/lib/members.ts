import { PHOTO_BUCKET, POSITION_RANK, type Position, type Status } from "./constants";
import { supabase } from "./supabase";
import type { FormState, Member } from "./types";
import { normalizeSrn, normalizeUrl } from "./validation";

/** Public: approved members only (row-level security also enforces this on the server). */
export async function fetchApproved(): Promise<Member[]> {
  const { data, error } = await supabase.from("members").select("*").eq("status", "approved");
  if (error) throw new Error(error.message);
  return sortBySeniority((data ?? []) as Member[]);
}

/** Admin: every submission. Only returns rows when signed in as the admin. */
export async function fetchAll(): Promise<Member[]> {
  const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Member[];
}

export function sortBySeniority(list: Member[]) {
  return [...list].sort(
    (a, b) =>
      (POSITION_RANK[a.position as Position] ?? 9) - (POSITION_RANK[b.position as Position] ?? 9) ||
      a.name.localeCompare(b.name),
  );
}

/** Asks the database (via a tiny SQL function) if this SRN is taken. Returns its status or null. */
export async function srnStatus(srn: string): Promise<Status | null> {
  const { data, error } = await supabase.rpc("srn_status", { p_srn: normalizeSrn(srn) });
  if (error) throw new Error(error.message);
  return (data as Status | null) ?? null;
}

/**
 * Submit flow: upload the WebP first, then insert the row pointing at it.
 * If the insert fails we try to delete the uploaded file so storage doesn't collect orphans.
 */
export async function submitMember(form: FormState, webp: Blob): Promise<void> {
  const path = `${crypto.randomUUID()}.webp`;

  const upload = await supabase.storage.from(PHOTO_BUCKET).upload(path, webp, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (upload.error) throw new Error(`Photo upload failed: ${upload.error.message}`);

  const { data: pub } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  const { error } = await supabase.from("members").insert({
    name: form.name.trim(),
    domain: form.domain,
    position: form.position,
    srn: normalizeSrn(form.srn),
    email: form.email.trim().toLowerCase(),
    linkedin_url: normalizeUrl(form.linkedin, "linkedin.com"),
    github_url: normalizeUrl(form.github, "github.com"),
    branch: form.branch,
    semester: Number(form.semester),
    bio: form.bio.trim(),
    photo_url: pub.publicUrl,
    status: "pending",
  });

  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]); // best effort; visitors cannot delete, so an orphan may remain
    // 23505 = unique violation: someone submitted this SRN a moment ago.
    if (error.code === "23505") throw new Error("This SRN has already been submitted.");
    throw new Error(error.message);
  }
}

export async function updateStatus(id: string, status: Status): Promise<void> {
  const { error } = await supabase.from("members").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMember(member: Member): Promise<void> {
  const { error } = await supabase.from("members").delete().eq("id", member.id);
  if (error) throw new Error(error.message);
  // Also remove the photo (best effort), but only if it lives in our bucket (seed data uses external avatars).
  const marker = `/${PHOTO_BUCKET}/`;
  const i = member.photo_url.indexOf(marker);
  if (i !== -1) {
    await supabase.storage.from(PHOTO_BUCKET).remove([member.photo_url.slice(i + marker.length)]);
  }
}
