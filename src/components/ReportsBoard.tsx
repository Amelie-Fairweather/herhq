"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { WeeklyReport } from "@/lib/types";
import { formatWeekLabel, mondayOf } from "@/lib/utils";

type ArchiveWeek = { weekOf: string; folder: string; count: number };

function ReportCard({ report }: { report: WeeklyReport }) {
  return (
    <li className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{report.authorName}</p>
        <p className="text-xs text-[var(--ink-soft)]">
          {report.hoursSpent} hrs · filed{" "}
          {format(parseISO(report.updatedAt || report.createdAt), "MMM d, h:mm a")}
        </p>
      </div>
      <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
        <div>
          <p className="label">Wins</p>
          <p className="whitespace-pre-wrap">{report.wins}</p>
        </div>
        <div>
          <p className="label">Blockers</p>
          <p className="whitespace-pre-wrap">{report.blockers || "—"}</p>
        </div>
        <div>
          <p className="label">Next week</p>
          <p className="whitespace-pre-wrap">{report.nextWeek || "—"}</p>
        </div>
      </div>
    </li>
  );
}

export function ReportsBoard() {
  const [tab, setTab] = useState<"current" | "archive">("current");
  const [currentReports, setCurrentReports] = useState<WeeklyReport[]>([]);
  const [archiveWeeks, setArchiveWeeks] = useState<ArchiveWeek[]>([]);
  const [selectedArchiveWeek, setSelectedArchiveWeek] = useState<string>("");
  const [archiveReports, setArchiveReports] = useState<WeeklyReport[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    weekOf: mondayOf(),
    wins: "",
    blockers: "",
    nextWeek: "",
    hoursSpent: "0",
  });

  const loadCurrent = useCallback(async () => {
    const res = await fetch("/api/reports");
    const data = (await res.json()) as {
      reports?: WeeklyReport[];
      archiveWeeks?: ArchiveWeek[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Failed to load reports");
      return;
    }
    setCurrentReports(data.reports || []);
    setArchiveWeeks(data.archiveWeeks || []);
    setSelectedArchiveWeek((prev) => prev || data.archiveWeeks?.[0]?.weekOf || "");
  }, []);

  const loadArchiveWeek = useCallback(async (weekOf: string) => {
    if (!weekOf) {
      setArchiveReports([]);
      return;
    }
    const res = await fetch(
      `/api/reports?view=archive&week=${encodeURIComponent(weekOf)}`,
    );
    const data = (await res.json()) as {
      reports?: WeeklyReport[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Failed to open archive week");
      return;
    }
    setArchiveReports(data.reports || []);
  }, []);

  useEffect(() => {
    void loadCurrent();
  }, [loadCurrent]);

  useEffect(() => {
    if (tab === "archive" && selectedArchiveWeek) {
      void loadArchiveWeek(selectedArchiveWeek);
    }
  }, [tab, selectedArchiveWeek, loadArchiveWeek]);

  const groupedCurrent = useMemo(() => {
    const map = new Map<string, WeeklyReport[]>();
    for (const report of currentReports) {
      const list = map.get(report.weekOf) || [];
      list.push(report);
      map.set(report.weekOf, list);
    }
    return [...map.entries()];
  }, [currentReports]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        hoursSpent: Number(form.hoursSpent),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not save report");
      return;
    }
    setForm((f) => ({
      ...f,
      wins: "",
      blockers: "",
      nextWeek: "",
      hoursSpent: "0",
    }));
    setTab("current");
    await loadCurrent();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.2fr]">
      <form onSubmit={onSubmit} className="panel fade-up h-fit rounded-3xl p-4 sm:p-6">
        <h2 className="display text-2xl sm:text-3xl">File this week</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Reports are saved as files on the site. When a week ends, they move
          into the archive folder automatically.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="label" htmlFor="weekOf">
              Week of (Monday)
            </label>
            <input
              id="weekOf"
              type="date"
              className="field"
              value={form.weekOf}
              onChange={(e) => setForm((f) => ({ ...f, weekOf: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="wins">
              Wins / progress
            </label>
            <textarea
              id="wins"
              className="field min-h-28"
              value={form.wins}
              onChange={(e) => setForm((f) => ({ ...f, wins: e.target.value }))}
              required
              placeholder="What moved forward?"
            />
          </div>
          <div>
            <label className="label" htmlFor="blockers">
              Blockers
            </label>
            <textarea
              id="blockers"
              className="field min-h-20"
              value={form.blockers}
              onChange={(e) =>
                setForm((f) => ({ ...f, blockers: e.target.value }))
              }
              placeholder="What slowed you down?"
            />
          </div>
          <div>
            <label className="label" htmlFor="nextWeek">
              Next week focus
            </label>
            <textarea
              id="nextWeek"
              className="field min-h-20"
              value={form.nextWeek}
              onChange={(e) =>
                setForm((f) => ({ ...f, nextWeek: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="hours">
              Hours spent
            </label>
            <input
              id="hours"
              type="number"
              min="0"
              step="0.5"
              className="field"
              value={form.hoursSpent}
              onChange={(e) =>
                setForm((f) => ({ ...f, hoursSpent: e.target.value }))
              }
            />
          </div>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-[var(--rose-deep)]">{error}</p>
        ) : null}

        <button type="submit" className="btn btn-primary mt-5 w-full sm:w-auto">
          Submit weekly report
        </button>
      </form>

      <section className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn !min-h-10 !px-3 !py-2 text-sm sm:!px-4 ${
              tab === "current" ? "btn-secondary" : "btn-ghost"
            }`}
            onClick={() => setTab("current")}
          >
            This week / current
          </button>
          <button
            type="button"
            className={`btn !min-h-10 !px-3 !py-2 text-sm sm:!px-4 ${
              tab === "archive" ? "btn-secondary" : "btn-ghost"
            }`}
            onClick={() => setTab("archive")}
          >
            Archive by week
          </button>
        </div>

        {tab === "current" ? (
          groupedCurrent.length === 0 ? (
            <div className="panel fade-up rounded-3xl p-8 text-center">
              <p className="display text-2xl">No current reports yet</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                File one on the left. Older weeks will show under Archive.
              </p>
            </div>
          ) : (
            groupedCurrent.map(([week, list], i) => (
              <div
                key={week}
                className="panel fade-up rounded-3xl p-4 sm:p-6"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="display text-2xl">
                    Week of {formatWeekLabel(week)}
                  </h3>
                  <span className="rounded-full bg-[rgba(196,69,105,0.12)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rose-deep)]">
                    Current
                  </span>
                </div>
                <ul className="mt-4 space-y-4">
                  {list.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </ul>
              </div>
            ))
          )
        ) : (
          <div className="panel fade-up rounded-3xl p-4 sm:p-6">
            <h3 className="display text-xl sm:text-2xl">Archive folders</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Each finished week lives in{" "}
              <code className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-xs">
                data/reports/archive/week-of-YYYY-MM-DD/
              </code>
            </p>

            {archiveWeeks.length === 0 ? (
              <p className="mt-6 text-sm text-[var(--ink-soft)]">
                No archived weeks yet. When the calendar week rolls over,
                current reports move here automatically.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {archiveWeeks.map((week) => (
                    <button
                      key={week.weekOf}
                      type="button"
                      onClick={() => setSelectedArchiveWeek(week.weekOf)}
                      className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                        selectedArchiveWeek === week.weekOf
                          ? "bg-[var(--ink)] text-white"
                          : "bg-[var(--mist)] text-[var(--ink-soft)] hover:bg-white"
                      }`}
                    >
                      {formatWeekLabel(week.weekOf)}
                      <span className="ml-2 opacity-70">({week.count})</span>
                    </button>
                  ))}
                </div>

                {selectedArchiveWeek ? (
                  <div className="mt-6">
                    <p className="label">
                      Folder · week-of-{selectedArchiveWeek}
                    </p>
                    {archiveReports.length === 0 ? (
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        No reports in this folder.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-4">
                        {archiveReports.map((report) => (
                          <ReportCard key={report.id} report={report} />
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
