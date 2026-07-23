import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login", "/signup", "/verify-email"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Note: deliberately NOT redirecting authenticated sessions away from
  // /login /signup here. The proxy only verifies the JWT signature, not
  // that the underlying user still exists — a stale/orphaned cookie (user
  // deleted, DB reset) would otherwise bounce every /login navigation back
  // to "/", trapping the user in an infinite redirect loop with no way to
  // reach the login form again. Pages needing an "already logged in, skip
  // login" shortcut should check via /api/auth/session (which does hit the
  // DB) instead of relying on the proxy for that.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
