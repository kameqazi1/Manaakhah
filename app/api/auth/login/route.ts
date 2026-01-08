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
      const user = mockLogin(email, password);

      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
