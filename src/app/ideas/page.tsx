import { AppShell } from "@/components/AppShell";
import { IdeasBoard } from "@/components/IdeasBoard";

export default function IdeasPage() {
  return (
    <AppShell>
      <section className="fade-up mb-5 sm:mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--rose)] sm:text-xs sm:tracking-[0.22em]">
          Idea proposals
        </p>
        <h2 className="display mt-2 text-3xl text-[var(--ink)] sm:text-4xl">
          Pitch what the org should do next.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)] sm:text-base">
          Post an idea by category, set how many helpers you need, and let
          leadership pledge to help. Multiple people can pledge on the same idea.
        </p>
      </section>
      <IdeasBoard />
    </AppShell>
  );
}
