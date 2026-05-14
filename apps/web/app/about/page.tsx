import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About FixItNow",
  description:
    "FixItNow is a full-stack home-services marketplace built with Next.js, designed to make it easy to discover and book trusted local professionals.",
};

interface Feature {
  title: string;
  body: string;
}

const features: Feature[] = [
  {
    title: "Curated professionals",
    body: "Every business listed on FixItNow is reviewed for quality and reliability before going live.",
  },
  {
    title: "Real-time availability",
    body: "See live time slots, avoid double-booking, and get instant confirmation for your appointment.",
  },
  {
    title: "Manage your bookings",
    body: "Sign in to view upcoming and past bookings, reschedule, or cancel — all in one place.",
  },
];

const AboutPage = () => {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <header className="text-center">
        <p className="text-primary text-sm font-semibold uppercase tracking-wide">
          About FixItNow
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Trusted home services, on demand.
        </h1>
        <p className="text-muted-foreground mt-4">
          FixItNow connects homeowners with verified local service providers —
          cleaning, plumbing, electrical, repairs and more — through a clean,
          modern booking experience.
        </p>
      </header>

      <section
        className="mt-12 grid gap-6 sm:grid-cols-3"
        aria-label="Why FixItNow"
      >
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-card rounded-lg border p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold">{f.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Tech stack</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Built with Next.js 14 (App Router), Tailwind CSS, shadcn/ui, a custom
          Express + Mongoose + Redis API, JWT-based auth with rotating refresh
          tokens, and a fully typed shared `@fixitnow/types` package powered by
          Zod. Containerised with Docker, with CI/CD via GitHub Actions.
        </p>
      </section>
    </article>
  );
};

export default AboutPage;
