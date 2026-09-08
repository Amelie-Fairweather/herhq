"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { Application, Bid } from "@/lib/types";

type Me = { username: string; name: string };

export function MyBidsBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"active" | "completed">("active");

  const load = useCallback(async () => {
    const res = await fetch("/api/applications");
    const data = (await res.json()) as {
      applications?: Application[];
      bids?: Bid[];
      me?: Me;
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Failed to load bids");
      return;
    }
    setApplications(data.applications || []);
    setBids(data.bids || []);
    setMe(data.me || null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mine = useMemo(() => {
    if (!me) return [];
    return bids
      .filter(
        (b) =>
          (b.bidderUsername === me.username || b.bidderName === me.name) &&
          (b.status === "active" || b.status === "completed"),
      )
      .map((bid) => ({
        bid,
        app: applications.find((a) => a.id === bid.applicationId) || null,
      }))
      .filter((row) => row.app)
      .sort((a, b) => b.bid.createdAt.localeCompare(a.bid.createdAt));
  }, [applications, bids, me]);

  const visible = mine.filter((row) =>
    tab === "active" ? row.bid.status === "active" : row.bid.status === "completed",
  );

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

  async function complete(applicationId: string, bidId: string) {
    setError("");
    const res = await fetch(`/api/applications/${applicationId}/bids`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", bidId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not complete");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn !min-h-10 !px-3 !py-2 text-sm sm:!px-4 ${
            tab === "active" ? "btn-secondary" : "btn-ghost"
          }`}
          onClick={() => setTab("active")}
        >
          Active
        </button>
        <button
          type="button"
          className={`btn !min-h-10 !px-3 !py-2 text-sm sm:!px-4 ${
            tab === "completed" ? "btn-secondary" : "btn-ghost"
          }`}
          onClick={() => setTab("completed")}
        >
          Completed
        </button>
      </div>

      {error ? (
        <p className="rounded-2xl bg-[rgba(196,69,105,0.1)] px-4 py-3 text-sm text-[var(--rose-deep)]">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="panel rounded-3xl p-8 text-center">
          <p className="display text-2xl">
            {tab === "active" ? "No active bids" : "No completed calls yet"}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {tab === "active" ? (
              <>
                Go to{" "}
                <Link href="/bidding" className="font-semibold text-[var(--rose)]">
                  Onboarding bids
                </Link>{" "}
                and click Bid on a call.
              </>
            ) : (
              "Completed onboardings will show up here."
            )}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visible.map(({ bid, app }, i) =>
            app ? (
              <article
                key={bid.id}
                className="panel fade-up rounded-3xl p-4 sm:p-6"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {app.formNumber != null ? (
                        <span className="rounded-full bg-[var(--ink)] px-2.5 py-1 text-xs font-semibold text-white">
                          #{app.formNumber}
                        </span>
                      ) : null}
                      <h3 className="display text-2xl">{app.nameAndGrade}</h3>
                      <span className="rounded-full bg-[var(--mist)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                        {bid.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[var(--ink-soft)]">
                      {app.schoolTownState}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Bid{" "}
                      {format(parseISO(bid.createdAt), "MMM d, yyyy · h:mm a")}
                      {bid.completedAt
                        ? ` · completed ${format(parseISO(bid.completedAt), "MMM d, yyyy")}`
                        : ""}
                    </p>
                  </div>
                  {bid.status === "active" ? (
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                      <button
                        type="button"
                        className="btn btn-primary !min-h-10 flex-1 !py-2 text-sm sm:flex-none"
                        onClick={() => void complete(app.id, bid.id)}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost !min-h-10 flex-1 !py-2 text-sm sm:flex-none"
                        onClick={() => void withdraw(app.id, bid.id)}
                      >
                        Withdraw
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <p className="label">Contact</p>
                    <p>{app.contact || "—"}</p>
                  </div>
                  <div>
                    <p className="label">Co-leaders</p>
                    <p>{app.coLeaders || "None listed"}</p>
                  </div>
                  <div>
                    <p className="label">Why start a HER</p>
                    <p className="whitespace-pre-wrap">{app.whyStart || "—"}</p>
                  </div>
                  <div>
                    <p className="label">Meeting availability</p>
                    <p className="whitespace-pre-wrap">
                      {app.meetingAvailability || "—"}
                    </p>
                  </div>
                </div>
              </article>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
