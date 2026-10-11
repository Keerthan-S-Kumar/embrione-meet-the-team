-- Lets someone whose card was rejected fix it and resubmit under the same SRN,
-- instead of being permanently blocked by the unique SRN index.
--
-- Security note: this does NOT open a public UPDATE policy on the table (that would let
-- anyone edit any row). Instead it's one narrow function that only moves a row from
-- 'rejected' back to 'pending' and only overwrites the submission fields, never the
-- status to 'approved' and never someone else's non-rejected row.

create or replace function public.resubmit_member(
  p_srn          text,
  p_name         text,
  p_domain       text,
  p_position     text,
  p_email        text,
  p_linkedin_url text,
  p_github_url   text,
  p_branch       text,
  p_semester     integer,
  p_bio          text,
  p_photo_url    text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.members
  set name = p_name,
      domain = p_domain,
      position = p_position,
      email = p_email,
      linkedin_url = p_linkedin_url,
      github_url = p_github_url,
      branch = p_branch,
      semester = p_semester,
      bio = p_bio,
      photo_url = p_photo_url,
      status = 'pending',
      rejection_note = null,
      created_at = timezone('utc'::text, now())
  where upper(srn) = upper(trim(p_srn))
    and status = 'rejected';

  if not found then
    raise exception 'No rejected submission found for that SRN.';
  end if;
end;
$$;

grant execute on function public.resubmit_member(
  text, text, text, text, text, text, text, text, integer, text, text
) to anon, authenticated;