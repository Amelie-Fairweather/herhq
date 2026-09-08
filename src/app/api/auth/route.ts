import { NextResponse } from "next/server";
import {
  authenticateUser,
  NAME_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  const { user, reason } = await authenticateUser(username, password);
  if (!user) {
    const error =
      reason === "missing"
        ? "No account found for that username. Use Create account — Railway redeploys clear logins until a volume is attached."
        : "Invalid username or password.";
    return NextResponse.json({ error }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    username: user.username,
    name: user.displayName,
  });
  response.cookies.set(SESSION_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  response.cookies.set(USER_COOKIE, user.username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  response.cookies.set(NAME_COOKIE, encodeURIComponent(user.displayName), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(USER_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(NAME_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
