import { AppShell } from "@/components/AppShell";
import { MyBidsBoard } from "@/components/MyBidsBoard";

export default function MyBidsPage() {
  return (
    <AppShell>
      <section className="fade-up mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rose)]">
          My bids
        </p>
        <h2 className="display mt-2 text-4xl text-[var(--ink)]">
          Calls you claimed.
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">
          Track onboardings you bid on. Mark Complete when the call is done, or
          Withdraw if you can no longer take it.
        </p>
      </section>
      <MyBidsBoard />
    </AppShell>
  );
}
