-- =====================================================================
-- Mock data for the /team page (dummy names, DiceBear avatars).
-- Run AFTER schema.sql. Safe to run more than once.
-- =====================================================================
insert into public.members
  (name, domain, position, srn, email, linkedin_url, github_url, branch, semester, bio, photo_url, status)
values
  ('Ananya Rao', 'Web Development', 'Head', 'PES1UG22CS101', 'ananya.rao@example.com',
   'https://www.linkedin.com/in/ananya-rao-demo', 'https://github.com/ananya-rao-demo', 'CSE', 7,
   'Leads the web team and cares about fast, accessible interfaces. Ships weekend projects, mentors juniors on React and databases, and is never far from a good cup of filter coffee.',
   'https://api.dicebear.com/9.x/lorelei/svg?seed=Ananya&backgroundColor=ffd5dc', 'approved'),

  ('Rohan Iyer', 'Design', 'Vice-Head', 'PES1UG22AM064', 'rohan.iyer@example.com',
   'https://www.linkedin.com/in/rohan-iyer-demo', null, 'AIML', 7,
   'Turns rough ideas into posters, motion and brand systems. Obsessed with typography, grid layouts and the small details that make an event feel put together from the first glance.',
   'https://api.dicebear.com/9.x/lorelei/svg?seed=Rohan&backgroundColor=c0aede', 'approved'),

  ('Meera Nair', 'Event Management', 'Head', 'PES1UG22EC038', 'meera.nair@example.com',
   'https://www.linkedin.com/in/meera-nair-demo', null, 'ECE', 7,
   'Runs the show on event day. Plans schedules down to the minute, keeps ten volunteers moving in one direction, and stays calm when the projector decides to stop working.',
   'https://api.dicebear.com/9.x/lorelei/svg?seed=Meera&backgroundColor=d1d4f9', 'approved'),

  ('Karthik Shenoy', 'Sponsorship', 'Core Member', 'PES1UG23CS215', 'karthik.shenoy@example.com',
   'https://www.linkedin.com/in/karthik-shenoy-demo', null, 'CSE', 5,
   'Writes the pitch decks and sends the follow-ups. Enjoys talking to people about what their company wants, then figuring out how an Embrione event can genuinely deliver it.',
   'https://api.dicebear.com/9.x/lorelei/svg?seed=Karthik&backgroundColor=ffdfbf', 'approved'),

  ('Diya Kulkarni', 'Social Media', 'Core Member', 'PES1UG23AM092', 'diya.kulkarni@example.com',
   'https://www.linkedin.com/in/diya-kulkarni-demo', 'https://github.com/diya-kulkarni-demo', 'AIML', 5,
   'Plans the content calendar, writes captions and cuts reels. Tracks what people actually watch, and loves a good behind-the-scenes story from the night before a big event.',
   'https://api.dicebear.com/9.x/lorelei/svg?seed=Diya&backgroundColor=b6e3f4', 'approved'),

  ('Arjun Pillai', 'Logistics', 'Member', 'PES1UG24ME047', 'arjun.pillai@example.com',
   null, null, 'ME', 3,
   'Handles venues, equipment and transport. Keeps a spreadsheet for everything, double-checks every booking, and will happily carry the extension boards when nobody else volunteers.',
   'https://api.dicebear.com/9.x/lorelei/svg?seed=Arjun&backgroundColor=ffd5dc', 'approved')
on conflict (upper(srn)) do nothing;
