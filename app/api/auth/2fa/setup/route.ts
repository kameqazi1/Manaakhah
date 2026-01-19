import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateTwoFactorSecret,
  generateQRCodeDataUrl,
  generateBackupCodes,
  hashBackupCodes,
  verifyTwoFactorToken,
} from "@/lib/auth/two-factor";

// POST /api/auth/2fa/setup - Initialize 2FA setup
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is already enabled" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { method } = body; // AUTHENTICATOR, SMS, EMAIL

    if (!method || !["AUTHENTICATOR", "EMAIL"].includes(method)) {
      return NextResponse.json(
        { error: "Invalid 2FA method. Choose AUTHENTICATOR or EMAIL" },
        { status: 400 }
      );
    }

    if (method === "AUTHENTICATOR") {
      // Generate TOTP secret and QR code
      const { secret, otpauthUrl } = generateTwoFactorSecret(user.email);
      const qrCodeDataUrl = await generateQRCodeDataUrl(otpauthUrl);

      // Store the secret temporarily (not enabled yet)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: secret,
          twoFactorMethod: "AUTHENTICATOR",
        },
      });

      return NextResponse.json({
        success: true,
        method: "AUTHENTICATOR",
        qrCode: qrCodeDataUrl,
        secret: secret, // Allow manual entry
        message: "Scan the QR code with your authenticator app, then verify with a code",
      });
    } else if (method === "EMAIL") {
      // For Email, send code immediately for verification
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorMethod: "EMAIL",
        },
      });

      // Send initial verification code
      const { generateAndSendEmailCode } = await import("@/lib/auth/two-factor");
      await generateAndSendEmailCode(user.id, user.email);

      return NextResponse.json({
        success: true,
        method: "EMAIL",
        message: "A verification code has been sent to your email. Enter it to complete setup.",
      });
    }

    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to set up two-factor authentication" },
      { status: 500 }
    );
  }
}

// PUT /api/auth/2fa/setup - Verify and enable 2FA
export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorMethod: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is already enabled" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { error: "Please provide a valid 6-digit code" },
        { status: 400 }
      );
    }

    if (user.twoFactorMethod === "AUTHENTICATOR") {
      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: "Please set up 2FA first" },
          { status: 400 }
        );
      }

      const isValid = verifyTwoFactorToken(code, user.twoFactorSecret);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }
    } else if (user.twoFactorMethod === "EMAIL") {
      const { verifyEmailCode } = await import("@/lib/auth/two-factor");
      const isValid = await verifyEmailCode(user.id, code);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid or expired verification code" },
          { status: 400 }
        );
      }
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashedBackupCodes,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_CHANGE", // Using existing enum for security action
        entityType: "User",
        entityId: user.id,
        details: { action: "2fa_enabled", method: user.twoFactorMethod },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been enabled",
      backupCodes, // Show these once, they won't be retrievable again
      warning: "Save these backup codes in a secure location. They can be used if you lose access to your authenticator.",
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify two-factor authentication" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/2fa/setup - Disable 2FA
export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { password, code } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorMethod: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled" },
        { status: 400 }
      );
    }

    // Verify password
    if (user.password && password) {
      const bcrypt = await import("bcryptjs");
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }
    }

    // Verify 2FA code if provided (additional security)
    if (code && user.twoFactorSecret) {
      const isCodeValid = verifyTwoFactorToken(code, user.twoFactorSecret);
      if (!isCodeValid) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorMethod: null,
        twoFactorBackupCodes: [],
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_CHANGE",
        entityType: "User",
        entityId: user.id,
        details: { action: "2fa_disabled" },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been disabled",
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { error: "Failed to disable two-factor authentication" },
      { status: 500 }
    );
  }
}
