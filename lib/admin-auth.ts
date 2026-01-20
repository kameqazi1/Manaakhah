/**
 * Admin Authentication Helper
 *
 * Provides consistent admin authorization across all admin API routes.
 * Works with both mock mode (header-based) and production (NextAuth session).
 */

import { auth } from "@/lib/auth";
import { isMockMode } from "@/lib/db";

export interface AdminAuthResult {
  authorized: boolean;
  userId: string | null;
  userRole: string | null;
}

/**
 * Check if the current request has admin authorization.
 *
 * In mock mode: Uses x-user-role header
 * In production: Uses NextAuth session
 *
 * @param req - The incoming request
 * @returns AdminAuthResult with authorization status and user info
 */
export async function checkAdminAuth(req: Request): Promise<AdminAuthResult> {
  if (isMockMode()) {
    // Mock mode: Use headers for auth (development only)
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    return {
      authorized: userRole === "ADMIN",
      userId,
      userRole,
    };
  }

  // Production mode: Use NextAuth session
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        authorized: false,
        userId: null,
        userRole: null,
      };
    }

    const userRole = (session.user as any).role;

    return {
      authorized: userRole === "ADMIN",
      userId: session.user.id,
      userRole,
    };
  } catch (error) {
    console.error("Error checking admin auth:", error);
    return {
      authorized: false,
      userId: null,
      userRole: null,
    };
  }
}

/**
 * Simple boolean check for admin authorization.
 * Use this when you only need to know if authorized, not the user details.
 */
export async function isAdmin(req: Request): Promise<boolean> {
  const result = await checkAdminAuth(req);
  return result.authorized;
}
