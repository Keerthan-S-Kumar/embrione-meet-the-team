# Study guide: Embrione Web Dev challenge

You have to explain this code in a 2-minute video and possibly in an interview. This guide is how you make the project yours.

## Be honest with yourself about the commit history
The brief asks for regular, progressive commits and says they want to see how you work. Do not paste the whole project into git in one go, and do not fake timestamps. A better way to use this project:

1. Create an empty Next.js app yourself and build it phase by phase over a day or two, using this code as a reference.
2. For each phase, open the files, read them, type or paste them in, run the app, and make sure you understand what happens. Then commit.
3. When something breaks (it will), fix it yourself and commit the fix. Real commits like `fix: srn check runs twice` are good.

Suggested commits, in order:
1. `setup: project init`
2. `setup: supabase client, env example, schema.sql`
3. `feat: design tokens, fonts, nav and footer`
4. `feat: member card component`
5. `feat: register form with live preview`
6. `feat: webp conversion and photo picker`
7. `feat: upload on submit and insert pending member`
8. `feat: duplicate srn check`
9. `feat: admin login with supabase auth`
10. `feat: admin counters, tabs, approve and reject`
11. `feat: delete with confirm, undo, keyboard shortcuts, realtime`
12. `feat: team directory with filters`
13. `feat: home page and 404`
14. `fix: responsive cards and mobile preview button`
15. `docs: readme and deploy notes`

## What each file does
- `src/lib/constants.ts`: dropdown lists, domain colours, seniority order. One place to change them.
- `src/lib/supabase.ts`: creates the Supabase client from the two env vars.
- `src/lib/image.ts`: WebP conversion with canvas.
- `src/lib/validation.ts`: all form rules (SRN pattern, email, URL hosts, bio 150 to 200).
- `src/lib/members.ts`: every database call (fetch approved, fetch all, submit, update status, delete, SRN check).
- `src/components/MemberCard.tsx`: the card. Used for the live preview, the team page and the home hero.
- `src/components/register/RegisterForm.tsx`: form state, validation display, photo handling, submit.
- `src/components/admin/*`: login, dashboard (counters, tabs, realtime, shortcuts), review rows.
- `src/components/team/TeamDirectory.tsx`: fetch approved members, filter, animate.
- `supabase/schema.sql`: table, checks, RLS policies, RPC function, storage bucket, realtime.

## Questions you may be asked (with short answers)
1. **How does the live preview work?** One state object holds the form. `MemberCard` takes it as a prop, so React re-renders the card on every change.
2. **How does WebP conversion work?** Decode with `createImageBitmap`, draw on a canvas at most 800 px wide, call `canvas.toBlob` with `image/webp` and quality 0.8.
3. **Why convert on select but upload on submit?** Converting is local and lets me show the size saving and a preview. Uploading early would leave orphan files if the user never submits.
4. **Why `createImageBitmap` with `imageOrientation`?** Phone photos store rotation in EXIF. Without it, photos can come out sideways.
5. **What happens when Submit is pressed?** Validate, re-check the SRN, upload the WebP to the bucket, get its public URL, insert the row with `status: 'pending'`, show a toast.
6. **What if the insert fails after the upload?** The code tries to delete the uploaded file. Visitors can't delete, so rarely an orphan may remain.
7. **Why row-level security?** The anon key is public in the browser. RLS is the real access control: visitors can only insert pending rows and read approved ones.
8. **How is admin protected?** Supabase Auth sign-in. Policies allow update, delete and full reads only for the admin email. The UI check is just for display.
9. **Why not hardcode the admin password in the code?** Anyone could read it in the browser bundle and the database would still be open.
10. **How does the duplicate SRN check work without leaking data?** A `security definer` SQL function returns only the status text. A unique index on `upper(srn)` catches races (error 23505).
11. **What is optimistic update?** The UI changes first and rolls back if the database call fails. It makes approve and reject feel instant.
12. **How do live updates work?** The dashboard subscribes to Supabase Realtime for the `members` table and reloads on any change.
13. **Why client-side fetching on /team?** Approvals change often, and client fetching avoids stale cached pages.
14. **Why Next.js?** File-based routing, easy Vercel deploy, and TypeScript support.
15. **What would you improve with more time?** Pagination, image cropping, email notifications on approval, admin audit log, tests.

## Demo video script (about 2 minutes)
1. Home page, say the stack (10 s).
2. `/register`: type a name, pick a domain, show the card changing live. Pick a large photo and point at the "9 MB became 76 KB WebP" message. Show the duplicate SRN warning (25 s).
3. Open the Network tab, submit, and point at the `.webp` upload request. Show the toast (25 s).
4. `/admin`: sign in, show counters, approve the new card, mention undo and keyboard shortcuts (30 s).
5. `/team`: the new card is there, use a domain filter (20 s).
6. Close with one sentence about RLS and what you'd add next (10 s).

## Final checks before you submit
- Create the admin user in Supabase Auth (step 3 of the README).
- Env vars are set in Vercel, and you redeployed after adding them.
- Register, approve and view a profile on the live site yourself.
- The repo is public and the demo video link is set to "Anyone with the link can view".
