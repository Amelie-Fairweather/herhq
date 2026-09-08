import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateStore } from "@/lib/db";
import type { Bid, BidStatus } from "@/lib/types";
import { uid } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: "bid" | "pass";
  };
  const action = body.action === "pass" ? "pass" : "bid";

  let bid: Bid | null = null;
  let error: string | null = null;

  await updateStore((store) => {
    const app = store.applications.find((a) => a.id === id);
    if (!app) {
      error = "Application not found";
      return store;
    }
    if (app.status !== "open") {
      error = "This application is no longer open for bids.";
      return store;
    }

    const existing = store.bids.find(
      (b) =>
        b.applicationId === id &&
        (b.bidderUsername === session.username ||
          b.bidderName === session.name) &&
        b.status !== "withdrawn",
    );
    if (existing) {
      error =
        existing.status === "passed"
          ? "You already passed on this application."
          : "You already responded to this application.";
      return store;
    }

    const status: BidStatus = action === "pass" ? "passed" : "active";
    bid = {
      id: uid(),
      applicationId: id,
      bidderName: session.name,
      bidderUsername: session.username,
      status,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    return { ...store, bids: [...store.bids, bid] };
  });

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ bid }, { status: 201 });
}

export async function PATCH(request: Request, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: applicationId } = await context.params;
  const body = (await request.json()) as {
    action?: "withdraw" | "complete";
    bidId?: string;
  };

  if (body.action !== "withdraw" && body.action !== "complete") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  let updated: Bid | null = null;
  let error: string | null = null;

  await updateStore((store) => {
    const bid = store.bids.find((b) => {
      if (body.bidId && b.id !== body.bidId) return false;
      if (b.applicationId !== applicationId) return false;
      return (
        b.bidderUsername === session.username || b.bidderName === session.name
      );
    });

    if (!bid) {
      error = "Bid not found";
      return store;
    }

    if (body.action === "withdraw") {
      if (bid.status !== "active") {
        error = "Only active bids can be withdrawn.";
        return store;
      }
      updated = { ...bid, status: "withdrawn" };
    } else {
      if (bid.status !== "active") {
        error = "Only active bids can be completed.";
        return store;
      }
      updated = {
        ...bid,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
    }

    const bids = store.bids.map((b) => (b.id === bid.id ? updated! : b));
    let applications = store.applications;

    if (body.action === "complete") {
      applications = store.applications.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: "completed" as const,
              awardedTo: session.name,
              awardedAt: new Date().toISOString(),
            }
          : app,
      );
    }

    return { ...store, bids, applications };
  });

  if (error || !updated) {
    return NextResponse.json({ error: error || "Failed" }, { status: 400 });
  }

  return NextResponse.json({ bid: updated });
}
