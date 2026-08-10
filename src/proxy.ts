import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_DURATION = 60 * 10; // 10 minutes

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Always allow the login page and login API.
  if (
    pathname === "/login" ||
    pathname === "/api/login"
  ) {
    return NextResponse.next();
  }

  // Check authentication cookie.
  const authCookie = request.cookies.get("flipfinder-auth");

  if (!authCookie || authCookie.value !== "true") {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // User is authenticated.
  // Refresh the cookie for another 10 minutes.
  const response = NextResponse.next();

  response.cookies.set(
    "flipfinder-auth",
    "true",
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    }
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Protect the application and API routes,
     * while excluding Next.js internals and static files.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};