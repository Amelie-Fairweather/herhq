"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { Application, Bid } from "@/lib/types";

type Me = { username: string; name: string };

function isMine(bid: Bid, me: Me | null) {
  if (!me) return false;
  return bid.bidderUsername === me.username || bid.bidderName === me.name;
}

export function BiddingBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [filter, setFilter] = useState<"open" | "completed" | "all">("open");
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({
    nameAndGrade: "",
    schoolTownState: "",
    coLeaders: "",
    contact: "",
    heardAbout: "",
    whyStart: "",
    meetingAvailability: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/applications");
    const data = (await res.json()) as {
      applications?: Application[];
      bids?: Bid[];
      me?: Me;
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Failed to load applications");
      return;
    }
    setApplications(data.applications || []);
    setBids(data.bids || []);
    setMe(data.me || null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = applications.filter((a) => {
    if (filter === "all") return true;
    if (filter === "open") return a.status === "open";
    if (filter === "completed") return a.status === "completed";
    return true;
  });

  async function respond(applicationId: string, action: "bid" | "pass") {
    setError("");
    const res = await fetch(`/api/applications/${applicationId}/bids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not save response");
      return;
    }
    await load();
  }

  async function withdraw(applicationId: string, bidId: string) {
    setError("");
    const res = await fetch(`/api/applications/${applicationId}/bids`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "withdraw", bidId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not withdraw");
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
      meetingAvailability: "",
    });
    setShowManual(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["open", "completed", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`btn !min-h-10 !px-3 !py-2 text-sm sm:!px-4 ${
                filter === f ? "btn-secondary" : "btn-ghost"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary !min-h-10 w-full text-sm sm:w-auto"
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
        <form onSubmit={addManual} className="panel fade-up rounded-3xl p-4 sm:p-6">
          <h3 className="display text-2xl">Manual application</h3>
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
            <div className="md:col-span-2">
              <label className="label">
                Meeting availability (dates/times + time zone)
              </label>
              <textarea
                className="field min-h-24"
                value={manual.meetingAvailability}
                onChange={(e) =>
                  setManual((m) => ({
                    ...m,
                    meetingAvailability: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <button type="submit" className="btn btn-secondary mt-4 w-full sm:w-auto">
            Add to bid board
          </button>
        </form>
      ) : null}

      <div className="grid gap-5">
        {visible.length === 0 ? (
          <div className="panel rounded-3xl p-8 text-center">
            <p className="display text-2xl">No applications here yet</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              New registration form submissions will show up here for bidding.
            </p>
          </div>
        ) : (
          visible.map((app, i) => {
            const appBids = bids.filter(
              (b) => b.applicationId === app.id && b.status === "active",
            );
            const myBid = bids.find(
              (b) =>
                b.applicationId === app.id &&
                isMine(b, me) &&
                b.status !== "withdrawn",
            );

            return (
              <article
                key={app.id}
                className="panel fade-up rounded-3xl p-4 sm:p-6"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {app.formNumber != null ? (
                        <span className="rounded-full bg-[var(--ink)] px-2.5 py-1 text-xs font-semibold text-white">
                          #{app.formNumber}
                        </span>
                      ) : null}
                      <h3 className="display text-xl sm:text-2xl md:text-3xl">
                        {app.nameAndGrade}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                          app.status === "open"
                            ? "bg-[rgba(196,69,105,0.12)] text-[var(--rose-deep)]"
                            : app.status === "completed"
                              ? "bg-[rgba(184,146,58,0.18)] text-[var(--ink)]"
                              : "bg-[var(--mist)] text-[var(--ink-soft)]"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[var(--ink-soft)]">
                      {app.schoolTownState}
                    </p>
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {app.whyStart || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--mist)]/60 p-4">
                    <p className="label">Meeting availability</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {app.meetingAvailability || "—"}
                    </p>
                  </div>
                  <div className="space-y-3 rounded-2xl bg-[var(--mist)]/60 p-4 text-sm md:col-span-2">
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

                <div className="mt-5 border-t border-[var(--line)] pt-5">
                  <h4 className="font-semibold">
                    Active bids ({appBids.length})
                  </h4>
                  {appBids.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      No bids yet.
                    </p>
                  ) : (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {appBids.map((bid) => (
                        <li
                          key={bid.id}
                          className="rounded-full bg-white px-3 py-1.5 text-sm font-medium"
                        >
                          {bid.bidderName}
                        </li>
                      ))}
                    </ul>
                  )}

                  {app.status === "open" ? (
                    <div className="mt-4">
                      {!myBid ? (
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            className="btn btn-primary flex-1 sm:flex-none"
                            onClick={() => void respond(app.id, "bid")}
                          >
                            Bid
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost flex-1 sm:flex-none"
                            onClick={() => void respond(app.id, "pass")}
                          >
                            Not bid
                          </button>
                        </div>
                      ) : myBid.status === "active" ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-medium text-[var(--ink)]">
                            You bid on this call.
                          </p>
                          <button
                            type="button"
                            className="btn btn-ghost !py-2 text-sm"
                            onClick={() => void withdraw(app.id, myBid.id)}
                          >
                            Withdraw
                          </button>
                        </div>
                      ) : myBid.status === "passed" ? (
                        <p className="text-sm text-[var(--ink-soft)]">
                          You chose not to bid.
                        </p>
                      ) : myBid.status === "completed" ? (
                        <p className="text-sm font-medium text-[var(--ink)]">
                          You marked this onboarding complete.
                        </p>
                      ) : null}
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
