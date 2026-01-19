import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/link-account?token=xxx - Verify link and complete account linking
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/link-account?error=missing_token", req.url));
  }

  try {
    const pendingLink = await prisma.pendingAccountLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!pendingLink) {
      return NextResponse.redirect(new URL("/link-account?error=invalid_token", req.url));
    }

    if (pendingLink.expires < new Date()) {
      // Clean up expired token
      await prisma.pendingAccountLink.delete({ where: { id: pendingLink.id } });
      return NextResponse.redirect(new URL("/link-account?error=expired_token", req.url));
    }

    // Create the OAuth account link
    await prisma.account.create({
      data: {
        userId: pendingLink.userId,
        type: "oauth",
        provider: pendingLink.provider,
        providerAccountId: pendingLink.providerAccountId,
      },
    });

    // Clean up pending link
    await prisma.pendingAccountLink.delete({ where: { id: pendingLink.id } });

    // Update last login
    await prisma.user.update({
      where: { id: pendingLink.userId },
      data: {
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      },
    });

    // Log the account link
    await prisma.activityLog.create({
      data: {
        userId: pendingLink.userId,
        action: "CREATE",
        entityType: "Account",
        entityId: pendingLink.userId,
        details: {
          type: "account_linked",
          provider: pendingLink.provider,
        },
      },
    });

    // Redirect to login with success message
    const providerName = pendingLink.provider.charAt(0).toUpperCase() + pendingLink.provider.slice(1);
    return NextResponse.redirect(
      new URL(`/login?success=account_linked&provider=${providerName}`, req.url)
    );
  } catch (error) {
    console.error("Account link error:", error);
    return NextResponse.redirect(new URL("/link-account?error=server_error", req.url));
  }
}
