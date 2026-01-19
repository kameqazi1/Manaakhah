import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyTwoFactorToken,
  verifyBackupCode,
  verifyEmailCode,
} from "@/lib/auth/two-factor";
import jwt from "jsonwebtoken";

// POST /api/auth/2fa/verify - Verify 2FA during login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tempToken, code, isBackupCode } = body;

    if (!tempToken || !code) {
      return NextResponse.json(
        { error: "Temporary token and code are required" },
        { status: 400 }
      );
    }

    // Verify the temporary token
    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(tempToken, process.env.NEXTAUTH_SECRET!) as {
        userId: string;
        email: string;
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired temporary token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorMethod: true,
        twoFactorBackupCodes: true,
        isBanned: true,
        isShadowBanned: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: "Your account has been suspended" },
        { status: 403 }
      );
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled" },
        { status: 400 }
      );
    }

    // Check that the user has proper 2FA setup (secret for AUTHENTICATOR, or EMAIL method)
    if (user.twoFactorMethod === "AUTHENTICATOR" && !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Two-factor authentication is not properly configured" },
        { status: 400 }
      );
    }

    let isValid = false;
    let usedBackupCodeIndex = -1;

    if (isBackupCode) {
      // Verify backup code
      const result = await verifyBackupCode(code, user.twoFactorBackupCodes);
      isValid = result.valid;
      usedBackupCodeIndex = result.usedIndex;
    } else if (user.twoFactorMethod === "EMAIL") {
      // Verify email code
      isValid = await verifyEmailCode(user.id, code);
    } else {
      // Verify TOTP code (authenticator)
      isValid = verifyTwoFactorToken(code, user.twoFactorSecret!);
    }

    if (!isValid) {
      // Log failed attempt
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          entityType: "User",
          entityId: user.id,
          details: {
            success: false,
            reason: "invalid_2fa_code",
            isBackupCode,
          },
        },
      });

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // If backup code was used, remove it from the list
    if (usedBackupCodeIndex >= 0) {
      const updatedBackupCodes = [...user.twoFactorBackupCodes];
      updatedBackupCodes.splice(usedBackupCodeIndex, 1);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: updatedBackupCodes,
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      },
    });

    // Log successful login
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entityType: "User",
        entityId: user.id,
        details: {
          success: true,
          twoFactorVerified: true,
          method: isBackupCode ? "backup_code" : user.twoFactorMethod,
        },
      },
    });

    // Create a proper session token
    // Note: In production, this should integrate with NextAuth session creation
    const sessionToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        twoFactorVerified: true,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
      sessionToken,
      backupCodesRemaining: isBackupCode
        ? user.twoFactorBackupCodes.length - 1
        : user.twoFactorBackupCodes.length,
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify two-factor authentication" },
      { status: 500 }
    );
  }
}
