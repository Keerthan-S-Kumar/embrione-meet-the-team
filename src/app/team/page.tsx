import type { Metadata } from "next";
import { TeamDirectory } from "@/components/team/TeamDirectory";

export const metadata: Metadata = {
  title: "Meet the team",
  description: "The students who build and run Embrione at PES University, filterable by domain and position.",
};

export default function TeamPage() {
  return (
    <>
      <header className="mb-10 max-w-3xl">
        <h1 className="text-5xl font-semibold leading-[1.02] sm:text-7xl">The people behind Embrione</h1>
        <p className="mt-5 max-w-xl text-lg text-dim">
          Students from every domain who plan, build and run Embrione at PES University. Filter by what they do or how long they&apos;ve led it.
        </p>
      </header>
      <TeamDirectory />
    </>
  );
}
