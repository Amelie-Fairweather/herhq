import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { masterEventId } from "@/lib/calendar";
import { readStore, updateStore } from "@/lib/db";
import type { CalendarEvent } from "@/lib/types";
import { uid } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const store = await readStore();
  const events = [...store.events].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<CalendarEvent> & {
    recurrence?: "none" | "weekly";
  };
  if (!body.title?.trim() || !body.start || !body.end) {
    return NextResponse.json(
      { error: "Title, start, and end are required." },
      { status: 400 },
    );
  }

  const event: CalendarEvent = {
    id: uid(),
    title: body.title.trim(),
    description: (body.description ?? "").trim(),
    start: body.start,
    end: body.end,
    location: (body.location ?? "").trim(),
    createdBy: session.name,
    createdAt: new Date().toISOString(),
    recurrence: body.recurrence === "weekly" ? "weekly" : "none",
  };

  await updateStore((store) => ({
    ...store,
    events: [...store.events, event],
  }));

  return NextResponse.json({ event }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const masterId = masterEventId(id);

  await updateStore((store) => ({
    ...store,
    events: store.events.filter((e) => e.id !== masterId),
  }));

  return NextResponse.json({ ok: true });
}
