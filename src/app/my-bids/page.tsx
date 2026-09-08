import { AppShell } from "@/components/AppShell";
import { MyBidsBoard } from "@/components/MyBidsBoard";
import { SoftStar } from "@/components/SoftStar";

const guides = [
  {
    href: "https://drive.google.com/file/d/1XtqHgl5d_L6N_kepNi9Y8eXsdocYWf2Y/view?usp=sharing",
    eyebrow: "First call",
    title: "How to onboard your first meeting",
    blurb: "A short walkthrough before you hop on Zoom.",
    cta: "Open guide",
  },
  {
    href: "https://drive.google.com/file/d/1LD5VfDUsPlxIbqV74q6P4HxhBuVV5SW-/view?usp=sharing",
    eyebrow: "Inbox ready",
    title: "Application emails",
    blurb: "Copy-ready notes for reaching out after you bid.",
    cta: "Open guide",
  },
  {
    href: "https://drive.google.com/drive/folders/1CGoRgZqagJMfPTwF6v5LCps0s7Q3gOiF",
    eyebrow: "Everything else",
    title: "View our resources",
    blurb: "Pitch drafts, roles, training, and the full HER folder.",
    cta: "Open folder",
  },
] as const;

export default function MyBidsPage() {
  return (
    <AppShell>
      <section className="fade-up mb-5 sm:mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--rose)] sm:text-xs sm:tracking-[0.22em]">
          My bids
        </p>
        <h2 className="display mt-2 text-3xl text-[var(--ink)] sm:text-4xl">
          Calls you claimed.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)] sm:text-base">
          Track onboardings you bid on. Mark Complete when the call is done, or
          Withdraw if you can no longer take it.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide, i) => (
            <a
              key={guide.href}
              href={guide.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-white/80 p-4 shadow-[0_12px_32px_rgba(254,76,186,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(254,76,186,0.22)] sm:p-5"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <SoftStar
                className="pointer-events-none absolute -right-3 -top-2 h-24 w-24 rotate-12 opacity-70 transition-transform duration-500 group-hover:rotate-[22deg] group-hover:scale-110"
                fill="#feabef"
              />
              <SoftStar
                className="pointer-events-none absolute -bottom-3 left-6 h-14 w-14 -rotate-12 opacity-45 transition-transform duration-500 group-hover:-rotate-6 group-hover:translate-x-1"
                fill="#fe4cba"
              />
              <SoftStar
                className="pointer-events-none absolute right-10 top-14 h-7 w-7 rotate-6 opacity-35 transition-transform duration-500 group-hover:scale-125"
                fill="#ffc6eb"
              />
              <div className="relative">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--rose)]">
                  {guide.eyebrow}
                </p>
                <h3 className="display mt-2 text-xl leading-snug text-[var(--ink)] sm:text-2xl">
                  {guide.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{guide.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--rose-deep)] transition-transform duration-300 group-hover:translate-x-1">
                  {guide.cta}
                  <span aria-hidden className="text-base leading-none">
                    →
                  </span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <MyBidsBoard />
    </AppShell>
  );
}
