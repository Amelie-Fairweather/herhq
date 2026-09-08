import { NextResponse } from "next/server";
import { getIngestSecret, getSession } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/db";
import type { Application } from "@/lib/types";
import { uid } from "@/lib/utils";

function normalizeBid(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? uid()),
    applicationId: String(raw.applicationId ?? ""),
    bidderName: String(raw.bidderName ?? ""),
    bidderUsername: String(raw.bidderUsername ?? ""),
    status: (raw.status as "active" | "withdrawn" | "completed" | "passed") || "active",
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
  const applications = [...store.applications].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );
  const bids = store.bids.map((b) => normalizeBid(b as unknown as Record<string, unknown>));
  return NextResponse.json({ applications, bids, me: session });
}

export async function POST(request: Request) {
  const session = await getSession();
  const secret =
    request.headers.get("x-ingest-secret") ||
    new URL(request.url).searchParams.get("secret");
  const allowSecret = secret === getIngestSecret();

  if (!session && !allowSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<Application> & {
    formNumber?: number;
  };
  if (!body.nameAndGrade?.trim() || !body.schoolTownState?.trim()) {
    return NextResponse.json(
      { error: "Name/grade and school are required." },
      { status: 400 },
    );
  }

  const application: Application = {
    id: uid(),
    formNumber: body.formNumber ?? null,
    nameAndGrade: body.nameAndGrade.trim(),
    schoolTownState: body.schoolTownState.trim(),
    coLeaders: (body.coLeaders ?? "").trim(),
    contact: (body.contact ?? "").trim(),
    heardAbout: (body.heardAbout ?? "").trim(),
    whyStart: (body.whyStart ?? "").trim(),
    status: "open",
    awardedTo: null,
    awardedAt: null,
    submittedAt: new Date().toISOString(),
    source: allowSecret && !session ? "google-form" : "manual",
  };

  await updateStore((store) => {
    // Avoid dupes for seeded form numbers
    if (application.formNumber != null) {
      const exists = store.applications.some(
        (a) => a.formNumber === application.formNumber,
      );
      if (exists) return store;
    }
    return {
      ...store,
      applications: [application, ...store.applications],
    };
  });

  return NextResponse.json({ application }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    status?: Application["status"];
    awardTo?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let updated: Application | null = null;

  await updateStore((store) => {
    const applications = store.applications.map((app) => {
      if (app.id !== body.id) return app;
      const next: Application = { ...app };
      if (body.status) next.status = body.status;
      if (body.awardTo) {
        next.status = "awarded";
        next.awardedTo = body.awardTo;
        next.awardedAt = new Date().toISOString();
      }
      if (body.status === "open") {
        next.awardedTo = null;
        next.awardedAt = null;
      }
      updated = next;
      return next;
    });
    return { ...store, applications };
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ application: updated });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const clearAll = searchParams.get("all") === "1";
  const secret =
    request.headers.get("x-ingest-secret") || searchParams.get("secret");

  const authed = Boolean(session) || secret === getIngestSecret();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (clearAll) {
    await updateStore((store) => ({
      ...store,
      applications: [],
      bids: [],
    }));
    return NextResponse.json({ ok: true, cleared: true });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await updateStore((store) => ({
    ...store,
    applications: store.applications.filter((a) => a.id !== id),
    bids: store.bids.filter((b) => b.applicationId !== id),
  }));

  return NextResponse.json({ ok: true });
}
