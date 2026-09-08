import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/db";
import type { Application } from "@/lib/types";
import { uid } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const store = await readStore();
  const applications = [...store.applications].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );
  const bids = store.bids;
  return NextResponse.json({ applications, bids });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<Application>;
  if (!body.nameAndGrade?.trim() || !body.schoolTownState?.trim()) {
    return NextResponse.json(
      { error: "Name/grade and school are required." },
      { status: 400 },
    );
  }

  const application: Application = {
    id: uid(),
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
    source: "manual",
  };

  await updateStore((store) => ({
    ...store,
    applications: [application, ...store.applications],
  }));

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
