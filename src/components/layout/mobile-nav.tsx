"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import type { Role } from "@/types";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile bottom tab bar (max 5 items). Hidden on desktop (see Sidebar). */
export function MobileNav({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const items = MOBILE_NAV_ITEMS.filter((item) =>
    role ? item.roles.includes(role) : false,
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-background md:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
