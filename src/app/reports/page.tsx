import { AppShell } from "@/components/AppShell";
import { ReportsBoard } from "@/components/ReportsBoard";

export default function ReportsPage() {
  return (
    <AppShell>
      <section className="fade-up mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rose)]">
          Weekly self reports
        </p>
        <h2 className="display mt-2 text-4xl text-[var(--ink)]">
          Keep the leadership loop honest.
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">
          File wins, blockers, and next-week focus. Reports stay visible on the
          site, then move into a dated archive folder when the week ends.
        </p>
      </section>
      <ReportsBoard />
    </AppShell>
  );
}
