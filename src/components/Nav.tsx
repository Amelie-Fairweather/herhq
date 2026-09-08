"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/calendar", label: "Calendar", short: "Calendar" },
  { href: "/bidding", label: "Onboarding bids", short: "Bids" },
  { href: "/my-bids", label: "My bids", short: "My bids" },
  { href: "/reports", label: "Weekly reports", short: "Reports" },
];

export function Nav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function signOut() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="shell sticky top-0 z-40 border-b border-[var(--line)] bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Image
            src="/logo.jpeg"
            alt="H.E.R. logo"
            width={44}
            height={44}
            className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-[var(--line)] sm:h-12 sm:w-12"
            priority
          />
          <span className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--rose)] sm:text-xs sm:tracking-[0.22em]">
              hereducation.org
            </p>
            <h1 className="display truncate text-lg text-[var(--ink)] transition-colors group-hover:text-[var(--rose)] sm:text-2xl md:text-[1.7rem]">
              HER Leadership HQ
            </h1>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink-soft)] hover:bg-[var(--mist)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 text-sm lg:flex">
          <span className="max-w-[10rem] truncate text-[var(--ink-soft)]">
            <strong className="text-[var(--ink)]">{name}</strong>
          </span>
          <button
            type="button"
            onClick={signOut}
            className="btn btn-ghost !px-3 !py-2 text-sm"
          >
            Sign out
          </button>
        </div>

        <button
          type="button"
          className="btn btn-ghost !min-h-11 !min-w-11 !px-3 !py-2 lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--line)] bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-4 py-3 text-base font-semibold ${
                    active
                      ? "bg-[var(--ink)] text-white"
                      : "bg-[var(--mist)] text-[var(--ink)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
            <p className="truncate text-sm text-[var(--ink-soft)]">
              Signed in as <strong className="text-[var(--ink)]">{name}</strong>
            </p>
            <button
              type="button"
              onClick={signOut}
              className="btn btn-ghost !py-2 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
