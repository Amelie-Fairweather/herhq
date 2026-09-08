import { AppShell } from "@/components/AppShell";
import { MyBidsBoard } from "@/components/MyBidsBoard";

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
      </section>
      <MyBidsBoard />
    </AppShell>
  );
}
