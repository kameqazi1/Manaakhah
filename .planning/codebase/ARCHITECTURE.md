# Architecture

**Analysis Date:** 2026-01-19

## Pattern Overview

**Overall:** Next.js App Router with Dual-Mode Data Layer (Mock/Prisma)

**Key Characteristics:**
- File-system based routing using Next.js 14+ App Router
- Server/Client component split with explicit "use client" directives
- Dual data layer supporting mock mode (localStorage) and production mode (PostgreSQL/Prisma)
- JWT-based authentication via NextAuth v5 with credential and OAuth providers
- React Query for client-side data fetching and caching
- Context-based state management for session, language, and queries

## Layers

**Presentation Layer:**
- Purpose: Renders UI and handles user interactions
- Location: `app/` (pages) and `components/` (reusable UI)
- Contains: React components, page layouts, client-side hooks
- Depends on: API routes, hooks, context providers
- Used by: End users via browser

**API Layer:**
- Purpose: Handles HTTP requests, validates input, orchestrates data operations
- Location: `app/api/`
- Contains: Route handlers (GET, POST, PUT, DELETE)
- Depends on: Database layer (`lib/db.ts`), auth layer (`lib/auth.ts`)
- Used by: Presentation layer via fetch/React Query

**Database Layer:**
- Purpose: Abstracts data persistence with Prisma or mock storage
- Location: `lib/db.ts`, `lib/prisma.ts`, `lib/mock-data/`
- Contains: Database client proxy, mock implementations, seed data
- Depends on: Prisma ORM or localStorage
- Used by: API layer

**Authentication Layer:**
- Purpose: Manages user identity, sessions, and authorization
- Location: `lib/auth.ts`, `lib/mock-auth.ts`, `lib/auth/two-factor.ts`
- Contains: NextAuth configuration, 2FA logic, session management
- Depends on: Database layer, bcrypt, JWT
- Used by: API routes, middleware, components

**Services Layer:**
- Purpose: Business logic for specific features
- Location: `lib/services/`
- Contains: Push notifications, review authenticity, calendar sync
- Depends on: External APIs (Cloudinary, email services)
- Used by: API routes

## Data Flow

**Business Search Flow:**

1. User enters search criteria on `/search` page (`app/search/page.tsx`)
2. `useMapSearch` hook (`hooks/useMapSearch.ts`) parses filters from URL and calls `/api/businesses`
3. API route (`app/api/businesses/route.ts`) queries `db.business.findMany`
4. `db` proxy (`lib/db.ts`) lazily initializes mock or Prisma client based on `USE_MOCK_DATA`
5. Results returned with distance calculation if location provided
6. React Query caches response, component renders business cards

**Authentication Flow:**

1. User submits credentials to `/api/auth/login/route.ts`
2. In mock mode: validates against `mockStorage.getUsers()` via `lib/mock-data/client.ts`
3. In production mode: NextAuth credential provider validates via `lib/auth.ts` with Prisma
4. If 2FA enabled: returns temp token, requires code verification via `lib/auth/two-factor.ts`
5. JWT issued with user ID and role, stored in session cookie
6. `MockSessionProvider` or NextAuth `SessionProvider` exposes session to components

**State Management:**
- URL: Search filters synced to URL params via `useMapSearch` hook
- Session: Mock session in `sessionStorage`, real session via NextAuth JWT
- Mock Data: Persisted to `localStorage` via `mockStorage`
- Server Cache: React Query with 30s stale time
- Language: Stored in `localStorage`, managed by `LanguageContext`

## Key Abstractions

**Database Client (`db`):**
- Purpose: Provides unified API for both mock and Prisma modes
- Location: `lib/db.ts`
- Pattern: Proxy pattern with lazy initialization to avoid build-time DB connections

**Mock Database (`mockDb`):**
- Purpose: Simulates Prisma API for offline development
- Location: `lib/mock-data/client.ts`
- Pattern: In-memory CRUD operations with localStorage persistence

**Session Providers:**
- Purpose: Expose authenticated user state to components
- Mock: `components/mock-session-provider.tsx`
- Production: `components/providers.tsx`
- Pattern: React Context with hooks

**Custom Hooks:**
- Purpose: Encapsulate data fetching and URL state management
- Location: `hooks/useMapSearch.ts`
- Pattern: Combines React Query, URL params, and business logic

## Entry Points

**Application Root:**
- Location: `app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Provider wrapping, Header, service worker

**API Routes:**
- Location: `app/api/**/route.ts`
- Triggers: HTTP requests to `/api/*`
- Responsibilities: CRUD operations, validation, authorization

**Middleware:**
- Location: `middleware.ts`
- Triggers: All `/api/*` requests
- Responsibilities: Security logging for mock header injection

**NextAuth Handler:**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Triggers: Auth-related requests
- Responsibilities: OAuth and credentials authentication

## Error Handling

**Strategy:** Try-catch with JSON error responses and console logging

**Patterns:**
- Zod validation errors return 400
- Unauthorized requests return 401/403
- Server errors return 500 with console.error logging
- Middleware logs but never rejects requests

## Cross-Cutting Concerns

**Logging:** Console-based with activity logs in database
**Validation:** Zod schemas in API routes
**Authentication:** Header-based (mock) or NextAuth JWT (production)
**Internationalization:** LanguageProvider with RTL support

---

*Architecture analysis: 2026-01-19*
