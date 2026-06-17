@AGENTS.md

# Lotly — HOA Management SaaS

## What this is
SaaS for self-managed HOAs. Volunteer boards use it to collect
dues, track violations, store documents, and manage residents.
Target: communities under 200 units, self-managed without a
property management company.

## Core pain we solve
- Bank sync that works (Stripe Financial Connections, NOT Plaid)
- Mobile-first UI (no competitor has a good mobile experience)
- Dead-simple onboarding (import CSV, wipe and restart)
- Treasurer handoff (boards rotate annually — own the transition)

## Stack
- Next.js 16 (App Router, TypeScript strict). The product brief
  specified "Next 14", but the scaffold used create-next-app@latest
  which installed Next 16 — chosen deliberately. Consequence:
  cookies()/headers()/params/searchParams are async (see AGENTS.md
  + node_modules/next/dist/docs before writing Next-specific code).
- React 19.2
- Tailwind CSS v4 + shadcn/ui (slate base color, CSS-variable theming;
  no tailwind.config.ts — theme lives in src/app/globals.css)
- Clerk (auth — roles: board_admin | board_member | resident)
- Supabase (Postgres + RLS)
- Stripe Connect (ACH via Financial Connections — NOT Plaid)
- Cloudflare R2 (documents + violation photos)
- Resend (transactional email)
- Twilio (SMS reminders)
- Inngest (background jobs — late fees, reminder triggers)
- Vercel (hosting)

## Multi-tenancy rule — NEVER BREAK THIS
Every DB table has community_id. Never trust community_id from
the client — always derive from the authenticated session.
All service functions take communityId as their first argument.
Every API route validates communityId from session before any DB
operation. Violation of this rule = security bug.

How it works in practice:
- `src/middleware.ts` (Clerk `clerkMiddleware`) reads the user's
  Clerk publicMetadata and injects `x-community-id` + `x-user-role`
  request headers on every protected route.
- API routes call `getCommunityIdFromHeaders(req)` from
  `src/lib/auth.ts` as their FIRST operation, before any DB call.
- Server components/pages call `getSessionContext()` /
  `requireBoardAccess()` / `requireAdminAccess()` from
  `src/lib/auth.ts`.

> Note: Next 16 deprecated `middleware.ts` in favor of `proxy.ts`
> (node-only runtime). Clerk still targets `middleware.ts`, so we
> keep it. Revisit when Clerk ships `proxy` support.

> Note: For `sessionClaims.publicMetadata` to be populated, the
> Clerk session token must expose it. In the Clerk Dashboard →
> Sessions → Customize session token, add:
> { "publicMetadata": "{{user.public_metadata}}" }

## Roles
- board_admin: full access, manage members, configure billing
- board_member: read/write violations, documents, announcements
- resident: pay dues, view own ledger, submit maintenance requests

## Key domain concepts
- Community: the HOA itself (has a Stripe Connect account)
- Unit: a physical property (house/condo number), belongs to Community
- Member: a homeowner linked to a Unit, has a role
- DuesLedger: monthly charge records per Unit
- Violation: infraction against a Unit with photo evidence + status
- Document: file in R2, scoped to Community, has visibility level

## Folder conventions
- All DB queries: src/lib/db/ — never raw Supabase in components
- Stripe logic: src/lib/stripe/
- Email templates: src/lib/email/templates/
- PDF generators: src/lib/pdf/
- Background jobs: src/inngest/
- API routes: src/app/api/
- Webhooks: src/app/api/webhooks/

## Coding conventions
- TypeScript strict mode always on
- All service functions accept communityId as first param
- No inline SQL — use typed query functions from src/lib/db/
- Stripe webhooks verified with stripe.webhooks.constructEvent()
- Clerk webhooks verified with svix
- Never hardcode secrets — always process.env.*
