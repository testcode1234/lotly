import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getSessionContext } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage({
  searchParams,
}: {
  // Next 16: searchParams is async.
  searchParams: Promise<{ incomplete?: string; error?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/sign-in");
  // Already onboarded → straight to the dashboard.
  if (ctx.communityId) redirect("/dashboard");

  const { incomplete, error } = await searchParams;

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
          <CardContent className="space-y-4">
            {incomplete ? (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Payment setup wasn&apos;t finished. Create your community again
                or resume Stripe onboarding to start collecting dues.
              </p>
            ) : null}
            {error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Something went wrong setting up payments. Please try again.
              </p>
            ) : null}
            <OnboardingForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
