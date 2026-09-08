"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { Application, Bid } from "@/lib/types";

export function BiddingBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [filter, setFilter] = useState<"open" | "awarded" | "all">("open");
  const [noteByApp, setNoteByApp] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({
    nameAndGrade: "",
    schoolTownState: "",
    coLeaders: "",
    contact: "",
    heardAbout: "",
    whyStart: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/applications");
    const data = (await res.json()) as {
      applications?: Application[];
      bids?: Bid[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Failed to load applications");
      return;
    }
    setApplications(data.applications || []);
    setBids(data.bids || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = applications.filter((a) =>
    filter === "all" ? true : a.status === filter,
  );

  async function placeBid(applicationId: string) {
    setError("");
    const res = await fetch(`/api/applications/${applicationId}/bids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteByApp[applicationId] || "" }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not place bid");
      return;
    }
    setNoteByApp((m) => ({ ...m, [applicationId]: "" }));
    await load();
  }

  async function award(applicationId: string, awardTo: string) {
    setError("");
    const res = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: applicationId, awardTo }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not award");
      return;
    }
    await load();
  }

  async function archive(applicationId: string) {
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: applicationId, status: "archived" }),
    });
    await load();
  }

  async function addManual(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manual),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not add application");
      return;
    }
    setManual({
      nameAndGrade: "",
      schoolTownState: "",
      coLeaders: "",
      contact: "",
      heardAbout: "",
      whyStart: "",
    });
    setShowManual(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["open", "awarded", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`btn !px-4 !py-2 text-sm ${
                filter === f ? "btn-secondary" : "btn-ghost"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowManual((v) => !v)}
        >
          {showManual ? "Close form" : "Add application manually"}
        </button>
      </div>

      {error ? (
        <p className="rounded-2xl bg-[rgba(196,69,105,0.1)] px-4 py-3 text-sm text-[var(--rose-deep)]">
          {error}
        </p>
      ) : null}

      {showManual ? (
        <form onSubmit={addManual} className="panel fade-up rounded-3xl p-6">
          <h3 className="display text-2xl">Manual application</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Use this if a Google Form response needs to be entered by hand.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(
              [
                ["nameAndGrade", "Name and grade"],
                ["schoolTownState", "High school, town, state"],
                ["coLeaders", "Co-leaders"],
                ["contact", "Best contact (private)"],
                ["heardAbout", "How they heard about us"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  className="field"
                  value={manual[key]}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, [key]: e.target.value }))
                  }
                  required={key === "nameAndGrade" || key === "schoolTownState"}
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="label">Why they want to start a HER</label>
              <textarea
                className="field min-h-24"
                value={manual.whyStart}
                onChange={(e) =>
                  setManual((m) => ({ ...m, whyStart: e.target.value }))
                }
              />
            </div>
          </div>
          <button type="submit" className="btn btn-secondary mt-4">
            Add to bid board
          </button>
        </form>
      ) : null}

      <div className="grid gap-5">
        {visible.length === 0 ? (
          <div className="panel rounded-3xl p-8 text-center">
            <p className="display text-2xl">No applications here yet</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              When someone submits the{" "}
              <a
                className="font-semibold text-[var(--rose)] underline"
                href="https://docs.google.com/forms/d/1uCjsP-O7k6S3d_As3J2pampyR4RJQ0K7z5-txtg6EfA/viewform"
                target="_blank"
                rel="noreferrer"
              >
                HER registration form
              </a>
              , it will land here for onboarding bids.
            </p>
          </div>
        ) : (
          visible.map((app, i) => {
            const appBids = bids.filter((b) => b.applicationId === app.id);
            return (
              <article
                key={app.id}
                className="panel fade-up rounded-3xl p-6"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="display text-2xl md:text-3xl">
                        {app.nameAndGrade}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                          app.status === "open"
                            ? "bg-[rgba(196,69,105,0.12)] text-[var(--rose-deep)]"
                            : app.status === "awarded"
                              ? "bg-[rgba(184,146,58,0.18)] text-[var(--ink)]"
                              : "bg-[var(--mist)] text-[var(--ink-soft)]"
                        }`}
                      >
                        {app.status}
                      </span>
                      <span className="rounded-full bg-[var(--mist)] px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)]">
                        {app.source === "google-form" ? "Google Form" : "Manual"}
                      </span>
                    </div>
                    <p className="mt-1 text-[var(--ink-soft)]">{app.schoolTownState}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Submitted{" "}
                      {format(parseISO(app.submittedAt), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  {app.status === "open" ? (
                    <button
                      type="button"
                      className="btn btn-ghost !py-2 text-sm"
                      onClick={() => void archive(app.id)}
                    >
                      Archive
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--mist)]/60 p-4">
                    <p className="label">Why start a HER</p>
                    <p className="text-sm leading-relaxed">
                      {app.whyStart || "—"}
                    </p>
                  </div>
                  <div className="space-y-3 rounded-2xl bg-[var(--mist)]/60 p-4 text-sm">
                    <p>
                      <span className="label !mb-0 inline">Co-leaders</span>
                      <br />
                      {app.coLeaders || "None listed"}
                    </p>
                    <p>
                      <span className="label !mb-0 inline">Heard about us</span>
                      <br />
                      {app.heardAbout || "—"}
                    </p>
                    <p>
                      <span className="label !mb-0 inline">Private contact</span>
                      <br />
                      {app.contact || "—"}
                    </p>
                  </div>
                </div>

                {app.status === "awarded" ? (
                  <p className="mt-4 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm">
                    Awarded to <strong>{app.awardedTo}</strong>
                    {app.awardedAt
                      ? ` on ${format(parseISO(app.awardedAt), "MMM d, yyyy")}`
                      : ""}
                  </p>
                ) : null}

                <div className="mt-5 border-t border-[var(--line)] pt-5">
                  <h4 className="font-semibold">
                    Bids ({appBids.length})
                  </h4>
                  {appBids.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      No bids yet. Claim this onboarding if you can support them.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {appBids.map((bid) => (
                        <li
                          key={bid.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold">{bid.bidderName}</p>
                            <p className="text-sm text-[var(--ink-soft)]">
                              {bid.note || "No note"}
                            </p>
                          </div>
                          {app.status === "open" ? (
                            <button
                              type="button"
                              className="btn btn-secondary !py-2 text-sm"
                              onClick={() => void award(app.id, bid.bidderName)}
                            >
                              Award onboarding
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}

                  {app.status === "open" ? (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        className="field"
                        placeholder="Why you'd be a strong onboarder…"
                        value={noteByApp[app.id] || ""}
                        onChange={(e) =>
                          setNoteByApp((m) => ({
                            ...m,
                            [app.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-primary shrink-0"
                        onClick={() => void placeBid(app.id)}
                      >
                        Place bid
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
