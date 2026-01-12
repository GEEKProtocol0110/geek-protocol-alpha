import { NextResponse, type NextRequest } from "next/server";

// Force everything to render the landing page at "/" (except assets and API)
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals, assets, and API to pass through unchanged
  const skip =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/opengraph") ||
    pathname.startsWith("/twitter-image") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/api");

  if (skip || pathname === "/") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/:path*"],
};
