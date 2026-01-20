---
created: 2026-01-19T15:30
title: Verify Vercel deployment with production services
area: deployment
files:
  - lib/prisma.ts
  - lib/db.ts
  - lib/env.ts
---

## Problem

We fixed Vercel build failures by:
1. Removing top-level PrismaClient import (lazy-load via require)
2. Skipping env validation during Vercel builds
3. Adding TypeScript `any` annotations to fix implicit type errors

The build passes locally with `VERCEL=1 USE_MOCK_DATA=false`, but we need to verify:
- Vercel deployment actually succeeded
- App connects to Neon PostgreSQL at runtime
- Auth flows work with real database
- Email sending works with Resend

## Solution

1. Check Vercel dashboard for deployment status
2. Test signup/login flow on deployed URL
3. Verify database connection by checking if users can be created
4. Test forgot-password flow to verify Resend email delivery
5. If issues found, check Vercel function logs
