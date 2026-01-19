import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = resendSchema.parse(body);

    if (isMockMode()) {
      return NextResponse.json({
        message: "Verification email sent (mock mode)",
      });
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        lastVerificationEmailSent: true,
      },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: "Email is already verified. You can log in.",
      });
    }

    // Check cooldown (1 minute between resend requests)
    const COOLDOWN_MS = 60 * 1000; // 1 minute
    if (user.lastVerificationEmailSent) {
      const timeSinceLastEmail = Date.now() - user.lastVerificationEmailSent.getTime();
      if (timeSinceLastEmail < COOLDOWN_MS) {
        const secondsRemaining = Math.ceil((COOLDOWN_MS - timeSinceLastEmail) / 1000);
        return NextResponse.json(
          { error: `Please wait ${secondsRemaining} seconds before requesting another email` },
          { status: 429 }
        );
      }
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token and track last email sent time
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires,
        lastVerificationEmailSent: new Date(),
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.name || "User", emailVerificationToken);

    return NextResponse.json({
      message: "If an account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while sending verification email" },
      { status: 500 }
    );
  }
}
