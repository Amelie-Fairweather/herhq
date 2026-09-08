"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/calendar", label: "Calendar" },
  { href: "/bidding", label: "Onboarding bids" },
  { href: "/my-bids", label: "My bids" },
  { href: "/reports", label: "Weekly reports" },
];

export function Nav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="shell border-b border-[var(--line)] bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/logo.jpeg"
              alt="H.E.R. logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-cover ring-1 ring-[var(--line)]"
              priority
            />
            <span>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rose)]">
                hereducation.org
              </p>
              <h1 className="display text-2xl text-[var(--ink)] transition-colors group-hover:text-[var(--rose)] md:text-[1.7rem]">
                HER Leadership HQ
              </h1>
            </span>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
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

        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--ink-soft)]">
            Signed in as <strong className="text-[var(--ink)]">{name}</strong>
          </span>
          <button type="button" onClick={signOut} className="btn btn-ghost !py-2 !px-3 text-sm">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
