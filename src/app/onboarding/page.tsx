import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getSessionContext } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OnboardingPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/sign-in");
  // Already onboarded → straight to the dashboard.
  if (ctx.communityId) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
        <span className="font-semibold">Lotly</span>
        <UserButton />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set up your community</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              You&apos;re signed in but not yet attached to a community. Community
              creation and CSV import land in a later session.
            </p>
            <p>
              For now, an admin needs to set your Clerk{" "}
              <code className="rounded bg-muted px-1 py-0.5">publicMetadata</code>{" "}
              to include a <code className="rounded bg-muted px-1 py-0.5">role</code>{" "}
              and <code className="rounded bg-muted px-1 py-0.5">communityId</code>.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
