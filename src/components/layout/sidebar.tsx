"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItemsForRole, APP_NAME } from "@/lib/constants";
import type { Role } from "@/types";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop sidebar navigation. Hidden on mobile (see MobileNav). */
export function Sidebar({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-sidebar">
      <div className="flex h-16 items-center px-6 text-lg font-semibold">
        {APP_NAME}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
