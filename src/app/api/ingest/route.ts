import { NextResponse } from "next/server";
import { getIngestSecret } from "@/lib/auth";
import { updateStore } from "@/lib/db";
import type { Application } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * Google Forms → Apps Script webhook endpoint.
 * Accepts either our field names or the Google Form question labels.
 */
export async function POST(request: Request) {
  const secret =
    request.headers.get("x-ingest-secret") ||
    new URL(request.url).searchParams.get("secret");

  if (secret !== getIngestSecret()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const asString = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(String).join(", ");
    if (value == null) return "";
    return String(value);
  };

  const pick = (...keys: string[]): string => {
    for (const key of keys) {
      if (key in body && asString(body[key]).trim()) {
        return asString(body[key]).trim();
      }
    }
    const entries = Object.entries(body);
    for (const fragment of keys) {
      const found = entries.find(([k, v]) => {
        return (
          k.toLowerCase().includes(fragment.toLowerCase()) &&
          asString(v).trim().length > 0
        );
      });
      if (found) return asString(found[1]).trim();
    }
    return "";
  };

  const nameAndGrade = pick(
    "nameAndGrade",
    "Your name and grade level (freshman, sophomore, etc)",
    "name and grade",
    "name",
  );
  const schoolTownState = pick(
    "schoolTownState",
    "High school, town, and state (ex. Solon High School, Solon, Ohio)",
    "high school",
    "school",
  );
  const coLeaders = pick(
    "coLeaders",
    "Do you have co leaders? If yes, their names?",
    "co leaders",
  );
  const contact = pick(
    "contact",
    "Best contact (phone number or email) THIS IS NOT PUBLIC.",
    "best contact",
    "email",
    "phone",
  );
  const heardAbout = pick(
    "heardAbout",
    "How did you hear about us?",
    "hear about",
  );
  const whyStart = pick(
    "whyStart",
    "Why do you want to start a HER?",
    "why do you want",
    "why start",
  );

  if (!nameAndGrade.trim() || !schoolTownState.trim()) {
    return NextResponse.json(
      { error: "Missing required application fields." },
      { status: 400 },
    );
  }

  const application: Application = {
    id: uid(),
    nameAndGrade: nameAndGrade.trim(),
    schoolTownState: schoolTownState.trim(),
    coLeaders: coLeaders.trim(),
    contact: contact.trim(),
    heardAbout: heardAbout.trim(),
    whyStart: whyStart.trim(),
    status: "open",
    awardedTo: null,
    awardedAt: null,
    submittedAt: new Date().toISOString(),
    source: "google-form",
  };

  await updateStore((store) => ({
    ...store,
    applications: [application, ...store.applications],
  }));

  return NextResponse.json({ ok: true, application }, { status: 201 });
}
