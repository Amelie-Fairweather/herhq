import { addDays, format, parseISO, startOfDay } from "date-fns";
import type { CalendarEvent } from "./types";

const NY = "America/New_York";

/** Convert America/New_York wall clock to a UTC Date. */
export function nyWallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: NY,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  let t = Date.UTC(year, month - 1, day, hour + 4, minute, 0);
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(t)).map((p) => [p.type, p.value]),
    );
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second || "0"),
    );
    const wanted = Date.UTC(year, month - 1, day, hour, minute, 0);
    t += wanted - asUtc;
  }
  return new Date(t);
}

export function masterEventId(id: string): string {
  const idx = id.indexOf("__");
  return idx === -1 ? id : id.slice(0, idx);
}

function nyDateKey(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: NY,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function occurrenceWallParts(iso: string): { hour: number; minute: number } {
  const start = parseISO(iso);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: NY,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(start)
      .map((p) => [p.type, p.value]),
  );
  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function expandEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  const out: CalendarEvent[] = [];

  for (const event of events) {
    if (event.recurrence !== "weekly") {
      const start = parseISO(event.start);
      if (start >= rangeStart && start <= rangeEnd) out.push(event);
      continue;
    }

    const templateStart = parseISO(event.start);
    const durationMs =
      parseISO(event.end).getTime() - templateStart.getTime();
    const { hour, minute } = occurrenceWallParts(event.start);
    const firstDateKey = nyDateKey(templateStart);

    let day = startOfDay(rangeStart);
    while (day.getDay() !== 0) day = addDays(day, 1);

    while (day <= rangeEnd) {
      const dateKey = format(day, "yyyy-MM-dd");
      if (dateKey >= firstDateKey) {
        const y = day.getFullYear();
        const m = day.getMonth() + 1;
        const d = day.getDate();
        const start = nyWallToUtc(y, m, d, hour, minute);
        if (start >= rangeStart && start <= rangeEnd) {
          out.push({
            ...event,
            id: `${event.id}__${dateKey}`,
            start: start.toISOString(),
            end: new Date(start.getTime() + durationMs).toISOString(),
          });
        }
      }
      day = addDays(day, 7);
    }
  }

  return out.sort((a, b) => a.start.localeCompare(b.start));
}

export function buildWeeklyHerCall(): CalendarEvent {
  const now = new Date();
  let day = startOfDay(now);
  while (day.getDay() !== 0) day = addDays(day, 1);

  const y = day.getFullYear();
  const m = day.getMonth() + 1;
  const d = day.getDate();
  const start = nyWallToUtc(y, m, d, 20, 0); // 8:00 PM Eastern
  const end = nyWallToUtc(y, m, d, 21, 0); // 9:00 PM Eastern

  return {
    id: "weekly-her-call",
    title: "Weekly HER call",
    description: "Recurring Sunday leadership call at 8:00 PM Eastern.",
    start: start.toISOString(),
    end: end.toISOString(),
    location: "",
    createdBy: "HER HQ",
    createdAt: new Date().toISOString(),
    recurrence: "weekly",
  };
}

export function withWeeklyHerCall(events: CalendarEvent[]): CalendarEvent[] {
  const exists = events.some(
    (e) =>
      e.id === "weekly-her-call" ||
      (e.recurrence === "weekly" &&
        e.title.trim().toLowerCase() === "weekly her call"),
  );
  if (exists) return events;
  return [...events, buildWeeklyHerCall()];
}
