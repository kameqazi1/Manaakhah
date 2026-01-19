# Phase 3: Security Fixes - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove identified security vulnerabilities before public access. Three specific issues: unsafe OAuth account linking, missing environment variable validation, and mock auth headers accepted in production mode.

</domain>

<decisions>
## Implementation Decisions

### OAuth linking behavior
- When OAuth email matches existing account, prompt user to confirm before linking
- Confirmation requires email verification (send email to prove ownership)
- After linking, both methods work (user can sign in with Google OR email/password)
- Same flow for signup via Google with existing email — offer to link after verification

### Environment validation
- Fail fast at app startup if required vars missing
- Simple error message: "Missing required environment variables: X, Y, Z"
- Warn on console if deprecated/unknown vars are set

### Mock header protection
- Log security warning when mock headers (x-user-id, x-user-role) sent in production
- Continue request normally using real auth (don't reject)
- Temporary block after repeated attempts from same IP

### Claude's Discretion
- Mode-aware validation (which vars required in prod vs dev)
- Log detail level for mock header attempts
- Middleware vs per-route enforcement for mock mode check
- Number of attempts before temporary block, block duration

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-security-fixes*
*Context gathered: 2026-01-19*
