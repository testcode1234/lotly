import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between px-4 md:px-6">
        <span className="text-lg font-semibold">Lotly</span>
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <Button size="sm" render={<Link href="/dashboard" />}>
              Open dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/sign-in" />}
              >
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/sign-up" />}>
                Get started
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            HOA management for self-managed communities
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Collect dues, track violations, store documents, and manage
            residents — without a property management company.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {signedIn ? (
              <Button size="lg" render={<Link href="/dashboard" />}>
                Open dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" render={<Link href="/sign-up" />}>
                  Get started
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  render={<Link href="/sign-in" />}
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
