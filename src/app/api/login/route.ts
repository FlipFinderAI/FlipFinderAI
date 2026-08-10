import { NextResponse } from "next/server";

const SESSION_DURATION = 60 * 10; // 10 minutes

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (
      !body.password ||
      body.password !== process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 401,
        }
      );
    }

    const response = NextResponse.json({
      success: true,
    });

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
  } catch {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 400,
      }
    );
  }
}