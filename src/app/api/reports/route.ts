import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listArchiveReports,
  listArchiveWeeks,
  listCurrentReports,
  saveReport,
} from "@/lib/reports";
import { mondayOf } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "current";
  const weekOf = searchParams.get("week");

  if (view === "archive-weeks") {
    const weeks = await listArchiveWeeks();
    return NextResponse.json({ weeks });
  }

  if (view === "archive") {
    if (!weekOf) {
      return NextResponse.json(
        { error: "Pick a week to open from the archive." },
        { status: 400 },
      );
    }
    const reports = await listArchiveReports(weekOf);
    return NextResponse.json({ reports, weekOf, bucket: "archive" });
  }

  const reports = await listCurrentReports();
  const archiveWeeks = await listArchiveWeeks();
  return NextResponse.json({
    reports,
    archiveWeeks,
    currentWeek: mondayOf(),
    bucket: "current",
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    weekOf?: string;
    wins?: string;
    blockers?: string;
    nextWeek?: string;
    hoursSpent?: number;
  };

  if (!body.wins?.trim()) {
    return NextResponse.json(
      { error: "Wins / progress is required." },
      { status: 400 },
    );
  }

  const report = await saveReport({
    username: session.username,
    authorName: session.name,
    weekOf: body.weekOf ? mondayOf(body.weekOf) : mondayOf(),
    wins: body.wins.trim(),
    blockers: (body.blockers ?? "").trim(),
    nextWeek: (body.nextWeek ?? "").trim(),
    hoursSpent: Number.isFinite(Number(body.hoursSpent))
      ? Number(body.hoursSpent)
      : 0,
  });

  return NextResponse.json({ report }, { status: 201 });
}
