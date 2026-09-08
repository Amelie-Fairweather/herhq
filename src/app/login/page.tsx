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
    <div className="shell relative flex min-h-screen items-center justify-center px-5 py-12">
      <div className="absolute inset-x-0 top-0 h-48 bg-[var(--mist)]" />

      <div className="relative z-10 grid w-full max-w-5xl gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className="fade-up text-[var(--ink)]">
          <Image
            src="/logo.jpeg"
            alt="H.E.R. Education Required logo"
            width={160}
            height={160}
            priority
            className="mb-5 h-28 w-28 rounded-2xl object-cover shadow-md ring-1 ring-[var(--line)] md:h-36 md:w-36"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--rose-deep)]">
            hereducation.org
          </p>
          <h1 className="display mt-3 max-w-xl text-5xl leading-[1.05] text-[var(--ink)] md:text-6xl">
            Her Education Required
          </h1>
          <p className="mt-5 max-w-md text-lg text-[var(--ink-soft)]">
            Leadership HQ — each person gets their own account. No external
            login services, just local usernames for the team.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="panel fade-up rounded-3xl p-7 md:p-8"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex gap-2 rounded-full bg-[var(--mist)] p-1">
            <button
              type="button"
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
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
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
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

          <h2 className="display mt-5 text-3xl text-[var(--ink)]">
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
            className="btn btn-primary mt-6 w-full"
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
