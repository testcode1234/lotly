import {
  LayoutDashboard,
  DollarSign,
  TriangleAlert,
  FileText,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { DuesStatus, Role } from "@/types";

export const APP_NAME = "Lotly";

/** Format a dollar amount (number) as USD currency. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Human label for a dues billing period, e.g. "March 2026". */
export function periodLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? "?"} ${year}`;
}

export const DUES_STATUS_LABELS: Record<DuesStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  late: "Late",
  waived: "Waived",
  partial: "Partial",
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this nav item. */
  roles: Role[];
};

const ALL_ROLES: Role[] = ["board_admin", "board_member", "resident"];
const BOARD_ROLES: Role[] = ["board_admin", "board_member"];

/**
 * Primary navigation. The first 5 entries form the mobile bottom tab bar
 * (mobile shows max 5). Settings is desktop-sidebar / overflow only.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
  { label: "Dues", href: "/dues", icon: DollarSign, roles: ALL_ROLES },
  { label: "Violations", href: "/violations", icon: TriangleAlert, roles: BOARD_ROLES },
  { label: "Documents", href: "/documents", icon: FileText, roles: ALL_ROLES },
  { label: "Members", href: "/members", icon: Users, roles: BOARD_ROLES },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["board_admin"] },
];

/** The five items shown in the mobile bottom tab bar. */
export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.slice(0, 5);

export const ROLE_LABELS: Record<Role, string> = {
  board_admin: "Board Admin",
  board_member: "Board Member",
  resident: "Resident",
};

export function navItemsForRole(role: Role | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
