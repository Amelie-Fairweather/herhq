import { AppShell } from "@/components/AppShell";
import { BiddingBoard } from "@/components/BiddingBoard";

export default function BiddingPage() {
  return (
    <AppShell>
      <section className="fade-up mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rose)]">
          Onboarding bids
        </p>
        <h2 className="display mt-2 text-4xl text-[var(--ink)]">
          Claim new chapter leaders.
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">
          New registration form applications show up here. Place a bid to onboard
          them, then award the strongest fit.
        </p>
      </section>
      <BiddingBoard />
    </AppShell>
  );
}
