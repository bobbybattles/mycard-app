import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Marketing landing page for mycard.to.
// If the visitor is already signed in, send them straight to the dashboard.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app/dashboard");

  return (
    <main className="flex-1">
      <section className="px-6 py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-pink-50 to-white">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 mb-6">
            powered by oink
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            A media kit brands actually open.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600">
            Build a one-page kit in 60 seconds. Show your audience, your numbers
            and your best work. Share one short link:{" "}
            <span className="font-mono text-slate-900">mycard.to/yourname</span>
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-6 py-3 text-white font-semibold hover:bg-pink-700 transition"
            >
              Create my free kit
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-slate-900 font-semibold hover:bg-slate-50 transition"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Free for every Oink user. No credit card. Yours forever.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <Feature
            title="One link, one kit"
            body="Send brands a single short URL — mycard.to/yourname — that loads instantly on any device."
          />
          <Feature
            title="Cards, your way"
            body="Drag-and-drop cards for socials, audience demos, past collabs, rate card, and contact info."
          />
          <Feature
            title="Built for influencers"
            body="From the team behind Oink. Tuned for Amazon, TikTok, IG, YouTube, Pinterest, and Facebook creators."
          />
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-500">
        <p>
          © {new Date().getFullYear()} Oink for Influencers · mycard.to ·{" "}
          <a
            href="https://oinkforinfluencers.com"
            className="underline hover:text-slate-700"
          >
            oinkforinfluencers.com
          </a>
        </p>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-slate-600">{body}</p>
    </div>
  );
}
