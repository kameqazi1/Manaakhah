import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAndSendEmailCode } from "@/lib/auth/two-factor";

// POST /api/auth/2fa/send-code - Send 2FA code via email
export async function POST() {
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
        twoFactorMethod: true,
        twoFactorCodeExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorMethod !== "EMAIL") {
      return NextResponse.json(
        { error: "Email 2FA is not enabled for this account" },
        { status: 400 }
      );
    }

    // Rate limiting: 60-second cooldown between sends
    if (user.twoFactorCodeExpires) {
      const cooldownEnd = new Date(user.twoFactorCodeExpires.getTime() - 9 * 60 * 1000); // 10 min - 9 min = 1 min from creation
      if (new Date() < cooldownEnd) {
        const secondsLeft = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);
        return NextResponse.json(
          { error: `Please wait ${secondsLeft} seconds before requesting a new code` },
          { status: 429 }
        );
      }
    }

    await generateAndSendEmailCode(user.id, user.email);

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Send 2FA code error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
