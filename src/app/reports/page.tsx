import { AppShell } from "@/components/AppShell";
import { ReportsBoard } from "@/components/ReportsBoard";

export default function ReportsPage() {
  return (
    <AppShell>
      <section className="fade-up mb-5 sm:mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--rose)] sm:text-xs sm:tracking-[0.22em]">
          Weekly self reports
        </p>
        <h2 className="display mt-2 text-3xl text-[var(--ink)] sm:text-4xl">
          Keep the leadership loop honest.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)] sm:text-base">
          File wins, blockers, and next-week focus. Reports stay visible on the
          site, then move into a dated archive folder when the week ends.
        </p>
      </section>
      <ReportsBoard />
    </AppShell>
  );
}
