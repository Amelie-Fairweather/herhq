import { AppShell } from "@/components/AppShell";
import { MyBidsBoard } from "@/components/MyBidsBoard";

const guides = [
  {
    href: "https://drive.google.com/file/d/1XtqHgl5d_L6N_kepNi9Y8eXsdocYWf2Y/view?usp=sharing",
    eyebrow: "First call",
    title: "How to onboard your first meeting",
    blurb: "A short walkthrough before you hop on Zoom.",
    accent: "from-[#ffe0f4] to-[#ffc6eb]",
  },
  {
    href: "https://drive.google.com/file/d/1LD5VfDUsPlxIbqV74q6P4HxhBuVV5SW-/view?usp=sharing",
    eyebrow: "Inbox ready",
    title: "Application emails",
    blurb: "Copy-ready notes for reaching out after you bid.",
    accent: "from-[#ffd6f0] to-[#feabef]",
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {guides.map((guide, i) => (
            <a
              key={guide.href}
              href={guide.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-white/80 p-4 shadow-[0_12px_32px_rgba(254,76,186,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(254,76,186,0.22)] sm:p-5"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${guide.accent} opacity-80 blur-[2px] transition-transform duration-500 group-hover:scale-125`}
              />
              <span
                aria-hidden
                className={`pointer-events-none absolute -bottom-10 left-8 h-20 w-20 rounded-full bg-gradient-to-tr ${guide.accent} opacity-50 transition-transform duration-500 group-hover:translate-x-2`}
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
                  Open guide
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
