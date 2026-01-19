# Phase 1: Mock Mode Auth Fix - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the authentication flow in mock mode so users can register with email/password and immediately sign in with those credentials. Session must persist on page refresh. This phase only addresses mock mode behavior — production auth (email verification, password reset) is Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Session persistence
- Session lasts until browser closes (sessionStorage, not localStorage)
- Session survives page refresh within the same browser session
- Store full profile data in session: ID, email, role, display name, avatar URL, preferences
- Claude's discretion on handling stale session data (refresh on page load vs cache until sign out)

### Login error feedback
- Specific error messages: "Email not found" or "Wrong password" (not generic "Invalid credentials")
- No rate limiting on failed attempts in mock mode
- Errors appear inline with form, near the relevant fields
- Show "Forgot password?" link even in mock mode (for UI consistency)

### Password requirements
- Minimum 8 characters
- No complexity requirements (no forced uppercase, numbers, or special characters)
- Single password field with show/hide toggle (no confirmation field)
- Claude's discretion on validation timing (on submit vs real-time)

### Auto-login after register
- Automatically sign in user immediately after successful registration
- Redirect to home page after auto-login
- Show simple welcome toast: "Welcome, [name]!"

### Claude's Discretion
- Password validation timing (on submit vs real-time feedback)
- Session data staleness handling (refresh on each page load vs cache until sign out)
- Exact toast notification implementation
- Loading states during auth operations

</decisions>

<specifics>
## Specific Ideas

- Mock mode should feel like a real auth system for demo purposes
- Error messages should help users understand exactly what went wrong
- Simple, modern UX without unnecessary friction (hence single password field)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-mock-mode-auth-fix*
*Context gathered: 2026-01-19*
