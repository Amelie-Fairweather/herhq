import Image from "next/image";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { SoftStar } from "@/components/SoftStar";
import { expandEvents } from "@/lib/calendar";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/db";
import { countCurrentWeekReports } from "@/lib/reports";
import { formatWeekLabel, mondayOf } from "@/lib/utils";

export default async function HomePage() {
  const session = await getSession();
  const store = await readStore();
  const now = new Date();
  const upcoming = expandEvents(store.events, now, addDays(now, 60))
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 4);
  const openApps = store.applications.filter((a) => a.status === "open");
  const openIdeas = store.ideas.filter((i) => i.status === "open");
  const week = mondayOf();
  const reportsThisWeek = await countCurrentWeekReports();

  return (
    <AppShell>
      <section className="fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <Image
          src="/logo.jpeg"
          alt="H.E.R. Education Required logo"
          width={112}
          height={112}
          priority
          className="h-20 w-20 rounded-2xl object-cover shadow-md ring-1 ring-[var(--line)] sm:h-24 sm:w-24 md:h-28 md:w-28"
        />
        <div>
          <p className="display text-base leading-snug text-[var(--ink)] sm:text-lg">
            Empowering the Next Generation Through Complete History
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--rose)] sm:text-xs sm:tracking-[0.22em]">
            Welcome back{session ? `, ${session.name}` : ""}
          </p>
          <h2 className="display mt-2 text-3xl text-[var(--ink)] sm:text-4xl md:text-5xl">
            Organize the movement.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--ink-soft)] sm:text-base">
            Post shared events, bid to onboard new chapter leaders, pitch ideas
            the team can pledge on, and file your weekly self report — all in one
            place.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/calendar",
            label: "Shared calendar",
            value: String(upcoming.length),
            hint: "upcoming events",
          },
          {
            href: "/bidding",
            label: "Open applications",
            value: String(openApps.length),
            hint: "ready for bids",
          },
          {
            href: "/ideas",
            label: "Open ideas",
            value: String(openIdeas.length),
            hint: "looking for helpers",
          },
          {
            href: "/reports",
            label: "Reports this week",
            value: String(reportsThisWeek),
            hint: `week of ${formatWeekLabel(week)}`,
          },
        ].map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            className="panel fade-up rounded-3xl p-5 transition-transform hover:-translate-y-1 sm:p-6"
            style={{ animationDelay: `${80 + i * 60}ms` }}
          >
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)] sm:text-xs sm:tracking-[0.16em]">
              <SoftStar className="h-3.5 w-3.5 shrink-0" fill="#fe4cba" />
              {card.label}
            </div>
            <p className="display mt-3 text-4xl text-[var(--ink)] sm:mt-4 sm:text-5xl">{card.value}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{card.hint}</p>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-5 sm:mt-8 lg:grid-cols-2 lg:gap-6">
        <div className="panel rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="display text-xl sm:text-2xl">Coming up</h3>
            <Link href="/calendar" className="text-sm font-semibold text-[var(--rose)]">
              Open calendar →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <li className="text-sm text-[var(--ink-soft)]">
                No upcoming events yet. Add one on the calendar.
              </li>
            ) : (
              upcoming.map((event) => (
                <li
                  key={event.id}
                  className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0"
                >
                  <p className="font-semibold text-[var(--ink)]">{event.title}</p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {format(parseISO(event.start), "EEE, MMM d · h:mm a")}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="panel rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="display text-xl sm:text-2xl">Newest applications</h3>
            <Link href="/bidding" className="text-sm font-semibold text-[var(--rose)]">
              Bid board →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {openApps.length === 0 ? (
              <li className="text-sm text-[var(--ink-soft)]">
                No open applications right now.
              </li>
            ) : (
              openApps.slice(0, 4).map((app) => (
                <li
                  key={app.id}
                  className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0"
                >
                  <p className="font-semibold text-[var(--ink)]">{app.nameAndGrade}</p>
                  <p className="text-sm text-[var(--ink-soft)]">{app.schoolTownState}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
