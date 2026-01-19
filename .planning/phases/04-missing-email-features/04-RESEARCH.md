# Phase 4: Missing Email Features - Research

**Researched:** 2026-01-19
**Domain:** Email delivery (2FA codes, staff invitations)
**Confidence:** HIGH

## Summary

This phase completes three placeholder email implementations: 2FA code delivery via email, 2FA code delivery via SMS, and staff invitation emails. The codebase already has Resend integrated (v6.7.0) with branded HTML email templates established in Phase 2, making email implementation straightforward.

The existing `lib/auth/two-factor.ts` has stub functions `sendTwoFactorEmail()` and `sendTwoFactorSMS()` that currently just log to console. The staff route has a TODO comment for sending invitation emails. The schema supports 2FA methods (AUTHENTICATOR, SMS, EMAIL) but lacks fields for storing temporary codes and expiry times for email/SMS methods.

**Primary recommendation:** Implement email 2FA using existing Resend infrastructure. For SMS, either integrate Twilio (simplest API, well-documented) or remove SMS as an option if cost/complexity is a concern. Add database fields for temporary 2FA code storage with expiry.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| resend | 6.7.0 | Email delivery | Already installed, proven in Phase 2 |

### Supporting (if SMS implemented)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| twilio | ^5.x | SMS delivery | If SMS 2FA is kept |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Twilio | Plivo, Vonage | Lower cost but less documentation |
| SMS 2FA | Remove option | Simpler, no recurring cost, authenticator is more secure |

**Installation (if SMS kept):**
```bash
npm install twilio
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
  email.ts                    # Add send2FACodeEmail, sendStaffInvitationEmail
  auth/
    two-factor.ts             # Update sendTwoFactorEmail, sendTwoFactorSMS
    sms.ts                    # NEW: SMS sending (if implemented)
app/api/auth/2fa/
  send-code/route.ts          # NEW: Endpoint to send email/SMS codes
  setup/route.ts              # Existing, needs update for email/SMS flow
  verify/route.ts             # Existing, needs update for email/SMS codes
```

### Pattern 1: Temporary Code Storage
**What:** Store 2FA codes in database with expiry, not in JWT or session
**When to use:** Email/SMS 2FA requires server-side code verification
**Example:**
```typescript
// Add to User model in schema.prisma
twoFactorCode       String?
twoFactorCodeExpires DateTime?

// In two-factor.ts
export async function generateAndSendEmailCode(userId: string, email: string): Promise<boolean> {
  const code = generateEmailSmsCode(); // Existing function, generates 6-digit code
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

export async function verifyEmailSmsCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorCode: true, twoFactorCodeExpires: true },
  });

  if (!user?.twoFactorCode || !user?.twoFactorCodeExpires) return false;
  if (new Date() > user.twoFactorCodeExpires) return false;
  if (user.twoFactorCode !== code) return false;

  // Clear code after successful verification
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorCode: null, twoFactorCodeExpires: null },
  });

  return true;
}
```

### Pattern 2: Consistent Email Templates
**What:** Match existing branded email template style from lib/email.ts
**When to use:** All new email functions
**Example:**
```typescript
// Source: lib/email.ts existing pattern
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
```

### Pattern 3: Staff Invitation Email
**What:** Include inviter name, business name, role, and clear CTA
**When to use:** When business owner/manager invites staff
**Example:**
```typescript
export async function sendStaffInvitationEmail(
  email: string,
  inviterName: string,
  businessName: string,
  role: string
): Promise<void> {
  const signUpUrl = `${APP_URL}/signup?invited=true&email=${encodeURIComponent(email)}`;
  const loginUrl = `${APP_URL}/login`;

  await getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `You've been invited to join ${businessName} on ${APP_NAME}`,
    html: `
      <!-- Same branded template structure as above -->
      <h2 style="color: #111827; margin-top: 0;">You're Invited!</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        <strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong>
        as a <strong>${role}</strong> on ${APP_NAME}.
      </p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 12px 0;"><strong>Business:</strong> ${businessName}</p>
        <p style="margin: 0;"><strong>Your Role:</strong> ${role}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${signUpUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        Already have an account? <a href="${loginUrl}" style="color: #16a34a;">Sign in here</a>
      </p>
    `,
  });
}
```

### Anti-Patterns to Avoid
- **Storing codes only in JWT:** Codes must be stored server-side for security and single-use enforcement
- **No expiry on codes:** Always enforce 10-minute expiry per security best practices
- **Reusing same code:** Generate new code on each request, invalidate old one
- **Long SMS messages:** Keep SMS under 160 characters to avoid multi-segment charges

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery | Raw SMTP | Resend API | Deliverability, rate limiting, templates |
| SMS delivery | Direct carrier API | Twilio/Plivo API | Carrier routing, compliance, delivery reports |
| 6-digit code generation | Custom random | Existing `generateEmailSmsCode()` | Already implemented in codebase |
| Email templates | Plain text | Existing branded HTML | Consistency with other emails |

**Key insight:** The infrastructure for email delivery already exists. The task is wiring up existing patterns, not building new systems.

## Common Pitfalls

### Pitfall 1: Code Not Expiring
**What goes wrong:** Old codes remain valid indefinitely
**Why it happens:** Forgetting to check expiry or not storing it
**How to avoid:** Always store `twoFactorCodeExpires` and check it during verification
**Warning signs:** Users can use codes days later

### Pitfall 2: Code Reuse Attacks
**What goes wrong:** Same code can be used multiple times
**Why it happens:** Not clearing code after successful verification
**How to avoid:** Set `twoFactorCode = null` immediately after successful verification
**Warning signs:** Activity logs show same code verified multiple times

### Pitfall 3: SMS Rate Limiting
**What goes wrong:** Users spam SMS button, racking up costs
**Why it happens:** No cooldown between send requests
**How to avoid:** Implement 60-second cooldown between SMS/email code sends (similar to Phase 2 email verification)
**Warning signs:** High SMS costs, user complaints about slow codes

### Pitfall 4: Staff Invitation Without Tracking
**What goes wrong:** No way to know if invitation was sent
**Why it happens:** Not updating `invitedAt` timestamp or logging
**How to avoid:** Update StaffRole with invitation timestamp, log to ActivityLog
**Warning signs:** No audit trail for invitations

### Pitfall 5: Email Deliverability for Short Codes
**What goes wrong:** 2FA emails land in spam
**Why it happens:** Very short emails with codes look suspicious
**How to avoid:** Include adequate text, proper sender name, match existing template format
**Warning signs:** Users report not receiving codes

## Code Examples

Verified patterns from official sources and existing codebase:

### Resend Email Send (from lib/email.ts)
```typescript
// Source: /Users/saeed/Desktop/Manaakhah/lib/email.ts
await getResend().emails.send({
  from: `${APP_NAME} <${FROM_EMAIL}>`,
  to: email,
  subject: `Subject here`,
  html: `<!-- HTML content -->`,
});
```

### Existing 6-Digit Code Generator
```typescript
// Source: /Users/saeed/Desktop/Manaakhah/lib/auth/two-factor.ts
export function generateEmailSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### Twilio SMS Send (if implemented)
```typescript
// Source: Twilio official documentation
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, body: string): Promise<boolean> {
  try {
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to, // E.164 format: +1XXXXXXXXXX
      body: body,
    });
    return true;
  } catch (error) {
    console.error('SMS send failed:', error);
    return false;
  }
}

// Usage for 2FA
export async function sendTwoFactorSMS(phone: string, code: string): Promise<boolean> {
  return sendSMS(phone, `Your ${APP_NAME} verification code is: ${code}. Expires in 10 minutes.`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SMS as primary 2FA | Authenticator apps preferred | 2023+ | SMS now fallback, not recommended as sole option |
| Plain text emails | Rich HTML with branding | 2020+ | Better deliverability and trust |
| Hardcoded expiry | Configurable expiry (10 min standard) | 2024 | Balances security and usability |

**Deprecated/outdated:**
- SMS-only 2FA without authenticator option (security concern)
- Very long code expiry times (15+ minutes)

## Open Questions

Things that couldn't be fully resolved:

1. **SMS Implementation Decision**
   - What we know: SMS costs money ($0.004-$0.01+ per message), requires carrier compliance, less secure than authenticator
   - What's unclear: Whether the business wants to incur SMS costs or prefer to remove the option
   - Recommendation: **Implement email 2FA first. Either implement SMS with Twilio OR remove SMS option from UI/API.** Decision should be made before planning.

2. **Phone Number Collection**
   - What we know: User model has `phone` field, but it's optional and may not be validated
   - What's unclear: How phone numbers are currently collected/validated
   - Recommendation: If SMS is implemented, require phone validation before enabling SMS 2FA

## Sources

### Primary (HIGH confidence)
- `/Users/saeed/Desktop/Manaakhah/lib/email.ts` - Existing Resend integration pattern
- `/Users/saeed/Desktop/Manaakhah/lib/auth/two-factor.ts` - Existing 2FA code generation
- `/Users/saeed/Desktop/Manaakhah/app/api/business/[id]/staff/route.ts` - Staff invitation flow
- `/Users/saeed/Desktop/Manaakhah/prisma/schema.prisma` - User model, TwoFactorMethod enum
- https://resend.com/docs/send-with-nodejs - Resend API documentation

### Secondary (MEDIUM confidence)
- https://www.twilio.com/docs/messaging/quickstart - Twilio SMS quickstart
- https://www.twilio.com/docs/verify/developer-best-practices - 2FA code best practices (10-min expiry, 6 digits, rate limiting)

### Tertiary (LOW confidence)
- WebSearch results on SMS provider comparison and cost analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Resend, well-documented
- Architecture: HIGH - Following existing patterns in codebase
- Pitfalls: MEDIUM - Based on general 2FA best practices, not project-specific issues

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain)

---

## Decision Needed Before Planning

**SMS 2FA: Implement or Remove?**

Options:
1. **Implement SMS with Twilio** - ~$0.01 per message, requires account setup, 10DLC registration for US numbers
2. **Remove SMS option** - Simpler, no cost, authenticator + email is sufficient for most users

Recommendation: If this is an MVP/early-stage project, **remove SMS option** and offer only Authenticator + Email. SMS can be added later when there's user demand. This reduces scope and ongoing costs.
