import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";
import type { NextAuthConfig } from "next-auth";

// Custom error for 2FA required
export class TwoFactorRequiredError extends Error {
  tempToken: string;
  method: string;

  constructor(tempToken: string, method: string) {
    super("Two-factor authentication required");
    this.name = "TwoFactorRequiredError";
    this.tempToken = tempToken;
    this.method = method;
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Google OAuth Provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Apple OAuth Provider
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    // Credentials Provider
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
        autoLoginToken: { label: "Auto Login Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        // Check for auto-login token (used after email verification)
        if (credentials.autoLoginToken && !credentials.password) {
          const autoLoginToken = credentials.autoLoginToken as string;

          // Find user by email AND valid auto-login token
          const userWithToken = await prisma.user.findFirst({
            where: {
              email: credentials.email as string,
              autoLoginToken: autoLoginToken,
              autoLoginTokenExpires: { gt: new Date() },
              emailVerified: { not: null }, // Must be verified
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              image: true,
              isBanned: true,
              banReason: true,
            },
          });

          if (!userWithToken) {
            return null; // Invalid or expired token
          }

          if (userWithToken.isBanned) {
            throw new Error(`Your account has been suspended. ${userWithToken.banReason || ""}`);
          }

          // Clear the auto-login token (one-time use)
          await prisma.user.update({
            where: { id: userWithToken.id },
            data: {
              autoLoginToken: null,
              autoLoginTokenExpires: null,
              lastLoginAt: new Date(),
              lastActiveAt: new Date(),
            },
          });

          // Log successful login
          await prisma.activityLog.create({
            data: {
              userId: userWithToken.id,
              action: "LOGIN",
              entityType: "User",
              entityId: userWithToken.id,
              details: { success: true, method: "auto_login_after_verification" },
            },
          });

          return {
            id: userWithToken.id,
            email: userWithToken.email,
            name: userWithToken.name,
            role: userWithToken.role,
            image: userWithToken.image,
          };
        }

        // Standard password-based authentication
        if (!credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            image: true,
            password: true,
            twoFactorEnabled: true,
            twoFactorMethod: true,
            twoFactorSecret: true,
            isBanned: true,
            banReason: true,
            isShadowBanned: true,
            emailVerified: true,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check if user is banned
        if (user.isBanned) {
          throw new Error(`Your account has been suspended. ${user.banReason || ""}`);
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          // Log failed login attempt
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: "LOGIN",
              entityType: "User",
              entityId: user.id,
              details: { success: false, reason: "invalid_password" },
            },
          });
          return null;
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const twoFactorCode = credentials.twoFactorCode as string | undefined;

          if (!twoFactorCode) {
            // Generate a temporary token for 2FA verification
            const tempToken = jwt.sign(
              { userId: user.id, email: user.email },
              process.env.NEXTAUTH_SECRET!,
              { expiresIn: "5m" }
            );

            throw new TwoFactorRequiredError(tempToken, user.twoFactorMethod || "AUTHENTICATOR");
          }

          // Verify 2FA code
          const { verifyTwoFactorToken } = await import("@/lib/auth/two-factor");
          const isValidCode = verifyTwoFactorToken(twoFactorCode, user.twoFactorSecret);

          if (!isValidCode) {
            throw new Error("Invalid two-factor authentication code");
          }
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
            details: { success: true, method: "credentials" },
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle OAuth sign-in (Google, Apple)
      if (account?.provider === "google" || account?.provider === "apple") {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { accounts: true },
        });

        // Check if banned
        if (existingUser?.isBanned) {
          return `/login?error=Your account has been suspended. ${existingUser.banReason || ""}`;
        }

        // If user exists but doesn't have this OAuth provider linked
        if (existingUser && !existingUser.accounts.some(a => a.provider === account.provider)) {
          // Create pending link token
          const token = crypto.randomBytes(32).toString("hex");
          const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          // Delete any existing pending links for this user/provider combo
          await prisma.pendingAccountLink.deleteMany({
            where: {
              userId: existingUser.id,
              provider: account.provider,
            },
          });

          await prisma.pendingAccountLink.create({
            data: {
              userId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              token,
              expires,
            },
          });

          // Send verification email
          const { sendAccountLinkEmail } = await import("@/lib/email");
          await sendAccountLinkEmail(user.email!, token, account.provider);

          // Redirect to link-account page (NOT an error, just a flow)
          return `/link-account?email=${encodeURIComponent(user.email!)}&provider=${account.provider}`;
        }

        // New user via OAuth - create the user
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              emailVerified: new Date(), // OAuth users are auto-verified
            },
          });
        } else {
          // Existing user with this provider already linked - just update timestamps
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              lastLoginAt: new Date(),
              lastActiveAt: new Date(),
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }

      // Add provider info to token
      if (account) {
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).provider = token.provider as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Log all sign-ins
      if (user.id) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            details: {
              success: true,
              method: account?.provider || "credentials",
            },
          },
        });
      }
    },
    async signOut(message) {
      // Log sign-outs
      // In NextAuth v5, the message can be either {session} or {token}
      const token = "token" in message ? message.token : null;
      if (token?.id) {
        await prisma.activityLog.create({
          data: {
            userId: token.id as string,
            action: "LOGOUT",
            entityType: "User",
            entityId: token.id as string,
          },
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
