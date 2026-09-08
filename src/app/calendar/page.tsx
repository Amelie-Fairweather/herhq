import { AppShell } from "@/components/AppShell";
import { CalendarBoard } from "@/components/CalendarBoard";

export default function CalendarPage() {
  return (
    <AppShell>
      <section className="fade-up mb-5 sm:mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--rose)] sm:text-xs sm:tracking-[0.22em]">
          Shared calendar
        </p>
        <h2 className="display mt-2 text-3xl text-[var(--ink)] sm:text-4xl">
          Post what the org needs to know.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)] sm:text-base">
          Meetings, chapter launches, petition pushes, media calls — everyone can
          add events the whole leadership team can see.
        </p>
      </section>
      <CalendarBoard />
    </AppShell>
  );
}
