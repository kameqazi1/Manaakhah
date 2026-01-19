# Architecture

**Analysis Date:** 2025-01-19

## Pattern Overview

**Overall:** Next.js App Router with Server-Side Rendering and API Routes

**Key Characteristics:**
- Full-stack monolith using Next.js 14 App Router
- Server Components as default, Client Components marked with "use client"
- API Routes handle all backend logic (`/api/` directory)
- Dual-mode data layer supporting both Prisma (production) and Mock data (development)
- Session-based authentication with NextAuth (production) or Mock session (development)

## Layers

**Presentation Layer (Components):**
- Purpose: React UI components and page layouts
- Location: `components/`, `app/**/page.tsx`
- Contains: UI primitives (shadcn/ui), feature components, page layouts
- Depends on: UI primitives, hooks, context providers
- Used by: Next.js App Router pages

**API Layer (Route Handlers):**
- Purpose: RESTful API endpoints handling business logic
- Location: `app/api/**/route.ts`
- Contains: HTTP handlers (GET, POST, PUT, DELETE), request validation, response formatting
- Depends on: Database layer (`lib/db.ts`), utility functions (`lib/`)
- Used by: Frontend fetch calls, external clients

**Data Access Layer:**
- Purpose: Database operations abstraction supporting multiple backends
- Location: `lib/db.ts`, `lib/prisma.ts`, `lib/mock-data/`
- Contains: Database client instantiation, mock data client, storage helpers
- Depends on: Prisma ORM, in-memory mock storage
- Used by: API route handlers

**Authentication Layer:**
- Purpose: User authentication and session management
- Location: `lib/auth.ts`, `lib/mock-auth.ts`, `lib/auth/two-factor.ts`
- Contains: NextAuth configuration, 2FA logic, mock session management
- Depends on: Prisma, bcrypt, JWT
- Used by: API routes, client components via providers

**Service Layer:**
- Purpose: Business-specific services and integrations
- Location: `lib/services/`, `lib/scraper/`
- Contains: Email sending, push notifications, calendar sync, business scraper
- Depends on: External APIs (Resend, Google, Yelp)
- Used by: API route handlers

## Data Flow

**Page Request Flow:**

1. Browser requests a page (e.g., `/business/[id]`)
2. Next.js App Router matches route in `app/business/[id]/page.tsx`
3. Server Component fetches data directly or via API
4. Page renders with initial data (SSR)
5. Client-side hydration enables interactivity

**API Request Flow:**

1. Client makes fetch request to `/api/businesses`
2. Route handler in `app/api/businesses/route.ts` receives request
3. Handler checks authentication via headers (`x-user-id`, `x-user-role` in mock mode)
4. Handler validates request with Zod schema
5. Handler calls `db.business.findMany()` from `lib/db.ts`
6. `lib/db.ts` routes to either Prisma or Mock client based on `USE_MOCK_DATA`
7. Results returned as JSON response

**Authentication Flow (Mock Mode):**

1. User logs in via `/login` page
2. Mock login stores session in localStorage (`manakhaah-mock-session`)
3. `MockSessionProvider` reads session and provides via context
4. API requests include `x-user-id` and `x-user-role` headers
5. Route handlers extract auth info from headers

**State Management:**
- No global state library (Redux, Zustand)
- React Context for session (`MockSessionProvider`), language (`LanguageProvider`)
- URL state for search/filter parameters
- localStorage for mock session persistence

## Key Abstractions

**Database Client (`lib/db.ts`):**
- Purpose: Unified interface for data operations regardless of backend
- Examples: `lib/db.ts`, `lib/mock-data/client.ts`
- Pattern: Adapter pattern - same interface, different implementations
- Exports `db` object with Prisma-like API (findMany, create, update, delete)

**Mock Data System:**
- Purpose: Enable development without database
- Files: `lib/mock-data/client.ts`, `lib/mock-data/storage.ts`, `lib/mock-data/types.ts`, `lib/mock-data/seed-data.ts`
- Pattern: In-memory storage with Prisma-compatible interface
- Mimics Prisma API: `db.business.findMany()`, `db.user.create()`

**Session Management:**
- Purpose: Unified session access across auth modes
- Files: `lib/auth.ts` (NextAuth), `lib/mock-auth.ts`, `components/mock-session-provider.tsx`
- Pattern: Context provider with hooks (`useMockSession`, `useMockSignOut`)

**Business Scraper:**
- Purpose: Aggregate Muslim business data from multiple sources
- Files: `lib/scraper/scraper.ts`, `lib/scraper/utils.ts`, `lib/scraper/types.ts`
- Pattern: Multi-source aggregator with confidence scoring and deduplication

## Entry Points

**Application Entry:**
- Location: `app/layout.tsx`
- Triggers: Every page request
- Responsibilities: HTML structure, global providers (LanguageProvider, MockSessionProvider), Header, service worker registration

**Home Page:**
- Location: `app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Hero section, map display, featured businesses, community events

**API Entry (Businesses):**
- Location: `app/api/businesses/route.ts`
- Triggers: `GET /api/businesses`, `POST /api/businesses`
- Responsibilities: List businesses with filters, create new business

**Auth Entry:**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Triggers: NextAuth endpoints (`/api/auth/signin`, `/api/auth/callback`, etc.)
- Responsibilities: OAuth flow, credential auth, session management

## Error Handling

**Strategy:** Try-catch with JSON error responses

**Patterns:**
- API routes return `{ error: string }` with appropriate HTTP status
- Zod validation errors return 400 with `{ error: "Validation error", details: [...] }`
- Unauthorized requests return 401/403 with `{ error: "Unauthorized" }`
- Server errors return 500 with `{ error: "Failed to..." }` and console.error logging

**Example Pattern:**
```typescript
try {
  const validatedData = createBusinessSchema.parse(body);
  const business = await db.business.create({ data: validatedData });
  return NextResponse.json(business, { status: 201 });
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
  }
  console.error("Error creating business:", error);
  return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
}
```

## Cross-Cutting Concerns

**Logging:**
- `console.log` and `console.error` for development
- No structured logging library detected

**Validation:**
- Zod schemas for API request validation
- Defined inline in route handlers

**Authentication:**
- Header-based in mock mode (`x-user-id`, `x-user-role`)
- NextAuth JWT strategy in production mode
- Role-based access: CONSUMER, BUSINESS_OWNER, STAFF, MODERATOR, ADMIN, SUPER_ADMIN

**Internationalization:**
- `lib/i18n/translations.ts` with English, Arabic, Urdu
- `LanguageProvider` context for language switching
- RTL support for Arabic and Urdu

---

*Architecture analysis: 2025-01-19*
