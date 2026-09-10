"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = mode === "create" ? "/api/auth/register" : "/api/auth";
    const body =
      mode === "create"
        ? { username, displayName, password }
        : { username, password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Could not continue.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="shell relative flex min-h-screen items-center justify-center bg-[#fff5fb] px-4 py-8 sm:px-5 sm:py-12">
      <div className="relative z-10 grid w-full max-w-5xl gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-10">
        <div className="fade-up order-1 text-center md:order-none md:text-left">
          <p className="display mx-auto mb-4 max-w-md text-lg leading-snug text-[#9b1468] sm:mb-5 sm:text-xl md:mx-0 md:text-2xl">
            Empowering the Next Generation Through Complete History
          </p>
          <Image
            src="/logo.jpeg"
            alt="H.E.R. Education Required logo"
            width={160}
            height={160}
            priority
            className="mx-auto mb-4 h-24 w-24 rounded-2xl object-cover shadow-md ring-2 ring-[#fe4cba]/40 sm:mb-5 sm:h-28 sm:w-28 md:mx-0 md:h-36 md:w-36"
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#fe4cba] sm:text-xs sm:tracking-[0.28em]">
            hereducation.org
          </p>
          <h1 className="display mt-2 text-4xl leading-[1.08] text-[#9b1468] sm:mt-3 sm:text-5xl md:text-6xl">
            Her Education Required
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-[#9b1468]/90 sm:mt-5 sm:text-lg md:mx-0">
            Leadership HQ — each person gets their own account. No external
            login services, just local usernames for the team.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="panel fade-up order-2 rounded-3xl p-5 sm:p-7 md:order-none md:p-8"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex gap-1 rounded-full bg-[var(--mist)] p-1 sm:gap-2">
            <button
              type="button"
              className={`min-h-11 flex-1 rounded-full px-2 py-2 text-sm font-semibold transition-colors sm:px-3 ${
                mode === "signin"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink-soft)]"
              }`}
              onClick={() => {
                setMode("signin");
                setError("");
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`min-h-11 flex-1 rounded-full px-2 py-2 text-sm font-semibold transition-colors sm:px-3 ${
                mode === "create"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink-soft)]"
              }`}
              onClick={() => {
                setMode("create");
                setError("");
              }}
            >
              Create account
            </button>
          </div>

          <h2 className="display mt-5 text-2xl text-[var(--ink)] sm:text-3xl">
            {mode === "create" ? "Join HQ" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {mode === "create"
              ? "Pick a username and password. Accounts are stored on this server only."
              : "Sign in with your own username and password."}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="amelie"
                autoComplete="username"
                required
              />
            </div>
            {mode === "create" ? (
              <div>
                <label className="label" htmlFor="displayName">
                  Display name
                </label>
                <input
                  id="displayName"
                  className="field"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Amelie"
                  autoComplete="name"
                  required
                />
              </div>
            ) : null}
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "create" ? "new-password" : "current-password"
                }
                required
                minLength={6}
              />
            </div>
          </div>

          {error ? (
            <p className="mt-4 text-sm font-medium text-[var(--rose-deep)]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary mt-6 w-full !min-h-12"
            disabled={loading}
          >
            {loading
              ? "Working…"
              : mode === "create"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
