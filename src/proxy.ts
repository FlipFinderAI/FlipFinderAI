import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_DURATION = 60 * 10; // 10 minutes

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /*
   * ==================================================
   * ALWAYS ALLOW LOGIN
   * ==================================================
   */

  if (
    pathname === "/login" ||
    pathname === "/api/login"
  ) {
    return NextResponse.next();
  }

  /*
   * ==================================================
   * CHECK AUTHENTICATION
   * ==================================================
   */

  const authCookie =
    request.cookies.get("flipfinder-auth");

  const isAuthenticated =
    authCookie?.value === "true";

  /*
   * ==================================================
   * API ROUTES
   *
   * NEVER redirect API requests to /login.
   *
   * The frontend expects JSON. A redirect would
   * return the HTML login page and cause:
   *
   * Unexpected token '<'
   *
   * Instead return a JSON 401 response.
   * ==================================================
   */

  if (!isAuthenticated && pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Please log in before using this API.",
      },
      {
        status: 401,
      }
    );
  }

  /*
   * ==================================================
   * NORMAL APPLICATION PAGES
   *
   * These can still redirect to /login.
   * ==================================================
   */

  if (!isAuthenticated) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  /*
   * ==================================================
   * AUTHENTICATED USER
   *
   * Refresh authentication cookie for another
   * 10 minutes.
   * ==================================================
   */

  const response = NextResponse.next();

  response.cookies.set(
    "flipfinder-auth",
    "true",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    }
  );

  return response;
}

/*
 * ==================================================
 * PROTECT APPLICATION AND API ROUTES
 *
 * Exclude Next.js internals and static files.
 * ==================================================
 */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};