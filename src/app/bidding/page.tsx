import { AppShell } from "@/components/AppShell";
import { BiddingBoard } from "@/components/BiddingBoard";
import { FormConnectionGuide } from "@/components/FormConnectionGuide";

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
          Applications from the HER registration form appear here once the form
          is wired with Apps Script. Place a bid to onboard them, then award the
          strongest fit.
        </p>
      </section>
      <div className="mb-6">
        <FormConnectionGuide />
      </div>
      <BiddingBoard />
    </AppShell>
  );
}
