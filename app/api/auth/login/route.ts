import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/db";
import { mockLogin } from "@/lib/mock-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // MOCK MODE: Simple authentication
    if (isMockMode()) {
      const result = mockLogin(email, password);

      if ('error' in result) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      });
    }

    // REAL MODE: Handled by NextAuth
    return NextResponse.json(
      { error: "Use NextAuth for authentication in production mode" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
