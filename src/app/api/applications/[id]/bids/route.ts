import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateStore } from "@/lib/db";
import type { Bid } from "@/lib/types";
import { uid } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { note?: string };

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
      (b) => b.applicationId === id && b.bidderName === session.name,
    );
    if (existing) {
      error = "You already placed a bid on this application.";
      return store;
    }

    bid = {
      id: uid(),
      applicationId: id,
      bidderName: session.name,
      note: (body.note ?? "").trim(),
      createdAt: new Date().toISOString(),
    };

    return { ...store, bids: [...store.bids, bid] };
  });

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ bid }, { status: 201 });
}
