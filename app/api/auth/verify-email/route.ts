import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { z } from "zod";

const verifySchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = verifySchema.parse(body);

    if (isMockMode()) {
      return NextResponse.json({
        message: "Email verified successfully (mock mode)",
      });
    }

    // Find user with this verification token
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        autoLoginToken: true,
        autoLoginTokenExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Check if auto-login token is still valid
    const canAutoLogin = !!(
      user.autoLoginToken &&
      user.autoLoginTokenExpires &&
      user.autoLoginTokenExpires > new Date()
    );

    return NextResponse.json({
      message: "Email verified successfully.",
      email: user.email,
      canAutoLogin,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during email verification" },
      { status: 500 }
    );
  }
}

// GET endpoint for verifying via URL click
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
    }

    if (isMockMode()) {
      return NextResponse.redirect(new URL("/login?verified=true", req.url));
    }

    // Find user with this verification token
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL("/login?error=verification_failed", req.url));
  }
}
