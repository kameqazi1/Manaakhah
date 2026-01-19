# External Integrations

**Analysis Date:** 2026-01-19

## APIs & External Services

**Email Service:**
- Resend - Transactional email delivery
  - SDK/Client: `resend` package
  - Auth: `RESEND_API_KEY` env var
  - Config: `FROM_EMAIL` env var for sender address
  - Implementation: `lib/email.ts`
  - Features: Verification emails, password reset, booking confirmations, review notifications

**Image Storage & CDN:**
- Cloudinary - Image upload, storage, and transformation
  - SDK/Client: `cloudinary` v2 package
  - Auth: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Implementation: `lib/cloudinary.ts`
  - Features: Auto-optimization, face-aware cropping for profiles, folder organization
  - Folders: `manakhaah/businesses/`, `manakhaah/profiles/`, `manakhaah/reviews/`

**Maps - Primary:**
- OpenStreetMap via Leaflet - Open-source mapping
  - SDK/Client: `leaflet`, `react-leaflet`, `leaflet.markercluster`
  - Auth: None required (free)
  - Tile Provider: CartoDB Positron tiles
  - Implementation: `components/map/LeafletMap.tsx`
  - Features: Business markers, clustering, radius circles, custom popups

**Maps - Optional:**
- Mapbox GL - Premium map alternative
  - SDK/Client: `mapbox-gl`
  - Auth: `NEXT_PUBLIC_MAPBOX_TOKEN` env var
  - Usage: Falls back to Leaflet if not configured

**Business Data Scraping (Optional):**
- Google Places API
  - Auth: `GOOGLE_PLACES_API_KEY` env var
  - Implementation: `lib/scraper/scraper.ts`
  - Features: Text search, place details, photos
  - Falls back to mock data if not configured

- Yelp Fusion API
  - Auth: `YELP_API_KEY` env var (Bearer token)
  - Implementation: `lib/scraper/scraper.ts`
  - Features: Business search, ratings, reviews
  - Falls back to mock data if not configured

## Data Storage

**Primary Database:**
- PostgreSQL
  - Connection: `DATABASE_URL` env var
  - Client: Prisma ORM via `@prisma/client`
  - Schema: `prisma/schema.prisma` (70+ models)
  - Implementation: `lib/prisma.ts` (singleton client)
  - Features: Full-text search via PostgreSQL, JSONB fields for flexible data

**Mock Data Storage:**
- In-memory JavaScript objects
  - Implementation: `lib/mock-data/client.ts`, `lib/mock-data/storage.ts`
  - Trigger: `USE_MOCK_DATA=true` env var
  - Scope: Development/demo without database

**File Storage:**
- Cloudinary (see Image Storage above)
- No local filesystem storage for uploads

**Caching:**
- None configured (potential for Redis/Vercel KV)
- React Query handles client-side caching

## Authentication & Identity

**Auth Framework:**
- NextAuth.js v5 (Auth.js)
  - Implementation: `lib/auth.ts`
  - Strategy: JWT sessions
  - Adapter: `@auth/prisma-adapter` for database persistence

**OAuth Providers:**
- Google OAuth
  - Config: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Features: Social login, email verification bypass

- Apple OAuth
  - Config: `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`
  - Features: Social login, email verification bypass

**Credentials Authentication:**
- Email/password via `bcryptjs` hashing
- Implementation: `lib/auth.ts` (Credentials provider)

**Two-Factor Authentication:**
- TOTP Authenticator Apps
  - Library: `otpauth` for TOTP generation/verification
  - Library: `qrcode` for setup QR codes
  - Implementation: `lib/auth/two-factor.ts`
  - Storage: `twoFactorSecret` in User model

- Backup Codes
  - Generated and hashed with bcrypt
  - Stored in `twoFactorBackupCodes` array

- SMS 2FA (Placeholder)
  - Implementation: `lib/auth/two-factor.ts` (sendTwoFactorSMS)
  - Status: Placeholder, needs Twilio or similar integration

- Email 2FA (Placeholder)
  - Implementation: `lib/auth/two-factor.ts` (sendTwoFactorEmail)
  - Status: Placeholder, could use existing Resend integration

## Monitoring & Observability

**Error Tracking:**
- None configured
- Console logging throughout codebase
- Potential: Sentry integration

**Logs:**
- Console.log statements in API routes and services
- No structured logging framework
- `ActivityLog` model stores user actions in database

**Analytics:**
- Custom analytics via `BusinessView` and `AnalyticsSnapshot` models
- Stores views, clicks, bookings, conversion rates
- Implementation: `app/api/business/[id]/analytics/route.ts`

## CI/CD & Deployment

**Hosting:**
- Designed for Vercel (Next.js optimized)
- Compatible with Railway, Render, or any Node.js host
- `next.config.js` configured for Cloudinary remote images

**CI Pipeline:**
- None detected in repository
- Scripts: `npm run build`, `npm run lint`

**Database Migrations:**
- Prisma Migrate via `npm run db:migrate`
- Development: `prisma migrate dev`
- Production: `prisma migrate deploy`

## Environment Configuration

**Required env vars for production:**
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@your-domain.com
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

**Optional env vars:**
```
GOOGLE_CLIENT_ID=...           # Google OAuth
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...            # Apple OAuth
APPLE_CLIENT_SECRET=...
NEXT_PUBLIC_MAPBOX_TOKEN=...   # Premium maps
GOOGLE_PLACES_API_KEY=...      # Business scraping
YELP_API_KEY=...               # Business scraping
```

**Development/Mock env vars:**
```
USE_MOCK_DATA=true             # Skip database
NEXT_PUBLIC_USE_MOCK_DATA=true # Client awareness
```

**Secrets location:**
- `.env.local` (gitignored)
- `.env.example` and `.env.local.example` for templates
- Production: Host environment variables (Vercel, etc.)

## Webhooks & Callbacks

**Incoming Webhooks:**
- None detected
- Potential for Stripe webhooks (payment processing not implemented)

**Outgoing Webhooks:**
- None detected

**Callback URLs:**
- `/api/auth/callback/google` - Google OAuth callback
- `/api/auth/callback/apple` - Apple OAuth callback
- Handled by NextAuth.js automatically

## Calendar Integration

**Google Calendar:**
- URL-based integration (no API)
- Implementation: `lib/services/calendar-sync.ts`
- Feature: Generate Google Calendar URLs for events/bookings

**Apple Calendar:**
- ICS file generation
- Implementation: `lib/services/calendar-sync.ts`
- Feature: Download .ics files for import

**Native API Integration:**
- Not implemented (URL/file approach used)
- `googleCalendarId` and `appleCalendarId` fields in Booking model suggest future API integration

## Push Notifications

**Browser Push:**
- Web Push API (mock implementation)
- Implementation: `lib/services/push-notifications.ts`
- Features: Permission requests, local notifications
- Storage: localStorage for preferences and subscriptions
- Status: Works for local notifications, server push not implemented

**Mobile Push:**
- Not implemented
- Would need Firebase Cloud Messaging or similar

## Third-Party Data Sources (Scraper)

**Implemented with API:**
- Google Places - Full integration with fallback
- Yelp Fusion - Full integration with fallback

**Implemented with Mock Data:**
- Zabihah.com - Mock data (no public API)
- HalalTrip - Mock data (no public API)
- Salaam Gateway - Mock data (business news)
- Muslim Pro - Mock data (masjid/restaurant finder)
- Yellow Pages - Mock data
- Better Business Bureau - Mock data

**Blocked/Restricted:**
- Facebook Pages - Requires app review
- Instagram - Requires approved access

---

*Integration audit: 2026-01-19*
