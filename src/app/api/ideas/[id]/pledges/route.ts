import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateStore } from "@/lib/db";
import type { IdeaPledge } from "@/lib/types";
import { uid } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: ideaId } = await context.params;
  let pledge: IdeaPledge | null = null;
  let error: string | null = null;

  await updateStore((store) => {
    const idea = store.ideas.find((i) => i.id === ideaId);
    if (!idea) {
      error = "Idea not found";
      return store;
    }
    if (idea.status !== "open") {
      error = "This idea is no longer open for pledges.";
      return store;
    }

    const existing = store.ideaPledges.find(
      (p) =>
        p.ideaId === ideaId &&
        (p.bidderUsername === session.username ||
          p.bidderName === session.name) &&
        p.status !== "withdrawn",
    );
    if (existing) {
      error =
        existing.status === "completed"
          ? "You already completed a pledge on this idea."
          : "You already pledged to help on this idea.";
      return store;
    }

    pledge = {
      id: uid(),
      ideaId,
      bidderName: session.name,
      bidderUsername: session.username,
      status: "active",
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    return { ...store, ideaPledges: [...store.ideaPledges, pledge] };
  });

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ pledge }, { status: 201 });
}

export async function PATCH(request: Request, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: ideaId } = await context.params;
  const body = (await request.json()) as {
    action?: "withdraw" | "complete";
    pledgeId?: string;
  };

  if (body.action !== "withdraw" && body.action !== "complete") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  let updated: IdeaPledge | null = null;
  let error: string | null = null;

  await updateStore((store) => {
    const pledge = store.ideaPledges.find((p) => {
      if (body.pledgeId && p.id !== body.pledgeId) return false;
      if (p.ideaId !== ideaId) return false;
      return (
        p.bidderUsername === session.username || p.bidderName === session.name
      );
    });

    if (!pledge) {
      error = "Pledge not found";
      return store;
    }

    if (body.action === "withdraw") {
      if (pledge.status !== "active") {
        error = "Only active pledges can be withdrawn.";
        return store;
      }
      updated = { ...pledge, status: "withdrawn" };
    } else {
      if (pledge.status !== "active") {
        error = "Only active pledges can be completed.";
        return store;
      }
      updated = {
        ...pledge,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
    }

    const ideaPledges = store.ideaPledges.map((p) =>
      p.id === pledge.id ? updated! : p,
    );

    return { ...store, ideaPledges };
  });

  if (error || !updated) {
    return NextResponse.json({ error: error || "Failed" }, { status: 400 });
  }

  return NextResponse.json({ pledge: updated });
}
