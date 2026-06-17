import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { getCommunityById } from "@/lib/db/communities";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/sign-in");
  if (!ctx.communityId) redirect("/onboarding");

  // Resolve the community name for the header. Stay resilient if the DB is not
  // yet configured (placeholder Supabase keys) so the shell still renders.
  let communityName = "Your community";
  try {
    const community = await getCommunityById(ctx.communityId);
    if (community) communityName = community.name;
  } catch (err) {
    console.error("Failed to load community for layout:", err);
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar role={ctx.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header communityName={communityName} />
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
        <MobileNav role={ctx.role} />
      </div>
    </div>
  );
}
