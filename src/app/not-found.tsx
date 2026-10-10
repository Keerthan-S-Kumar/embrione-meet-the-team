import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="text-5xl font-semibold">Page not found</h1>
      <p className="mt-3 text-dim">That link doesn&apos;t lead anywhere. Try the team page instead.</p>
      <Link href="/team" className="mt-8 inline-block rounded-full bg-eosin px-6 py-3 text-sm font-semibold text-ink transition hover:bg-eosin-deep">
        Go to the team page
      </Link>
    </div>
  );
}
