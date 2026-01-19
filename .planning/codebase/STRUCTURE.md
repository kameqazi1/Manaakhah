# Codebase Structure

**Analysis Date:** 2025-01-19

## Directory Layout

```
Manaakhah/
├── app/                        # Next.js App Router pages and API routes
│   ├── api/                    # API route handlers
│   │   ├── admin/              # Admin-only endpoints
│   │   ├── auth/               # Authentication endpoints
│   │   ├── bookings/           # Booking management
│   │   ├── business/           # Business owner endpoints
│   │   ├── businesses/         # Public business endpoints
│   │   ├── community/          # Community posts/comments
│   │   ├── islamic/            # Prayer times, donations
│   │   ├── messages/           # Messaging system
│   │   ├── notifications/      # User notifications
│   │   ├── reviews/            # Review endpoints
│   │   ├── search/             # Search functionality
│   │   ├── upload/             # File uploads
│   │   └── user/               # User profile endpoints
│   ├── admin/                  # Admin dashboard pages
│   ├── bookings/               # User bookings page
│   ├── business/               # Business detail pages
│   ├── community/              # Community forum
│   ├── dashboard/              # Business owner dashboard
│   ├── favorites/              # User favorites
│   ├── forum/                  # Forum pages
│   ├── login/                  # Login page
│   ├── messages/               # Messaging interface
│   ├── profile/                # User profiles
│   ├── register/               # Registration page
│   ├── search/                 # Search pages
│   ├── settings/               # User settings
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/                 # React components
│   ├── map/                    # Map-related components
│   ├── notifications/          # Notification components
│   ├── prayer-times/           # Prayer time widget
│   ├── reviews/                # Review components
│   ├── ui/                     # Shadcn/ui primitives
│   ├── header.tsx              # Main header component
│   ├── providers.tsx           # NextAuth provider
│   ├── mock-session-provider.tsx # Mock auth provider
│   ├── role-switcher.tsx       # Dev tool for role switching
│   └── LanguageSwitcher.tsx    # Language selector
├── lib/                        # Shared utilities and services
│   ├── auth/                   # Auth utilities
│   │   └── two-factor.ts       # 2FA implementation
│   ├── i18n/                   # Internationalization
│   │   ├── translations.ts     # Translation strings
│   │   └── LanguageContext.tsx # Language context
│   ├── mock-data/              # Mock data system
│   │   ├── client.ts           # Mock Prisma-like client
│   │   ├── storage.ts          # In-memory storage
│   │   ├── types.ts            # Mock data types
│   │   └── seed-data.ts        # Initial mock data
│   ├── scraper/                # Business scraper
│   │   ├── scraper.ts          # Main scraper logic
│   │   ├── utils.ts            # Scraper utilities
│   │   └── types.ts            # Scraper types
│   ├── services/               # External service integrations
│   │   ├── calendar-sync.ts    # Calendar integration
│   │   ├── push-notifications.ts # Push notification service
│   │   └── review-authenticity.ts # Review verification
│   ├── auth.ts                 # NextAuth configuration
│   ├── cloudinary.ts           # Image upload service
│   ├── constants.ts            # App constants
│   ├── db.ts                   # Database client switcher
│   ├── email.ts                # Email service (Resend)
│   ├── mock-auth.ts            # Mock authentication
│   ├── mock-session.ts         # Mock session utilities
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts                # General utilities
├── prisma/                     # Database schema
│   └── schema.prisma           # Prisma schema definition
├── public/                     # Static assets
├── scripts/                    # Utility scripts
│   └── seed.ts                 # Database seeding
├── types/                      # TypeScript declarations
│   └── next-auth.d.ts          # NextAuth type extensions
├── .env.local                  # Local environment variables
├── .env.example                # Environment variable template
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
- Pattern: Components are client components if interactive, otherwise server components

**`components/ui/`:**
- Purpose: Shadcn/ui primitive components
- Contains: Button, Card, Input, Label, Badge, Select, Textarea, Tabs, Dropdown
- Pattern: Styled with Tailwind CSS, variants via class-variance-authority

**`lib/`:**
- Purpose: Shared logic, services, and utilities
- Contains: Authentication, database access, external integrations, utilities
- Pattern: Each file exports functions/constants, no class-based services

**`lib/mock-data/`:**
- Purpose: Development without database dependency
- Contains: In-memory data client mimicking Prisma API
- Usage: Activated via `USE_MOCK_DATA=true` environment variable

**`lib/scraper/`:**
- Purpose: Aggregate Muslim business data from external sources
- Contains: Scraper logic, source adapters, confidence scoring utilities
- Sources: Google Places, Yelp, Zabihah, HalalTrip, and more

**`prisma/`:**
- Purpose: Database schema and migrations
- Contains: `schema.prisma` defining all models, enums, relations
- Key models: User, Business, Review, Booking, Message, CommunityPost

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout with providers and header
- `app/page.tsx`: Home page with hero, map, featured businesses
- `app/api/auth/[...nextauth]/route.ts`: NextAuth handlers

**Configuration:**
- `next.config.js`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS theming
- `tsconfig.json`: TypeScript paths and settings
- `prisma/schema.prisma`: Database schema (1700+ lines)
- `.env.local`: Environment variables

**Core Logic:**
- `lib/auth.ts`: NextAuth configuration with providers and callbacks
- `lib/db.ts`: Database client switcher (Prisma vs Mock)
- `lib/email.ts`: Email templates and sending via Resend
- `lib/scraper/scraper.ts`: Business scraping orchestration

**Testing:**
- No test files detected in current structure

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx`
- API Routes: `route.ts`
- Components: `PascalCase.tsx` (e.g., `BusinessMap.tsx`, `NotificationBell.tsx`)
- Utilities: `kebab-case.ts` (e.g., `mock-auth.ts`, `two-factor.ts`)
- Types: `types.ts` within feature directories

**Directories:**
- Feature groups: `lowercase` (e.g., `bookings/`, `reviews/`, `admin/`)
- Dynamic routes: `[param]` (e.g., `[id]/`, `[...nextauth]/`)
- Component groups: `lowercase` (e.g., `ui/`, `map/`, `reviews/`)

**Variables/Functions:**
- Functions: `camelCase` (e.g., `fetchNearbyBusinesses`, `applyFilters`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `BUSINESS_TAGS`, `CATEGORIES`)
- Types/Interfaces: `PascalCase` (e.g., `Business`, `MockSession`)
- API routes export: Named functions matching HTTP methods (`GET`, `POST`, `PUT`, `DELETE`)

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

**New Component:**
- Add to `components/` or relevant subdirectory
- Use "use client" directive for interactive components
- Import UI primitives from `components/ui/`

**New Feature Component:**
- Create subdirectory in `components/[feature]/`
- Example: `components/events/EventCard.tsx`

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

**`public/`:**
- Purpose: Static files served at root URL
- Contains: Icons, manifest.json, service worker
- Committed: Yes

**`prisma/`:**
- Purpose: Prisma ORM configuration
- Contains: Schema definition, migrations (not yet generated)
- Committed: Yes

---

*Structure analysis: 2025-01-19*
