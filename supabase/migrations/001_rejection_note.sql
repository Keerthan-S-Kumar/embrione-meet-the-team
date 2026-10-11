-- Adds an optional reason that the admin can attach when rejecting a card.
-- Run once in Supabase > SQL Editor. Safe to run again.

alter table public.members add column if not exists rejection_note text;

alter table public.members drop constraint if exists members_note_len;
alter table public.members add constraint members_note_len
  check (rejection_note is null or char_length(rejection_note) <= 300);

-- Visitors may only submit a plain pending card (no note), so nobody can plant one.
drop policy if exists "Public can submit pending profiles" on public.members;
create policy "Public can submit pending profiles" on public.members
  for insert to anon, authenticated
  with check (status = 'pending' and rejection_note is null);