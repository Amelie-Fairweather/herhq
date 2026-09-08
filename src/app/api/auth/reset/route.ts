import { NextResponse } from "next/server";
import { getIngestSecret, setUserPassword } from "@/lib/auth";

/** Recover / recreate a user after a redeploy wipe. */
export async function POST(request: Request) {
  const secret =
    request.headers.get("x-ingest-secret") ||
    new URL(request.url).searchParams.get("secret");
  if (secret !== getIngestSecret()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    username?: string;
    password?: string;
    displayName?: string;
  };

  const result = await setUserPassword(
    body.username ?? "",
    body.password ?? "",
    body.displayName,
  );

  if (result.error || !result.user) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    username: result.user.username,
    name: result.user.displayName,
  });
}
