import { NextResponse } from "next/server";
import {
  createUser,
  NAME_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    displayName?: string;
    password?: string;
  };

  const result = await createUser({
    username: body.username ?? "",
    displayName: body.displayName ?? "",
    password: body.password ?? "",
  });

  if (result.error || !result.user) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const user = result.user;
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
