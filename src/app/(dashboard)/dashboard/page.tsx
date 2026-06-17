import { Suspense } from "react";
import { DollarSign, TriangleAlert, Home, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionContext } from "@/lib/auth";
import { getCommunityStats } from "@/lib/db/communities";
import { formatCurrency } from "@/lib/utils";
import type { CommunityStats } from "@/types";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          An at-a-glance view of your community.
        </p>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>
    </div>
  );
}

async function StatsCards() {
  const ctx = await getSessionContext();
  if (!ctx?.communityId) return <StatsSkeleton />;

  let stats: CommunityStats | null = null;
  try {
    stats = await getCommunityStats(ctx.communityId);
  } catch (err) {
    console.error("Failed to load community stats:", err);
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Stats are unavailable right now. Once Supabase is configured and you
          add units and members, they will appear here.
        </CardContent>
      </Card>
    );
  }

  const hasData =
    stats.totalUnits > 0 ||
    stats.totalMembers > 0 ||
    stats.pendingDues > 0 ||
    stats.openViolations > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Units"
          value={String(stats.totalUnits)}
          icon={<Home className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Members"
          value={String(stats.totalMembers)}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(stats.pendingDues)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Open Violations"
          value={String(stats.openViolations)}
          icon={<TriangleAlert className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      {!hasData && (
        <p className="text-sm text-muted-foreground">
          Nothing here yet — add units and members to get started.
        </p>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
