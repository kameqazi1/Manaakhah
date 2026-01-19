# Technology Stack

**Analysis Date:** 2026-01-19

## Languages

**Primary:**
- TypeScript 5.x - All application code, API routes, components
- JavaScript - Configuration files (`next.config.js`, `postcss.config.js`)

**Secondary:**
- SQL - Database queries via Prisma ORM
- CSS - Tailwind utility classes with custom animations

## Runtime

**Environment:**
- Node.js (version managed via project, supports Node 20+)
- Next.js 16.1.1 with App Router

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework with App Router
- React 19.2.3 - UI component library
- React DOM 19.2.3 - React rendering

**Authentication:**
- NextAuth.js 5.0.0-beta.30 - Authentication with JWT sessions
- @auth/prisma-adapter 2.11.1 - Database session persistence

**Styling:**
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- tailwindcss-animate 1.0.7 - Animation utilities
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 - Conditional class names
- tailwind-merge 3.4.0 - Merge Tailwind classes

**Data Fetching:**
- @tanstack/react-query 5.90.16 - Server state management

**Forms:**
- react-hook-form 7.70.0 - Form state management
- @hookform/resolvers 5.2.2 - Form validation resolvers
- zod 4.3.5 - Schema validation

**UI Components:**
- @radix-ui/react-dropdown-menu 2.1.16 - Accessible dropdown menus
- @radix-ui/react-tabs 1.1.13 - Accessible tabs
- lucide-react 0.562.0 - Icon library
- recharts 3.6.0 - Chart components

**Maps:**
- Leaflet 1.9.4 - Open-source map library (primary)
- react-leaflet 5.0.0 - React wrapper for Leaflet
- react-leaflet-cluster 4.0.0 - Marker clustering
- leaflet.markercluster 1.5.3 - Marker clustering plugin
- mapbox-gl 3.17.0 - Optional Mapbox integration

**Database:**
- Prisma 5.22.0 - ORM and database toolkit
- @prisma/client 5.22.0 - Database client

**Date/Time:**
- date-fns 4.1.0 - Date manipulation utilities

**Build/Dev:**
- ESLint 8.x - Linting with Next.js config
- tsx 4.21.0 - TypeScript execution for scripts
- PostCSS 8.x - CSS processing
- Autoprefixer 10.4.20 - CSS vendor prefixing

## Key Dependencies

**Critical:**
- `next` 16.1.1 - Core framework, drives routing and SSR
- `next-auth` 5.0.0-beta.30 - All authentication flows
- `@prisma/client` 5.22.0 - All database operations
- `zod` 4.3.5 - Request/response validation across all API routes

**Infrastructure:**
- `resend` 6.7.0 - Transactional email (verification, password reset, notifications)
- `cloudinary` 2.9.0 - Image upload and transformation
- `bcryptjs` 3.0.3 - Password hashing
- `jsonwebtoken` 9.0.3 - JWT token generation for 2FA

**2FA/Security:**
- `otpauth` 9.4.1 - TOTP code generation/verification
- `qrcode` 1.5.4 - QR code generation for authenticator apps

## Configuration

**Environment Variables:**
Required vars defined in `.env.example`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL for auth callbacks
- `NEXTAUTH_SECRET` - JWT signing secret
- `RESEND_API_KEY` - Email service API key
- `FROM_EMAIL` - Sender email address
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

Optional vars:
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox token (falls back to Leaflet)
- `GOOGLE_PLACES_API_KEY` - For scraper functionality
- `YELP_API_KEY` - For scraper functionality
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` - Apple OAuth
- `USE_MOCK_DATA` - Enable mock mode without database

**Build Configuration:**
- `next.config.js` - Next.js configuration, image remote patterns for Cloudinary
- `tsconfig.json` - TypeScript with ES2017 target, `@/*` path alias
- `tailwind.config.ts` - Tailwind with dark mode, custom color tokens
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer

**Database:**
- `prisma/schema.prisma` - PostgreSQL with 70+ models

## Platform Requirements

**Development:**
- Node.js 20+ recommended
- npm for package management
- PostgreSQL database (or use `USE_MOCK_DATA=true` for mock mode)

**Production:**
- PostgreSQL database (Supabase, Neon, or similar recommended)
- Cloudinary account for image uploads
- Resend account for transactional email
- Compatible with Vercel, Railway, or any Node.js hosting

**Mock Mode:**
- `USE_MOCK_DATA=true` enables running without database
- Uses in-memory data via `lib/mock-data/client.ts`
- All features work but data is not persisted

---

*Stack analysis: 2026-01-19*
