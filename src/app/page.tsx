import Link from "next/link";
import { MemberCard } from "@/components/MemberCard";

const STEPS = [
  { title: "Fill in the form", body: "Your name, domain, position and a short bio. Add a photo and we shrink it to WebP in your browser." },
  { title: "An admin reviews it", body: "Every card waits in a moderation queue. Approved cards go live, rejected ones stay hidden." },
  { title: "You join the page", body: "Once approved, your card shows up on the team page where anyone can filter and find you." },
];

export default function Home() {
  return (
    <>
      <section className="grid items-center gap-14 pt-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20 lg:pt-10">
        <div>
          <h1 className="max-w-2xl bg-linear-to-br from-fg via-eosin to-[#c39bff] bg-clip-text pb-2 text-5xl font-semibold leading-[1.02] text-transparent sm:text-7xl">
            Put your card on the Embrione team page
          </h1>
          <p className="mt-6 max-w-lg text-lg text-dim">
            Fill in a short form, watch your card take shape as you type, and submit it. Once an admin approves it, you&apos;re on the page.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-eosin px-7 py-3.5 text-[15px] font-semibold text-ink transition hover:bg-eosin-deep">
              Build your card
            </Link>
            <Link href="/team" className="rounded-full border border-wall-2 px-7 py-3.5 text-[15px] font-semibold transition hover:bg-cell-2">
              See the team
            </Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[340px]">
          <MemberCard
            data={{
              name: "Aarav Menon",
              domain: "Web Development",
              position: "Core Member",
              branch: "CSE",
              semester: 5,
              bio: "Builds fast, tidy interfaces and ships them on weekends. Currently learning how databases think.",
              photoUrl: "https://api.dicebear.com/9.x/lorelei/svg?seed=Aarav&backgroundColor=b6e3f4",
              linkedin: "https://www.linkedin.com",
              github: "https://github.com",
            }}
          />
        </div>
      </section>

      <section className="mt-28" aria-labelledby="how">
        <h2 id="how" className="text-3xl font-semibold sm:text-4xl">How it works</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-3xl border border-wall bg-cell p-6">
              <span className="font-display text-4xl font-semibold text-eosin">{i + 1}</span>
              <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-[15px] text-dim">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
