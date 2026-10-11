-- =====================================================================
-- Embrione "Meet the Team": database setup
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once.
-- =====================================================================

-- 1. The members table (same columns as the challenge brief) -----------
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  domain       text not null,
  position     text not null,
  srn          text not null,
  email        text not null,
  linkedin_url text,
  github_url   text,
  branch       text not null,
  semester     integer not null,
  bio          text,
  photo_url    text not null,
  status       text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  rejection_note text,                          -- optional reason shown to admins when rejected
  created_at   timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Extra safety: the database rejects bad data even if someone skips the website.
  constraint members_name_len   check (char_length(name) between 2 and 60),
  constraint members_domain_ok  check (domain in ('Web Development','Design','Logistics','Operations','Sponsorship','Hospitality','Social Media','Event Management')),
  constraint members_position_ok check (position in ('Head','Vice-Head','Core Member','Member')),
  constraint members_semester_ok check (semester between 1 and 8),
  constraint members_status_ok  check (status in ('pending','approved','rejected')),
  constraint members_bio_len    check (bio is null or char_length(bio) <= 200),
  constraint members_note_len   check (rejection_note is null or char_length(rejection_note) <= 300)
);

-- One submission per SRN, ignoring upper/lower case.
create unique index if not exists members_srn_unique on public.members (upper(srn));

-- 2. Row-level security ------------------------------------------------
-- The brief's starter policies let anyone read, edit and delete everything.
-- These are tighter but keep the same behaviour for the website:
--   * anyone can SUBMIT a profile, but only as 'pending'
--   * anyone can READ approved profiles (this powers /team)
--   * only the signed-in admin can read everything, approve, reject and delete
alter table public.members enable row level security;

drop policy if exists "Allow public insert"  on public.members;
drop policy if exists "Allow public read"    on public.members;
drop policy if exists "Allow admin updates"  on public.members;
drop policy if exists "Allow admin deletes"  on public.members;
drop policy if exists "Public can submit pending profiles" on public.members;
drop policy if exists "Public can read approved profiles"  on public.members;
drop policy if exists "Admin can read all"   on public.members;
drop policy if exists "Admin can update"     on public.members;
drop policy if exists "Admin can delete"     on public.members;

create policy "Public can submit pending profiles" on public.members
  for insert to anon, authenticated
  with check (status = 'pending' and rejection_note is null);

create policy "Public can read approved profiles" on public.members
  for select to anon, authenticated
  using (status = 'approved');

create policy "Admin can read all" on public.members
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@embrione.pes.edu');

create policy "Admin can update" on public.members
  for update to authenticated
  using      ((auth.jwt() ->> 'email') = 'admin@embrione.pes.edu')
  with check ((auth.jwt() ->> 'email') = 'admin@embrione.pes.edu');

create policy "Admin can delete" on public.members
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@embrione.pes.edu');

-- 3. Duplicate-SRN check -----------------------------------------------
-- The form needs to know "is this SRN taken?" even though pending rows are private.
-- This function answers with ONLY the status (or null), never any personal data.
create or replace function public.srn_status(p_srn text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select status from public.members where upper(srn) = upper(trim(p_srn)) limit 1;
$$;

grant execute on function public.srn_status(text) to anon, authenticated;

-- 4. Storage bucket for photos -----------------------------------------
-- Public bucket, WebP only, 2 MB cap (our converted photos are ~100 KB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-photos', 'member-photos', true, 2097152, array['image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload member photos" on storage.objects;
drop policy if exists "Anyone can view member photos"   on storage.objects;
drop policy if exists "Admin can delete member photos"  on storage.objects;

create policy "Anyone can upload member photos" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'member-photos' and lower(name) like '%.webp');

create policy "Anyone can view member photos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'member-photos');

create policy "Admin can delete member photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'member-photos' and (auth.jwt() ->> 'email') = 'admin@embrione.pes.edu');

-- 5. Realtime: lets the admin dashboard update the moment someone submits ----
do $$
begin
  alter publication supabase_realtime add table public.members;
exception when duplicate_object then null;
end $$;
