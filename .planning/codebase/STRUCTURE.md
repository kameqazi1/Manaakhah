# Codebase Structure

**Analysis Date:** 2026-01-19

## Directory Layout

```
Manaakhah/
├── app/                        # Next.js App Router pages and API routes
│   ├── api/                    # API route handlers
│   │   ├── admin/              # Admin-only endpoints (stats, users, moderation)
│   │   ├── auth/               # Authentication endpoints (login, register, verify)
│   │   ├── bookings/           # Booking management CRUD
│   │   ├── business/           # Business owner endpoints (analytics, deals)
│   │   ├── businesses/         # Public business endpoints (list, detail)
│   │   ├── community/          # Community posts and comments
│   │   ├── islamic/            # Prayer times, donations
│   │   ├── messages/           # Messaging system
│   │   ├── notifications/      # User notifications
│   │   ├── reviews/            # Review endpoints
│   │   ├── search/             # Search functionality
│   │   ├── upload/             # File uploads (Cloudinary)
│   │   └── user/               # User profile endpoints
│   ├── admin/                  # Admin dashboard pages
│   ├── bookings/               # User bookings page
│   ├── business/               # Business detail pages
│   ├── community/              # Community forum pages
│   ├── dashboard/              # Business owner dashboard
│   ├── favorites/              # User favorites page
│   ├── forum/                  # Forum pages
│   ├── login/                  # Login page
│   ├── messages/               # Messaging interface
│   ├── profile/                # User profiles
│   ├── register/               # Registration page
│   ├── search/                 # Search pages
│   ├── settings/               # User settings
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/                 # React components
│   ├── map/                    # Map components (MapLibreMap)
│   ├── notifications/          # Notification bell and list
│   ├── prayer-times/           # Prayer time widget
│   ├── reviews/                # Review components
│   ├── search/                 # Search UI (ViewToggle, filters)
│   ├── ui/                     # Shadcn/ui primitives
│   ├── header.tsx              # Main header with navigation
│   ├── providers.tsx           # NextAuth SessionProvider
│   ├── mock-session-provider.tsx # Mock auth context
│   ├── query-provider.tsx      # React Query provider
│   ├── role-switcher.tsx       # Dev tool for role switching
│   └── LanguageSwitcher.tsx    # Language selector
├── hooks/                      # Custom React hooks
│   └── useMapSearch.ts         # URL-synced business search
├── lib/                        # Shared utilities and services
│   ├── auth/                   # Auth utilities
│   │   └── two-factor.ts       # 2FA implementation
│   ├── i18n/                   # Internationalization
│   │   ├── translations.ts     # Translation strings (en, ar, ur)
│   │   └── LanguageContext.tsx # Language context provider
│   ├── mock-data/              # Mock data system
│   │   ├── client.ts           # Mock Prisma-like client
│   │   ├── storage.ts          # In-memory storage with localStorage
│   │   ├── types.ts            # Mock data types
│   │   └── seed-data.ts        # Initial mock data
│   ├── scraper/                # Business scraper
│   │   ├── scraper.ts          # Main scraper logic
│   │   ├── utils.ts            # Scraper utilities
│   │   └── types.ts            # Scraper types
│   ├── services/               # External service integrations
│   │   ├── calendar-sync.ts    # Google/Apple calendar integration
│   │   ├── push-notifications.ts # Push notification service
│   │   └── review-authenticity.ts # Review verification
│   ├── auth.ts                 # NextAuth configuration
│   ├── cloudinary.ts           # Image upload service
│   ├── constants.ts            # App constants (categories, tags)
│   ├── db.ts                   # Database client switcher
│   ├── email.ts                # Email service (Resend)
│   ├── mock-auth.ts            # Mock authentication helpers
│   ├── mock-session.ts         # Mock session utilities
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts                # General utilities (cn)
├── prisma/                     # Database schema
│   └── schema.prisma           # Prisma schema (1771 lines, 50+ models)
├── public/                     # Static assets
│   ├── icons/                  # App icons
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
├── scripts/                    # Utility scripts
│   └── seed.ts                 # Database seeding
├── types/                      # TypeScript declarations
│   └── next-auth.d.ts          # NextAuth type extensions
├── .planning/                  # Project planning docs
├── middleware.ts               # Security middleware
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router - all pages and API routes
- Contains: Page components (`page.tsx`), layouts (`layout.tsx`), API handlers (`route.ts`)
- Key files: `layout.tsx` (root layout), `page.tsx` (home), `globals.css`

**`app/api/`:**
- Purpose: Backend API endpoints organized by domain
- Contains: Route handlers exporting GET, POST, PUT, DELETE functions
- Subdirectories follow resource naming: `businesses/`, `bookings/`, `reviews/`
- Pattern: Each route.ts exports named HTTP method functions

**`app/admin/`:**
- Purpose: Admin dashboard pages
- Contains: Admin-only features (user management, business moderation, analytics)
- Access: Requires ADMIN role

**`app/dashboard/`:**
- Purpose: Business owner dashboard
- Contains: Business management, analytics, deals, services
- Access: Requires BUSINESS_OWNER role

**`components/`:**
- Purpose: Reusable React components
- Contains: UI primitives (`ui/`), feature components, providers
- Pattern: Components use "use client" if interactive

**`components/ui/`:**
- Purpose: Shadcn/ui primitive components
- Contains: Button, Card, Input, Label, Badge, Select, Textarea, Tabs, Dropdown
- Pattern: Styled with Tailwind CSS, variants via class-variance-authority

**`hooks/`:**
- Purpose: Custom React hooks for data fetching and state
- Contains: `useMapSearch.ts` for URL-synced business search
- Pattern: Combines React Query with URL state management

**`lib/`:**
- Purpose: Shared logic, services, and utilities
- Contains: Authentication, database access, external integrations, utilities
- Pattern: Each file exports functions/constants, no class-based services

**`lib/mock-data/`:**
- Purpose: Development without database dependency
- Contains: In-memory data client mimicking Prisma API
- Usage: Activated via `NEXT_PUBLIC_USE_MOCK_DATA=true` environment variable

**`lib/scraper/`:**
- Purpose: Aggregate Muslim business data from external sources
- Contains: Scraper logic, source adapters, confidence scoring utilities
- Sources: Google Places, Yelp, Zabihah, HalalTrip

**`prisma/`:**
- Purpose: Database schema and migrations
- Contains: `schema.prisma` defining all models, enums, relations
- Key models: User, Business, Review, Booking, Message, CommunityPost, Deal, Event

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout with providers and header
- `app/page.tsx`: Home page with hero, map, featured businesses
- `app/api/auth/[...nextauth]/route.ts`: NextAuth handlers
- `middleware.ts`: Security middleware for API requests

**Configuration:**
- `next.config.js`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS theming
- `tsconfig.json`: TypeScript paths (`@/` alias)
- `prisma/schema.prisma`: Database schema (1771 lines)
- `.env.local`: Environment variables (not committed)

**Core Logic:**
- `lib/auth.ts`: NextAuth configuration with Google, Apple, credentials providers
- `lib/db.ts`: Database client switcher (Prisma vs Mock)
- `lib/email.ts`: Email templates and sending via Resend
- `lib/constants.ts`: Business categories, tags, prayer times

**Data Access:**
- `lib/prisma.ts`: Prisma client singleton with lazy initialization
- `lib/mock-data/client.ts`: Mock database client
- `lib/mock-data/storage.ts`: localStorage-backed storage

**Authentication:**
- `lib/auth.ts`: NextAuth v5 configuration
- `lib/mock-auth.ts`: Mock authentication for development
- `lib/auth/two-factor.ts`: 2FA with TOTP/Email codes

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx`
- API Routes: `route.ts`
- Components: `PascalCase.tsx` (e.g., `BusinessMap.tsx`, `NotificationBell.tsx`)
- Utilities: `kebab-case.ts` (e.g., `mock-auth.ts`, `two-factor.ts`)
- Types: `types.ts` within feature directories
- Providers: `*-provider.tsx` or `*Provider.tsx`

**Directories:**
- Feature groups: `lowercase` (e.g., `bookings/`, `reviews/`, `admin/`)
- Dynamic routes: `[param]` (e.g., `[id]/`, `[...nextauth]/`)
- Component groups: `lowercase` (e.g., `ui/`, `map/`, `reviews/`)

**Variables/Functions:**
- Functions: `camelCase` (e.g., `fetchNearbyBusinesses`, `applyFilters`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `BUSINESS_TAGS`, `DISTANCE_OPTIONS`)
- Types/Interfaces: `PascalCase` (e.g., `Business`, `MockSession`, `MapSearchFilters`)
- API exports: Named HTTP methods (`GET`, `POST`, `PUT`, `DELETE`)

## Import Organization

**Order:**
1. React and Next.js imports (`import { useState } from "react"`, `import Link from "next/link"`)
2. Third-party libraries (`import { z } from "zod"`, `import bcrypt from "bcryptjs"`)
3. Internal components (`import { Button } from "@/components/ui/button"`)
4. Internal utilities (`import { db } from "@/lib/db"`)
5. Types (usually inline or at end)

**Path Aliases:**
- `@/` maps to project root (configured in `tsconfig.json`)
- Example: `@/components/ui/button` -> `components/ui/button`
- Example: `@/lib/db` -> `lib/db`

## Where to Add New Code

**New Page:**
- Create `app/[route-name]/page.tsx`
- Add layout if needed: `app/[route-name]/layout.tsx`
- Use "use client" only if page needs interactivity

**New API Endpoint:**
- Create `app/api/[resource]/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Use Zod for validation, `db` from `@/lib/db` for data access
- Check auth via headers in mock mode or NextAuth in production
- Add `export const dynamic = "force-dynamic"` for dynamic data

**New Component:**
- Add to `components/` or relevant subdirectory
- Use "use client" directive for interactive components
- Import UI primitives from `@/components/ui/`

**New Feature Component:**
- Create subdirectory in `components/[feature]/`
- Example: `components/events/EventCard.tsx`

**New Custom Hook:**
- Add to `hooks/` directory
- Name: `use[Feature].ts` (e.g., `useBookings.ts`)
- Pattern: Combine React Query + URL state if needed

**New Utility Function:**
- Add to existing file in `lib/` if related
- Create new `lib/[feature].ts` for new domains

**New Service Integration:**
- Add to `lib/services/[service-name].ts`
- Handle API keys via environment variables

**New Database Model:**
- Add to `prisma/schema.prisma`
- Add corresponding mock type in `lib/mock-data/types.ts`
- Add mock client methods in `lib/mock-data/client.ts`
- Run `npx prisma generate` after schema changes

## Special Directories

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (gitignored)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build` or `npm run dev`)
- Committed: No (gitignored)

**`.planning/`:**
- Purpose: Project planning and documentation
- Generated: No (manual)
- Committed: Yes
- Contains: Codebase analysis, milestones, phases, research

**`public/`:**
- Purpose: Static files served at root URL
- Contains: Icons, manifest.json, service worker
- Committed: Yes

**`prisma/`:**
- Purpose: Prisma ORM configuration
- Contains: Schema definition, migrations (not yet generated)
- Committed: Yes

---

*Structure analysis: 2026-01-19*
