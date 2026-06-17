// =============================================================
// Typed schema for the Supabase Postgres database.
// Hand-derived from supabase/migrations/001_initial_schema.sql.
// Keep this in sync with the migration whenever the schema changes.
// =============================================================

// --- Shared enums (mirror the SQL CHECK constraints) ---
export type Role = "board_admin" | "board_member" | "resident";
export type MemberStatus = "invited" | "active" | "inactive";
export type DuesStatus = "pending" | "paid" | "late" | "waived" | "partial";
export type ViolationStatus =
  | "open"
  | "notified"
  | "remediation"
  | "resolved"
  | "closed";
export type DocumentCategory =
  | "governing"
  | "financial"
  | "meeting"
  | "insurance"
  | "other";
export type DocumentVisibility = "board" | "all";
export type MaintenancePriority = "low" | "normal" | "urgent";
export type MaintenanceStatus = "open" | "in_progress" | "completed" | "closed";

// Shape of a single entry in maintenance_requests.comments (JSONB).
export type MaintenanceComment = {
  author_member_id: string | null;
  body: string;
  created_at: string;
};

// --- Row types (the shape returned by SELECT) ---

export type User = {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Community = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  unit_count: number;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  dues_day_of_month: number;
  late_fee_amount: number;
  late_fee_grace_days: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Unit = {
  id: string;
  community_id: string;
  unit_number: string;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Member = {
  id: string;
  community_id: string;
  unit_id: string | null;
  user_id: string | null;
  clerk_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: Role;
  status: MemberStatus;
  stripe_customer_id: string | null;
  dues_amount: number | null;
  created_at: string;
  updated_at: string;
};

export type DuesLedger = {
  id: string;
  community_id: string;
  member_id: string;
  unit_id: string | null;
  period_year: number;
  period_month: number;
  amount: number;
  status: DuesStatus;
  due_date: string;
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
  late_fee_applied: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Violation = {
  id: string;
  community_id: string;
  unit_id: string | null;
  reported_by: string | null;
  type: string;
  description: string | null;
  status: ViolationStatus;
  photo_keys: string[];
  notice_pdf_key: string | null;
  notice_sent_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  community_id: string;
  uploaded_by: string | null;
  name: string;
  category: DocumentCategory;
  r2_key: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  visibility: DocumentVisibility;
  version: number;
  created_at: string;
  updated_at: string;
};

export type MaintenanceRequest = {
  id: string;
  community_id: string;
  submitted_by: string | null;
  unit_id: string | null;
  title: string;
  description: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  photo_keys: string[];
  assigned_vendor: string | null;
  comments: MaintenanceComment[];
  created_at: string;
  updated_at: string;
};

// --- Insert / Update helper types ---
// Insert: never set id/created_at/updated_at (DB generates them);
// columns with DB defaults are optional.

export type UserInsert = {
  clerk_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};

export type CommunityInsert = {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  unit_count?: number;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean;
  dues_day_of_month?: number;
  late_fee_amount?: number;
  late_fee_grace_days?: number;
  settings?: Record<string, unknown>;
};

export type UnitInsert = {
  community_id: string;
  unit_number: string;
  address?: string | null;
  notes?: string | null;
};

export type MemberInsert = {
  community_id: string;
  unit_id?: string | null;
  user_id?: string | null;
  clerk_id?: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role?: Role;
  status?: MemberStatus;
  stripe_customer_id?: string | null;
  dues_amount?: number | null;
};

export type DuesLedgerInsert = {
  community_id: string;
  member_id: string;
  unit_id?: string | null;
  period_year: number;
  period_month: number;
  amount: number;
  status?: DuesStatus;
  due_date: string;
  paid_at?: string | null;
  stripe_payment_intent_id?: string | null;
  late_fee_applied?: number;
  notes?: string | null;
};

export type ViolationInsert = {
  community_id: string;
  unit_id?: string | null;
  reported_by?: string | null;
  type: string;
  description?: string | null;
  status?: ViolationStatus;
  photo_keys?: string[];
  notice_pdf_key?: string | null;
  notice_sent_at?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
};

export type DocumentInsert = {
  community_id: string;
  uploaded_by?: string | null;
  name: string;
  category: DocumentCategory;
  r2_key: string;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  visibility?: DocumentVisibility;
  version?: number;
};

export type MaintenanceRequestInsert = {
  community_id: string;
  submitted_by?: string | null;
  unit_id?: string | null;
  title: string;
  description?: string | null;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  photo_keys?: string[];
  assigned_vendor?: string | null;
  comments?: MaintenanceComment[];
};

// Update: every column optional except the immutable id/created_at.
export type UserUpdate = Partial<Omit<User, "id" | "created_at">>;
export type CommunityUpdate = Partial<Omit<Community, "id" | "created_at">>;
export type UnitUpdate = Partial<Omit<Unit, "id" | "created_at">>;
export type MemberUpdate = Partial<Omit<Member, "id" | "created_at">>;
export type DuesLedgerUpdate = Partial<Omit<DuesLedger, "id" | "created_at">>;
export type ViolationUpdate = Partial<Omit<Violation, "id" | "created_at">>;
export type DocumentUpdate = Partial<Omit<Document, "id" | "created_at">>;
export type MaintenanceRequestUpdate = Partial<
  Omit<MaintenanceRequest, "id" | "created_at">
>;

// --- The Database type consumed by createClient<Database>() ---
// supabase-js requires each table to carry a `Relationships` array; without it
// the typed query methods fall back to `never`. We have no embedded-relation
// queries yet, so these are empty tuples.
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      communities: {
        Row: Community;
        Insert: CommunityInsert;
        Update: CommunityUpdate;
        Relationships: [];
      };
      units: {
        Row: Unit;
        Insert: UnitInsert;
        Update: UnitUpdate;
        Relationships: [];
      };
      members: {
        Row: Member;
        Insert: MemberInsert;
        Update: MemberUpdate;
        Relationships: [];
      };
      dues_ledger: {
        Row: DuesLedger;
        Insert: DuesLedgerInsert;
        Update: DuesLedgerUpdate;
        Relationships: [];
      };
      violations: {
        Row: Violation;
        Insert: ViolationInsert;
        Update: ViolationUpdate;
        Relationships: [];
      };
      documents: {
        Row: Document;
        Insert: DocumentInsert;
        Update: DocumentUpdate;
        Relationships: [];
      };
      maintenance_requests: {
        Row: MaintenanceRequest;
        Insert: MaintenanceRequestInsert;
        Update: MaintenanceRequestUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
