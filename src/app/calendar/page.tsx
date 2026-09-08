import { AppShell } from "@/components/AppShell";
import { CalendarBoard } from "@/components/CalendarBoard";

export default function CalendarPage() {
  return (
    <AppShell>
      <section className="fade-up mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rose)]">
          Shared calendar
        </p>
        <h2 className="display mt-2 text-4xl text-[var(--ink)]">
          Post what the org needs to know.
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">
          Meetings, chapter launches, petition pushes, media calls — everyone can
          add events the whole leadership team can see.
        </p>
      </section>
      <CalendarBoard />
    </AppShell>
  );
}
