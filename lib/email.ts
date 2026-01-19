import { Resend } from "resend";

// Lazy initialization to avoid errors during build when API key is not set
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@manakhaah.com";
const APP_NAME = "Manakhaah";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  await getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Verify your ${APP_NAME} account`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Keep Muslim Money in the Muslim Community</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #111827; margin-top: 0;">Welcome, ${name}!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Thank you for joining ${APP_NAME}! Please verify your email address to complete your registration and start discovering Muslim-owned businesses in your area.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                This link will expire in 24 hours. If you didn't create an account with ${APP_NAME}, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <a href="${verificationUrl}" style="color: #16a34a; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Hi ${name}, we received a request to reset your password. Click the button below to create a new password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email - your password will remain unchanged.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <a href="${resetUrl}" style="color: #16a34a; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendBookingConfirmationEmail(
  email: string,
  name: string,
  booking: {
    businessName: string;
    serviceName: string;
    date: string;
    time: string;
    address: string;
  }
) {
  await getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Booking Confirmed - ${booking.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Booking Confirmed!</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #111827; margin-top: 0;">Hi ${name}!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Your booking has been confirmed. Here are the details:
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 12px 0;"><strong>Business:</strong> ${booking.businessName}</p>
                <p style="margin: 0 0 12px 0;"><strong>Service:</strong> ${booking.serviceName}</p>
                <p style="margin: 0 0 12px 0;"><strong>Date:</strong> ${booking.date}</p>
                <p style="margin: 0 0 12px 0;"><strong>Time:</strong> ${booking.time}</p>
                <p style="margin: 0;"><strong>Location:</strong> ${booking.address}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/bookings" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View My Bookings
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendAccountLinkEmail(
  email: string,
  token: string,
  provider: string
): Promise<EmailResult> {
  const linkUrl = `${APP_URL}/api/auth/link-account?token=${token}`;
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

  try {
    await getResend().emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Link your ${providerName} account - ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
                <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Account Linking Request</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #111827; margin-top: 0;">Link Your ${providerName} Account</h2>
                <p style="color: #4b5563; line-height: 1.6;">
                  Someone tried to sign in with ${providerName} using your email address. If this was you, click the button below to link your ${providerName} account to your existing ${APP_NAME} account.
                </p>
                <p style="color: #4b5563; line-height: 1.6;">
                  After linking, you'll be able to sign in using either your password or ${providerName}.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${linkUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Link ${providerName} Account
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  This link will expire in 24 hours. If you didn't request this, you can safely ignore this email - your account will remain unchanged.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  If the button doesn't work, copy and paste this URL into your browser:<br>
                  <a href="${linkUrl}" style="color: #16a34a; word-break: break-all;">${linkUrl}</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send account link email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function send2FACodeEmail(email: string, code: string): Promise<void> {
  await getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Your ${APP_NAME} verification code`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Verification Code</p>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <p style="color: #4b5563; line-height: 1.6;">
                Your verification code is:
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="font-size: 32px; font-weight: bold; color: #111827; letter-spacing: 8px; margin: 0;">${code}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendStaffInvitationEmail(
  email: string,
  inviterName: string,
  businessName: string,
  role: string
): Promise<void> {
  const signUpUrl = `${APP_URL}/signup?invited=true&email=${encodeURIComponent(email)}`;
  const loginUrl = `${APP_URL}/login`;

  // Format role for display (manager -> Manager)
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  await getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `You've been invited to join ${businessName} on ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">You're Invited!</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #111827; margin-top: 0;">Join ${businessName}</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong>
                as a <strong>${displayRole}</strong> on ${APP_NAME}.
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 12px 0; color: #374151;"><strong>Business:</strong> ${businessName}</p>
                <p style="margin: 0; color: #374151;"><strong>Your Role:</strong> ${displayRole}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signUpUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Already have an account? <a href="${loginUrl}" style="color: #16a34a; text-decoration: none;">Sign in here</a>
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendNewReviewNotification(
  businessOwnerEmail: string,
  businessOwnerName: string,
  review: {
    businessName: string;
    reviewerName: string;
    rating: number;
    content: string;
  }
) {
  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

  await getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: businessOwnerEmail,
    subject: `New ${review.rating}-star review for ${review.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">New Review Alert!</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #111827; margin-top: 0;">Hi ${businessOwnerName}!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                ${review.reviewerName} just left a review for <strong>${review.businessName}</strong>:
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #eab308; font-size: 24px; margin: 0 0 12px 0;">${stars}</p>
                <p style="color: #374151; font-style: italic; margin: 0;">"${review.content}"</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 12px;">- ${review.reviewerName}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Respond to Review
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
