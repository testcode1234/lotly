import { UserButton } from "@clerk/nextjs";
import { APP_NAME } from "@/lib/constants";

/** Top bar: app name on mobile + current community, and the Clerk account menu. */
export function Header({ communityName }: { communityName: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="font-semibold md:hidden">{APP_NAME}</span>
        <span className="truncate text-sm text-muted-foreground">
          {communityName}
        </span>
      </div>
      <UserButton />
    </header>
  );
}
