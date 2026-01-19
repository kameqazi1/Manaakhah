# Phase 1: Mock Mode Auth Fix - Execution Plan

**Created:** 2026-01-19
**Status:** Ready for execution

## Goal

User can register and sign in successfully in mock mode, with session persisting across page refreshes.

## Root Cause Analysis

**The Bug:** Registration creates user on server-side MockStorage instance, but login reads from client-side MockStorage instance. These are separate singletons that don't share data.

**Why it happens:**
1. `/api/auth/register` runs on the server (Next.js API route)
2. Server creates its own `mockStorage` singleton instance
3. `mockRegister()` adds user to server's in-memory data and persists to... nowhere (server has no localStorage)
4. Client has its own `mockStorage` singleton initialized from browser localStorage
5. Client never sees the user created by the server

**The Fix:** Move registration to client-side in mock mode, so it uses the same MockStorage instance as login.

## Tasks

### Task 1: Fix registration to work client-side in mock mode

**File:** `app/register/page.tsx`

**Changes:**
1. Import `mockRegister` and `mockLogin` from `@/lib/mock-auth`
2. Import `useMockSession` from mock-session-provider
3. Add `USE_MOCK_DATA` check
4. In mock mode: call `mockRegister()` directly on client, then `mockLogin()` to create session, then redirect to home with welcome toast
5. In production mode: keep existing API call behavior

**Acceptance:**
- [ ] Registration in mock mode creates user in client-side storage
- [ ] User is auto-logged in after registration
- [ ] User redirected to home page
- [ ] Welcome toast shows "Welcome, [name]!"

### Task 2: Add specific error messages to login

**File:** `app/login/page.tsx`

**Changes:**
1. Update `mockLogin` to differentiate between "email not found" and "wrong password"
2. Show specific error messages inline with form

**Acceptance:**
- [ ] "Email not found" error when email doesn't exist
- [ ] "Wrong password" error when password is incorrect
- [ ] Errors appear inline in form

### Task 3: Update mockLogin to return specific errors

**File:** `lib/mock-auth.ts`

**Changes:**
1. Change `mockLogin` return type to `{ user: MockUser } | { error: 'EMAIL_NOT_FOUND' | 'WRONG_PASSWORD' }`
2. Check if email exists first, return specific error
3. Check password, return specific error
4. On success, store session and return user

**Acceptance:**
- [ ] Returns `{ error: 'EMAIL_NOT_FOUND' }` when email not in storage
- [ ] Returns `{ error: 'WRONG_PASSWORD' }` when password doesn't match
- [ ] Returns `{ user }` on success

### Task 4: Change session storage from localStorage to sessionStorage

**File:** `lib/mock-auth.ts`

**Changes:**
1. Replace `localStorage` with `sessionStorage` for mock session
2. Session now lasts until browser closes (per user decision)

**File:** `components/mock-session-provider.tsx`

**Changes:**
1. Update storage event listener to work with sessionStorage (note: sessionStorage doesn't fire storage events cross-tab, which is fine since sessions should be tab-isolated)

**Acceptance:**
- [ ] Session persists on page refresh
- [ ] Session clears when browser closes
- [ ] Multi-tab behavior: each tab has independent session (acceptable)

### Task 5: Add password show/hide toggle

**File:** `app/register/page.tsx`

**Changes:**
1. Add state for password visibility
2. Add eye icon button to toggle visibility
3. Change input type between "password" and "text"

**File:** `app/login/page.tsx`

**Changes:**
1. Same password visibility toggle

**Acceptance:**
- [ ] Eye icon toggles password visibility
- [ ] Password hidden by default
- [ ] Works on both login and register pages

### Task 6: Add welcome toast after registration

**File:** `app/register/page.tsx` (part of Task 1)

**Changes:**
1. After successful registration and auto-login, show toast "Welcome, [name]!"
2. Use existing toast/notification system if available, or add simple toast

**Acceptance:**
- [ ] Toast appears after successful registration
- [ ] Shows user's name
- [ ] Auto-dismisses after a few seconds

### Task 7: Add "Forgot password?" link to login page

**File:** `app/login/page.tsx`

**Changes:**
1. Add "Forgot password?" link below password field
2. Link to `/forgot-password` page

**Acceptance:**
- [ ] Link visible on login page
- [ ] Navigates to forgot password page

## Execution Order

```
Task 3 (mockLogin errors) → Task 2 (login error messages)
Task 4 (sessionStorage) → can run in parallel
Task 1 (register fix + auto-login + toast) → depends on Task 3
Task 5 (password toggle) → independent
Task 7 (forgot password link) → independent
```

**Recommended execution:**
1. Task 3 + Task 4 (parallel)
2. Task 1 + Task 2 (after Task 3)
3. Task 5 + Task 7 (parallel, anytime)

## Verification

After all tasks complete:
1. Start app with `USE_MOCK_DATA=true`
2. Go to `/register`, create new account
3. Verify auto-redirect to home page with welcome toast
4. Refresh page, verify still logged in
5. Sign out, go to `/login`
6. Try wrong email → should see "Email not found"
7. Try wrong password → should see "Wrong password"
8. Sign in with correct credentials → should work
9. Close browser, reopen → should be logged out

---
*Plan created: 2026-01-19*
