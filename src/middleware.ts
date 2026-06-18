import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// NOTE (Next 16): the `middleware.ts` convention is deprecated in favor of
// `proxy.ts`, but Clerk's clerkMiddleware still targets middleware.ts, so we
// keep it here. Revisit when Clerk ships proxy support. See CLAUDE.md.

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/dues(.*)",
  "/violations(.*)",
  "/documents(.*)",
  "/members(.*)",
  "/units(.*)",
  "/settings(.*)",
  "/onboarding(.*)",
  "/api/communities(.*)",
  "/api/members(.*)",
  "/api/units(.*)",
  "/api/dues(.*)",
  "/api/violations(.*)",
  "/api/documents(.*)",
  "/api/onboarding(.*)",
  "/api/import(.*)",
]);

// Routes a signed-in user may reach BEFORE they belong to a community. The
// no-community redirect (rule 2) must not bounce these, or onboarding loops.
const isOnboardingRoute = createRouteMatcher([
  "/onboarding(.*)",
  "/api/onboarding(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/inngest(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = await auth();

    // 1. Unauthenticated → sign in (preserve where they were going).
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    const meta = sessionClaims?.publicMetadata;

    // 2. Authenticated but no community yet → onboarding (except the
    //    onboarding routes themselves, which is where they bind a community).
    if (!meta?.communityId && !isOnboardingRoute(req)) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // 3. Inject the trusted tenant context into request headers so server
    //    components and API routes never have to trust client-supplied values.
    const requestHeaders = new Headers(req.headers);
    if (meta?.communityId) {
      requestHeaders.set("x-community-id", meta.communityId);
      requestHeaders.set("x-user-role", meta.role ?? "resident");
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
