import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="shell min-h-screen">
      <Nav name={session.name} />
      <main className="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">{children}</main>
    </div>
  );
}
