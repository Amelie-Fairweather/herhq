"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  IDEA_CATEGORIES,
  IDEA_SCOPES,
  ideaCategoryLabel,
  ideaScopeLabel,
} from "@/lib/ideas";
import type {
  Idea,
  IdeaCategory,
  IdeaPledge,
  IdeaScope,
} from "@/lib/types";

type Me = { username: string; name: string };

function isMine(pledge: IdeaPledge, me: Me | null) {
  if (!me) return false;
  return (
    pledge.bidderUsername === me.username || pledge.bidderName === me.name
  );
}

export function IdeasBoard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [pledges, setPledges] = useState<IdeaPledge[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<IdeaCategory | "all">(
    "all",
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "other" as IdeaCategory,
    scope: "state" as IdeaScope,
    membersNeeded: "1",
    slackUsername: "",
    description: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/ideas");
    const data = (await res.json()) as {
      ideas?: Idea[];
      pledges?: IdeaPledge[];
      me?: Me;
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Failed to load ideas");
      return;
    }
    setIdeas(data.ideas || []);
    setPledges(data.pledges || []);
    setMe(data.me || null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    return ideas.filter((idea) => {
      if (idea.status === "archived") return false;
      if (categoryFilter === "all") return true;
      return idea.category === categoryFilter;
    });
  }, [ideas, categoryFilter]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        membersNeeded: Number(form.membersNeeded),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not post idea");
      return;
    }
    setForm({
      title: "",
      category: "other",
      scope: "state",
      membersNeeded: "1",
      slackUsername: "",
      description: "",
    });
    setShowForm(false);
    await load();
  }

  async function pledge(ideaId: string) {
    setError("");
    const res = await fetch(`/api/ideas/${ideaId}/pledges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not pledge");
      return;
    }
    await load();
  }

  async function withdraw(ideaId: string, pledgeId: string) {
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

  async function archive(ideaId: string) {
    await fetch("/api/ideas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ideaId, status: "archived" }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`btn !min-h-10 !px-3 !py-2 text-sm sm:!px-4 ${
              categoryFilter === "all" ? "btn-secondary" : "btn-ghost"
            }`}
          >
            All
          </button>
          {IDEA_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategoryFilter(cat.value)}
              className={`btn !min-h-10 !px-3 !py-2 text-sm sm:!px-4 ${
                categoryFilter === cat.value ? "btn-secondary" : "btn-ghost"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary !min-h-10 w-full text-sm sm:w-auto"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Close form" : "Post an idea"}
        </button>
      </div>

      {error ? (
        <p className="rounded-2xl bg-[rgba(196,69,105,0.1)] px-4 py-3 text-sm text-[var(--rose-deep)]">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="panel fade-up rounded-3xl p-4 sm:p-6"
        >
          <h3 className="display text-2xl">Propose an idea</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Share what you want to run, how many people you need, and your Slack
            so helpers can find you.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label" htmlFor="idea-title">
                Title
              </label>
              <input
                id="idea-title"
                className="field"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="idea-category">
                Category
              </label>
              <select
                id="idea-category"
                className="field"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as IdeaCategory,
                  }))
                }
                required
              >
                {IDEA_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="idea-scope">
                State / national / international
              </label>
              <select
                id="idea-scope"
                className="field"
                value={form.scope}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    scope: e.target.value as IdeaScope,
                  }))
                }
                required
              >
                {IDEA_SCOPES.map((scope) => (
                  <option key={scope.value} value={scope.value}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="idea-members">
                Members needed
              </label>
              <input
                id="idea-members"
                type="number"
                min={1}
                className="field"
                value={form.membersNeeded}
                onChange={(e) =>
                  setForm((f) => ({ ...f, membersNeeded: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="idea-slack">
                Your Slack username
              </label>
              <input
                id="idea-slack"
                className="field"
                value={form.slackUsername}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slackUsername: e.target.value }))
                }
                placeholder="@yourname"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="idea-description">
                Basic description
              </label>
              <textarea
                id="idea-description"
                className="field min-h-28"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-secondary mt-4 w-full sm:w-auto">
            Post idea
          </button>
        </form>
      ) : null}

      <div className="grid gap-5">
        {visible.length === 0 ? (
          <div className="panel rounded-3xl p-8 text-center">
            <p className="display text-2xl">No ideas here yet</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Post one, or switch the category filter.
            </p>
          </div>
        ) : (
          visible.map((idea, i) => {
            const ideaPledges = pledges.filter(
              (p) => p.ideaId === idea.id && p.status === "active",
            );
            const completedPledges = pledges.filter(
              (p) => p.ideaId === idea.id && p.status === "completed",
            );
            const myPledge = pledges.find(
              (p) =>
                p.ideaId === idea.id &&
                isMine(p, me) &&
                p.status !== "withdrawn",
            );
            const helpers = ideaPledges.length + completedPledges.length;

            return (
              <article
                key={idea.id}
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
                      {idea.status !== "open" ? (
                        <span className="rounded-full bg-[rgba(184,146,58,0.18)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
                          {idea.status}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="display mt-2 text-xl sm:text-2xl md:text-3xl">
                      {idea.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      Posted by {idea.createdBy} · Slack {idea.slackUsername}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      {format(parseISO(idea.createdAt), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  {idea.status === "open" &&
                  me &&
                  (idea.createdByUsername === me.username ||
                    idea.createdBy === me.name) ? (
                    <button
                      type="button"
                      className="btn btn-ghost !py-2 text-sm"
                      onClick={() => void archive(idea.id)}
                    >
                      Archive
                    </button>
                  ) : null}
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                  {idea.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-2xl bg-[var(--mist)]/70 px-3 py-2 font-medium">
                    Need {idea.membersNeeded} member
                    {idea.membersNeeded === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-2xl bg-[var(--mist)]/70 px-3 py-2 font-medium">
                    {helpers} pledged
                    {completedPledges.length > 0
                      ? ` · ${completedPledges.length} done`
                      : ""}
                  </span>
                </div>

                <div className="mt-5 border-t border-[var(--line)] pt-5">
                  <h4 className="font-semibold">
                    Pledged helpers ({ideaPledges.length})
                  </h4>
                  {ideaPledges.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      No pledges yet — be the first.
                    </p>
                  ) : (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {ideaPledges.map((p) => (
                        <li
                          key={p.id}
                          className="rounded-full bg-white px-3 py-1.5 text-sm font-medium"
                        >
                          {p.bidderName}
                        </li>
                      ))}
                    </ul>
                  )}

                  {idea.status === "open" ? (
                    <div className="mt-4">
                      {!myPledge ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => void pledge(idea.id)}
                        >
                          Pledge to help
                        </button>
                      ) : myPledge.status === "active" ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-medium text-[var(--ink)]">
                            You pledged — it also shows under My bids → To-dos.
                          </p>
                          <button
                            type="button"
                            className="btn btn-ghost !py-2 text-sm"
                            onClick={() => void withdraw(idea.id, myPledge.id)}
                          >
                            Withdraw
                          </button>
                        </div>
                      ) : myPledge.status === "completed" ? (
                        <p className="text-sm font-medium text-[var(--ink)]">
                          You marked your help complete.
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
