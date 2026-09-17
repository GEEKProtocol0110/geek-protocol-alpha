import { NextResponse, type NextRequest } from "next/server";

const SITE_PAGES: Record<string, string> = {
  "/": "/site/index.html",
  "/play": "/site/play/index.html",
  "/play/": "/site/play/index.html",
  "/lobby": "/site/lobby/index.html",
  "/lobby/": "/site/lobby/index.html",
  "/mint": "/site/mint/index.html",
  "/mint/": "/site/mint/index.html",
  "/kaspa": "/site/kaspa/index.html",
  "/kaspa/": "/site/kaspa/index.html",
};

const SITE_ASSET_PREFIXES = [
  "/assets/",
  "/play/assets/",
  "/lobby/assets/",
  "/mint/assets/",
  "/kaspa/assets/",
];

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

function rewrite(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Serve the exported Sites experience at the public product routes.
  const sitePage = SITE_PAGES[pathname];
  if (sitePage) return rewrite(req, sitePage);

  const siteAssetPrefix = SITE_ASSET_PREFIXES.find((prefix) =>
    pathname.startsWith(prefix)
  );
  if (siteAssetPrefix) return rewrite(req, `/site${pathname}`);

  // Always pass through Next internals, APIs, and the synced static Site files.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/site/") ||
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

  // Protected routes: redirect to login if no session cookie.
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

  // Known public routes pass through.
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublic) return NextResponse.next();

  // Fallback: rewrite unknown routes to the exported landing page.
  return rewrite(req, "/site/index.html");
}

export const config = {
  matcher: ["/:path*"],
};
