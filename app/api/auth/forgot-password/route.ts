import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    if (isMockMode()) {
      return NextResponse.json({
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    // Always return success message to prevent email enumeration
    const successMessage = "If an account exists with this email, a password reset link has been sent.";

    if (!user) {
      return NextResponse.json({ message: successMessage });
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name || "User", passwordResetToken);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Still return success to prevent enumeration
    }

    return NextResponse.json({ message: successMessage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
