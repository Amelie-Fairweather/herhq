import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/db";
import { IDEA_CATEGORIES, IDEA_SCOPES } from "@/lib/ideas";
import type { Idea, IdeaCategory, IdeaScope, IdeaStatus } from "@/lib/types";
import { uid } from "@/lib/utils";

const categoryValues = new Set(IDEA_CATEGORIES.map((c) => c.value));
const scopeValues = new Set(IDEA_SCOPES.map((s) => s.value));

function normalizePledge(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? uid()),
    ideaId: String(raw.ideaId ?? ""),
    bidderName: String(raw.bidderName ?? ""),
    bidderUsername: String(raw.bidderUsername ?? ""),
    status:
      (raw.status as "active" | "withdrawn" | "completed") || "active",
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    completedAt: (raw.completedAt as string | null) ?? null,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await readStore();
  const ideas = [...store.ideas].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const pledges = store.ideaPledges.map((p) =>
    normalizePledge(p as unknown as Record<string, unknown>),
  );

  return NextResponse.json({ ideas, pledges, me: session });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<Idea>;
  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const slackUsername = (body.slackUsername ?? "").trim();
  const category = body.category as IdeaCategory | undefined;
  const scope = body.scope as IdeaScope | undefined;
  const membersNeeded = Number(body.membersNeeded);

  if (!title || !description || !slackUsername) {
    return NextResponse.json(
      { error: "Title, description, and Slack username are required." },
      { status: 400 },
    );
  }
  if (!category || !categoryValues.has(category)) {
    return NextResponse.json({ error: "Pick a valid category." }, { status: 400 });
  }
  if (!scope || !scopeValues.has(scope)) {
    return NextResponse.json({ error: "Pick a valid scope." }, { status: 400 });
  }
  if (!Number.isFinite(membersNeeded) || membersNeeded < 1) {
    return NextResponse.json(
      { error: "Members needed must be at least 1." },
      { status: 400 },
    );
  }

  const idea: Idea = {
    id: uid(),
    title,
    category,
    scope,
    membersNeeded: Math.floor(membersNeeded),
    slackUsername,
    description,
    status: "open",
    createdBy: session.name,
    createdByUsername: session.username,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  await updateStore((store) => ({
    ...store,
    ideas: [idea, ...store.ideas],
  }));

  return NextResponse.json({ idea }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    status?: IdeaStatus;
  };

  if (!body.id || !body.status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }
  if (!["open", "completed", "archived"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  let updated: Idea | null = null;
  await updateStore((store) => {
    const ideas = store.ideas.map((idea) => {
      if (idea.id !== body.id) return idea;
      const next: Idea = {
        ...idea,
        status: body.status!,
        completedAt:
          body.status === "completed"
            ? new Date().toISOString()
            : body.status === "open"
              ? null
              : idea.completedAt,
      };
      updated = next;
      return next;
    });
    return { ...store, ideas };
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ idea: updated });
}
