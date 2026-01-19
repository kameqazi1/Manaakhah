import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { send2FACodeEmail } from "@/lib/email";

const APP_NAME = "Manaakhah";

/**
 * Generate a new TOTP secret for 2FA
 */
export function generateTwoFactorSecret(email: string): {
  secret: string;
  otpauthUrl: string;
} {
  // Generate a random secret
  const secret = new OTPAuth.Secret({ size: 20 });

  // Create TOTP instance
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret,
  });

  return {
    secret: secret.base32,
    otpauthUrl: totp.toString(),
  };
}

/**
 * Generate QR code data URL for authenticator app setup
 */
export async function generateQRCodeDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // Verify with a window of 1 (allows for time drift)
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

/**
 * Generate backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate a random 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Hash backup codes for secure storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const bcrypt = await import("bcryptjs");
  return Promise.all(codes.map((code) => bcrypt.hash(code.replace("-", ""), 10)));
}

/**
 * Verify a backup code against stored hashes
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; usedIndex: number }> {
  const bcrypt = await import("bcryptjs");
  const normalizedCode = code.replace("-", "").toUpperCase();

  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(normalizedCode, hashedCodes[i]);
    if (isValid) {
      return { valid: true, usedIndex: i };
    }
  }

  return { valid: false, usedIndex: -1 };
}

/**
 * Generate a 6-digit code for SMS/Email 2FA
 */
export function generateEmailSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send 2FA code via email
 */
export async function sendTwoFactorEmail(email: string, code: string): Promise<boolean> {
  try {
    await send2FACodeEmail(email, code);
    return true;
  } catch (error) {
    console.error("[2FA] Failed to send email code:", error);
    return false;
  }
}

/**
 * Generate and send a 2FA code via email
 * Stores code in database with 10-minute expiry
 */
export async function generateAndSendEmailCode(userId: string, email: string): Promise<boolean> {
  const code = generateEmailSmsCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorCode: code,
      twoFactorCodeExpires: expires,
    },
  });

  await send2FACodeEmail(email, code);
  return true;
}

/**
 * Verify a 2FA code for email/SMS methods
 * Returns true if valid, clears code after successful verification
 */
export async function verifyEmailCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorCode: true, twoFactorCodeExpires: true },
  });

  if (!user?.twoFactorCode || !user?.twoFactorCodeExpires) return false;
  if (new Date() > user.twoFactorCodeExpires) return false;
  if (user.twoFactorCode !== code) return false;

  // Clear code after successful verification (single use)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorCode: null, twoFactorCodeExpires: null },
  });

  return true;
}

// SMS 2FA removed - not implemented (see 04-02-PLAN.md)
