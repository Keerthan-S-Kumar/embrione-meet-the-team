import type { Metadata } from "next";
import { TeamDirectory } from "@/components/team/TeamDirectory";
import { Suspense } from "react";

<Suspense fallback={null}>
  <TeamDirectory />
</Suspense>

export const metadata: Metadata = {
  title: "Meet the team",
  description: "The students who build and run Embrione at PES University, filterable by domain and position.",
};

export default function TeamPage() {
  return (
    <>
      <header className="mb-10 max-w-3xl">
        <h1 className="bg-gradient-to-br from-fg via-eosin to-[#7aa2ff] bg-clip-text pb-2 text-5xl font-semibold leading-[1.02] text-transparent sm:text-7xl">
          The People behind Embrione
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-dim">
          Students from every domain who plan, build and run Embrione at PES University.
          <br />
          Filter by what they do or how long they&apos;ve led it.
        </p>
      </header>
      <TeamDirectory />
    </>
  );
}
