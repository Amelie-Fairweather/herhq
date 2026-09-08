"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarEvent } from "@/lib/types";

export function CalendarBoard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    start: "",
    end: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/events");
    const data = (await res.json()) as { events?: CalendarEvent[]; error?: string };
    if (!res.ok) {
      setError(data.error || "Failed to load events");
      setLoading(false);
      return;
    }
    setEvents(data.events || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const dayEvents = events.filter((e) => isSameDay(parseISO(e.start), selected));

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not create event");
      return;
    }
    setForm({ title: "", description: "", location: "", start: "", end: "" });
    await load();
  }

  async function onDelete(id: string) {
    await fetch(`/api/events?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
      <section className="panel fade-up overflow-hidden rounded-3xl p-4 sm:p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-2xl sm:text-3xl">{format(cursor, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost !min-h-10 !px-3 !py-2"
              onClick={() => setCursor((c) => addMonths(c, -1))}
            >
              ←
            </button>
            <button
              type="button"
              className="btn btn-ghost !min-h-10 !px-3 !py-2"
              onClick={() => {
                const now = new Date();
                setCursor(startOfMonth(now));
                setSelected(now);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="btn btn-ghost !min-h-10 !px-3 !py-2"
              onClick={() => setCursor((c) => addMonths(c, 1))}
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-soft)] sm:mt-5 sm:gap-1 sm:text-xs sm:tracking-[0.12em]">
          {(
            [
              ["S", "Sun"],
              ["M", "Mon"],
              ["T", "Tue"],
              ["W", "Wed"],
              ["T", "Thu"],
              ["F", "Fri"],
              ["S", "Sat"],
            ] as const
          ).map(([short, full], i) => (
            <div key={`${full}-${i}`} className="py-1 sm:py-2">
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{full}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor);
            const active = isSameDay(day, selected);
            const count = events.filter((e) => isSameDay(parseISO(e.start), day)).length;
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelected(day)}
                className={`min-h-11 rounded-xl border p-1.5 text-left transition-colors sm:min-h-16 sm:rounded-2xl sm:p-2 ${
                  active
                    ? "border-[var(--rose)] bg-[rgba(254,76,186,0.12)]"
                    : "border-transparent hover:bg-[var(--mist)]"
                } ${inMonth ? "text-[var(--ink)]" : "text-[var(--ink-soft)]/50"}`}
              >
                <span className="text-xs font-semibold sm:text-sm">{format(day, "d")}</span>
                {count > 0 ? (
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-[var(--rose)] sm:mt-2" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-6">
        <section className="panel fade-up rounded-3xl p-4 sm:p-5 md:p-6" style={{ animationDelay: "70ms" }}>
          <h3 className="display text-xl sm:text-2xl">{format(selected, "EEEE, MMM d")}</h3>
          {loading ? (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">Loading…</p>
          ) : dayEvents.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">Nothing posted for this day.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dayEvents.map((event) => (
                <li key={event.id} className="rounded-2xl bg-[var(--mist)]/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-[var(--ink-soft)]">
                        {format(parseISO(event.start), "h:mm a")} –{" "}
                        {format(parseISO(event.end), "h:mm a")}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                      {event.description ? (
                        <p className="mt-2 text-sm">{event.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-[var(--ink-soft)]">
                        Posted by {event.createdBy}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[var(--rose-deep)]"
                      onClick={() => void onDelete(event.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel fade-up rounded-3xl p-4 sm:p-5 md:p-6" style={{ animationDelay: "120ms" }}>
          <h3 className="display text-xl sm:text-2xl">Post an event</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Anyone on leadership can add meetings, deadlines, and chapter calls.
          </p>
          <form onSubmit={onCreate} className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                className="field"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="start">
                  Starts
                </label>
                <input
                  id="start"
                  type="datetime-local"
                  className="field"
                  value={form.start}
                  onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="end">
                  Ends
                </label>
                <input
                  id="end"
                  type="datetime-local"
                  className="field"
                  value={form.end}
                  onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="location">
                Location / link
              </label>
              <input
                id="location"
                className="field"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="description">
                Details
              </label>
              <textarea
                id="description"
                className="field min-h-24"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            {error ? <p className="text-sm text-[var(--rose-deep)]">{error}</p> : null}
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              Add to calendar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
