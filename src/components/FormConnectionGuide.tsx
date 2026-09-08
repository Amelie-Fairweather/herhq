"use client";

import { useState } from "react";

const FORM_URL =
  "https://docs.google.com/forms/d/1uCjsP-O7k6S3d_As3J2pampyR4RJQ0K7z5-txtg6EfA/edit";

export function FormConnectionGuide() {
  const [open, setOpen] = useState(true);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const ingestUrl = `${origin}/api/ingest`;
  const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1");

  return (
    <div className="panel rounded-3xl border border-[rgba(196,69,105,0.25)] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--rose)]">
            Google Form connection
          </p>
          <h3 className="display mt-1 text-2xl text-[var(--ink)]">
            Not auto-linked yet — one-time setup required
          </h3>
          <p className="mt-2 max-w-3xl text-sm text-[var(--ink-soft)]">
            Google Forms do not push into this site by themselves. The cards you
            see tagged “Google Form” that say things like “Testing ingest” were
            API tests, not live form traffic. Wire the form with Apps Script
            (script is in the repo) so new submissions land on this board.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost !py-2 text-sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide steps" : "Show steps"}
        </button>
      </div>

      {open ? (
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-[var(--ink)]">
          <li>
            Open the{" "}
            <a
              className="font-semibold text-[var(--rose)] underline"
              href={FORM_URL}
              target="_blank"
              rel="noreferrer"
            >
              HER registration form
            </a>
            , go to <strong>Responses</strong>, and link a Sheets spreadsheet if
            needed.
          </li>
          <li>
            In that sheet: <strong>Extensions → Apps Script</strong>. Paste{" "}
            <code className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-xs">
              scripts/google-form-apps-script.js
            </code>
            .
          </li>
          <li>
            Set <code className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-xs">INGEST_URL</code>{" "}
            to a <strong>public</strong> URL ending in{" "}
            <code className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-xs">
              /api/ingest
            </code>
            .
            {isLocal ? (
              <span className="mt-2 block rounded-2xl bg-[rgba(184,146,58,0.15)] px-3 py-2 text-[var(--ink)]">
                You are on <strong>localhost</strong>. Google cannot reach{" "}
                <code className="text-xs">{ingestUrl}</code>. Use a tunnel
                (ngrok / Cloudflare Tunnel) pointed at port 3000, then put that
                https URL in the script.
              </span>
            ) : (
              <span className="mt-2 block rounded-2xl bg-[var(--mist)] px-3 py-2">
                Suggested ingest URL for this host:{" "}
                <code className="text-xs">{ingestUrl}</code>
              </span>
            )}
          </li>
          <li>
            Set <code className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-xs">INGEST_SECRET</code>{" "}
            to match <code className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-xs">.env.local</code>{" "}
            (default <code className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-xs">her-form-secret</code>).
          </li>
          <li>
            Add a trigger: function <strong>onFormSubmit</strong>, event{" "}
            <strong>On form submit</strong>. Authorize when asked.
          </li>
          <li>
            Optional: run <strong>testIngestConnection</strong> in the Apps Script
            editor — a “Apps Script Test” card should appear here. Then submit a
            real form response to confirm end-to-end.
          </li>
        </ol>
      ) : null}
    </div>
  );
}
