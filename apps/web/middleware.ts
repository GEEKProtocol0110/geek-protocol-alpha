import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/leaderboard",
  "/litepaper",
  "/play",
  "/quiz",
];

const PROTECTED_PATHS = ["/dashboard", "/profile", "/admin", "/gauntlet"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass through Next internals and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/opengraph") ||
    pathname.startsWith("/twitter-image") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Protected routes: redirect to login if no session cookie
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected) {
    const session = req.cookies.get("gp_session");
    if (!session?.value) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Known public routes pass through
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublic) return NextResponse.next();

  // Fallback: rewrite unknown routes to landing page
  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/:path*"],
};
