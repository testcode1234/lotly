// Central barrel for app-wide types. Import domain row/insert/update
// types from "@/types" rather than reaching into "@/types/database".
export * from "./database";

import type { Role } from "./database";

// Shape of the role/tenant metadata we store on the Clerk user's
// publicMetadata and expect to find on the session claims.
export type SessionPublicMetadata = {
  role?: Role;
  communityId?: string;
};

// The session context derived from Clerk on the server.
export type SessionContext = {
  userId: string;
  role: Role | null;
  communityId: string | null;
};

// Aggregate numbers shown on the dashboard.
export type CommunityStats = {
  totalUnits: number;
  totalMembers: number;
  pendingDues: number; // dollar amount still owed (pending + late + partial)
  openViolations: number;
};

// Augment Clerk's session claim typing so sessionClaims.publicMetadata
// is strongly typed wherever we call auth(). For this to be populated at
// runtime, the Clerk session token must expose public_metadata (see CLAUDE.md).
declare global {
  interface CustomJwtSessionClaims {
    publicMetadata?: SessionPublicMetadata;
  }
}
