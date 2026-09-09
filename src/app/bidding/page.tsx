import { AppShell } from "@/components/AppShell";
import { BiddingBoard } from "@/components/BiddingBoard";

export default function BiddingPage() {
  return (
    <AppShell>
      <section className="fade-up mb-5 sm:mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--rose)] sm:text-xs sm:tracking-[0.22em]">
          Onboarding
        </p>
        <h2 className="display mt-2 text-3xl text-[var(--ink)] sm:text-4xl">
          Claim new chapter leaders.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)] sm:text-base">
          New registration form applications show up here. Place a bid to onboard
          them, then award the strongest fit.
        </p>
      </section>
      <BiddingBoard />
    </AppShell>
  );
}
