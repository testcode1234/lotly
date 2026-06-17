import { auth } from "@clerk/nextjs/server";
import type { Role, SessionContext } from "@/types";

/**
 * Resolve the authenticated user's tenant context from the Clerk session.
 * Returns null when there is no signed-in user.
 *
 * NOTE: `communityId`/`role` come from the Clerk session token's
 * publicMetadata. The Clerk session token must be configured to expose
 * public_metadata for these to be present (see CLAUDE.md).
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const meta = sessionClaims?.publicMetadata;

  return {
    userId,
    role: (meta?.role as Role | undefined) ?? null,
    communityId: meta?.communityId ?? null,
  };
}

/**
 * Require a signed-in board member (board_admin OR board_member) with a
 * community. Throws on failure — call inside try/catch in route handlers.
 */
export async function requireBoardAccess(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.communityId) {
    throw new Error("Unauthorized");
  }
  if (ctx.role !== "board_admin" && ctx.role !== "board_member") {
    throw new Error("Forbidden");
  }
  return ctx;
}

/**
 * Require a signed-in board_admin with a community. Throws on failure.
 */
export async function requireAdminAccess(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.communityId) {
    throw new Error("Unauthorized");
  }
  if (ctx.role !== "board_admin") {
    throw new Error("Forbidden");
  }
  return ctx;
}

/**
 * Safely extract the community id that middleware injected into the request
 * headers. Every API route MUST call this as its first operation before any
 * DB access — community_id is NEVER read from the request body or query.
 */
export function getCommunityIdFromHeaders(req: Request): string {
  const communityId = req.headers.get("x-community-id");
  if (!communityId) throw new Error("Missing community context");
  return communityId;
}

/**
 * Extract the caller's role from middleware-injected headers. Defaults to the
 * least-privileged role when absent.
 */
export function getRoleFromHeaders(req: Request): Role {
  const role = req.headers.get("x-user-role");
  if (role === "board_admin" || role === "board_member" || role === "resident") {
    return role;
  }
  return "resident";
}
