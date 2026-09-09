"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ideaCategoryLabel, ideaScopeLabel } from "@/lib/ideas";
import type { Application, Bid, Idea, IdeaPledge } from "@/lib/types";

type Me = { username: string; name: string };
type Section = "onboarding" | "todos";
type StatusTab = "active" | "completed";

export function MyBidsBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [pledges, setPledges] = useState<IdeaPledge[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [section, setSection] = useState<Section>("onboarding");
  const [tab, setTab] = useState<StatusTab>("active");

  const load = useCallback(async () => {
    const [appsRes, ideasRes] = await Promise.all([
      fetch("/api/applications"),
      fetch("/api/ideas"),
    ]);
    const appsData = (await appsRes.json()) as {
      applications?: Application[];
      bids?: Bid[];
      me?: Me;
      error?: string;
    };
    const ideasData = (await ideasRes.json()) as {
      ideas?: Idea[];
      pledges?: IdeaPledge[];
      me?: Me;
      error?: string;
    };

    if (!appsRes.ok) {
      setError(appsData.error || "Failed to load onboarding bids");
      return;
    }
    if (!ideasRes.ok) {
      setError(ideasData.error || "Failed to load to-dos");
      return;
    }

    setApplications(appsData.applications || []);
    setBids(appsData.bids || []);
    setIdeas(ideasData.ideas || []);
    setPledges(ideasData.pledges || []);
    setMe(appsData.me || ideasData.me || null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onboarding = useMemo(() => {
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

  const todos = useMemo(() => {
    if (!me) return [];
    return pledges
      .filter(
        (p) =>
          (p.bidderUsername === me.username || p.bidderName === me.name) &&
          (p.status === "active" || p.status === "completed"),
      )
      .map((pledge) => ({
        pledge,
        idea: ideas.find((i) => i.id === pledge.ideaId) || null,
      }))
      .filter((row) => row.idea)
      .sort((a, b) => b.pledge.createdAt.localeCompare(a.pledge.createdAt));
  }, [ideas, pledges, me]);

  const visibleOnboarding = onboarding.filter((row) =>
    tab === "active" ? row.bid.status === "active" : row.bid.status === "completed",
  );
  const visibleTodos = todos.filter((row) =>
    tab === "active"
      ? row.pledge.status === "active"
      : row.pledge.status === "completed",
  );

  async function withdrawBid(applicationId: string, bidId: string) {
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

  async function completeBid(applicationId: string, bidId: string) {
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

  async function withdrawPledge(ideaId: string, pledgeId: string) {
    setError("");
    const res = await fetch(`/api/ideas/${ideaId}/pledges`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "withdraw", pledgeId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not withdraw");
      return;
    }
    await load();
  }

  async function completePledge(ideaId: string, pledgeId: string) {
    setError("");
    const res = await fetch(`/api/ideas/${ideaId}/pledges`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", pledgeId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not complete");
      return;
    }
    await load();
  }

  const onboardingActiveCount = onboarding.filter(
    (row) => row.bid.status === "active",
  ).length;
  const todosActiveCount = todos.filter(
    (row) => row.pledge.status === "active",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--rose)] sm:text-xs">
          What are you looking at?
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSection("onboarding")}
            className={`rounded-2xl border px-4 py-3.5 text-left transition-colors ${
              section === "onboarding"
                ? "border-[var(--ink)] bg-[var(--ink)] text-white shadow-[0_10px_24px_rgba(155,20,104,0.25)]"
                : "border-[var(--line)] bg-white/80 text-[var(--ink)] hover:bg-[var(--mist)]"
            }`}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">
              Chapter calls
            </span>
            <span className="display mt-1 block text-xl sm:text-2xl">
              Onboarding
            </span>
            <span
              className={`mt-1 block text-sm ${
                section === "onboarding" ? "text-white/85" : "text-[var(--ink-soft)]"
              }`}
            >
              {onboardingActiveCount} active
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSection("todos")}
            className={`rounded-2xl border px-4 py-3.5 text-left transition-colors ${
              section === "todos"
                ? "border-[var(--ink)] bg-[var(--ink)] text-white shadow-[0_10px_24px_rgba(155,20,104,0.25)]"
                : "border-[var(--line)] bg-white/80 text-[var(--ink)] hover:bg-[var(--mist)]"
            }`}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">
              Idea pledges
            </span>
            <span className="display mt-1 block text-xl sm:text-2xl">To-dos</span>
            <span
              className={`mt-1 block text-sm ${
                section === "todos" ? "text-white/85" : "text-[var(--ink-soft)]"
              }`}
            >
              {todosActiveCount} active
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-sm font-semibold text-[var(--ink-soft)]">Show:</p>
        <button
          type="button"
          className={`btn !min-h-10 !px-3 !py-2 text-sm sm:!px-4 ${
            tab === "active" ? "btn-primary" : "btn-ghost"
          }`}
          onClick={() => setTab("active")}
        >
          Active
        </button>
        <button
          type="button"
          className={`btn !min-h-10 !px-3 !py-2 text-sm sm:!px-4 ${
            tab === "completed" ? "btn-primary" : "btn-ghost"
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

      {section === "onboarding" ? (
        visibleOnboarding.length === 0 ? (
          <div className="panel rounded-3xl p-8 text-center">
            <p className="display text-2xl">
              {tab === "active" ? "No active onboarding bids" : "No completed calls yet"}
            </p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {tab === "active" ? (
                <>
                  Go to{" "}
                  <Link href="/bidding" className="font-semibold text-[var(--rose)]">
                    Onboarding
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
            {visibleOnboarding.map(({ bid, app }, i) =>
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
                      {bid.status === "completed" ? (
                        <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                          Completed by {bid.bidderName}
                        </p>
                      ) : null}
                    </div>
                    {bid.status === "active" ? (
                      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                        <button
                          type="button"
                          className="btn btn-primary !min-h-10 flex-1 !py-2 text-sm sm:flex-none"
                          onClick={() => void completeBid(app.id, bid.id)}
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost !min-h-10 flex-1 !py-2 text-sm sm:flex-none"
                          onClick={() => void withdrawBid(app.id, bid.id)}
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
        )
      ) : visibleTodos.length === 0 ? (
        <div className="panel rounded-3xl p-8 text-center">
          <p className="display text-2xl">
            {tab === "active" ? "No active to-dos" : "No completed to-dos yet"}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {tab === "active" ? (
              <>
                Go to{" "}
                <Link href="/ideas" className="font-semibold text-[var(--rose)]">
                  Idea proposals
                </Link>{" "}
                and click Pledge to help.
              </>
            ) : (
              "Completed idea pledges will show up here."
            )}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleTodos.map(({ pledge, idea }, i) =>
            idea ? (
              <article
                key={pledge.id}
                className="panel fade-up rounded-3xl p-4 sm:p-6"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--ink)] px-2.5 py-1 text-xs font-semibold text-white">
                        {ideaCategoryLabel(idea.category)}
                      </span>
                      <span className="rounded-full bg-[var(--mist)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                        {ideaScopeLabel(idea.scope)}
                      </span>
                      <span className="rounded-full bg-[var(--mist)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                        {pledge.status}
                      </span>
                    </div>
                    <h3 className="display mt-2 text-2xl">{idea.title}</h3>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      Posted by {idea.createdBy} · Slack {idea.slackUsername}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Pledged{" "}
                      {format(parseISO(pledge.createdAt), "MMM d, yyyy · h:mm a")}
                      {pledge.completedAt
                        ? ` · completed ${format(parseISO(pledge.completedAt), "MMM d, yyyy")}`
                        : ""}
                    </p>
                    {pledge.status === "completed" ? (
                      <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                        Completed by {pledge.bidderName}
                      </p>
                    ) : null}
                  </div>
                  {pledge.status === "active" ? (
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                      <button
                        type="button"
                        className="btn btn-primary !min-h-10 flex-1 !py-2 text-sm sm:flex-none"
                        onClick={() => void completePledge(idea.id, pledge.id)}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost !min-h-10 flex-1 !py-2 text-sm sm:flex-none"
                        onClick={() => void withdrawPledge(idea.id, pledge.id)}
                      >
                        Withdraw
                      </button>
                    </div>
                  ) : null}
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                  {idea.description}
                </p>
                <p className="mt-3 text-sm text-[var(--ink-soft)]">
                  Needs {idea.membersNeeded} member
                  {idea.membersNeeded === 1 ? "" : "s"}
                </p>
              </article>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
