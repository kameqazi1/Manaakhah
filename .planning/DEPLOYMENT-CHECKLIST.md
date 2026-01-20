# Deployment Diagnostics & Security Checklist

**Generated:** 2026-01-19
**Environment:** Vercel Production

---

## 1. Diagnostics Summary

### Environment Configuration Status

| Check | Status | Notes |
|-------|--------|-------|
| `.env.local` gitignored | ✅ PASS | Line 29 in `.gitignore` |
| Mock mode controlled by env | ✅ PASS | `USE_MOCK_DATA` env var |
| MapTiler key is public | ⚠️ INFO | `NEXT_PUBLIC_*` keys are meant to be exposed |
| NEXTAUTH_SECRET | ⚠️ CHECK | Ensure production uses strong secret (not the dev placeholder) |

### Vercel Environment Variables Required

For production deployment, ensure these are set in Vercel dashboard:

```
USE_MOCK_DATA=false
NEXT_PUBLIC_USE_MOCK_DATA=false
DATABASE_URL=<production-postgres-url>
NEXTAUTH_SECRET=<strong-random-32+-char-secret>
NEXTAUTH_URL=<your-production-url>
RESEND_API_KEY=<your-resend-key>
FROM_EMAIL=<your-verified-email>
NEXT_PUBLIC_MAPTILER_KEY=<your-maptiler-key>
NEXT_PUBLIC_APP_URL=<your-production-url>
NEXT_PUBLIC_DEFAULT_LAT=37.5485
NEXT_PUBLIC_DEFAULT_LNG=-121.9886
NEXT_PUBLIC_DEFAULT_CITY=Fremont, CA
```

**Optional (enable when needed):**
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

---

## 2. Seed Data Assessment

### Files Containing Mock/Seed Data

| File | Purpose | Production Action |
|------|---------|-------------------|
| `lib/mock-data/seed-data.ts` | Mock mode development data | Safe - only used when `USE_MOCK_DATA=true` |
| `scripts/seed.ts` | Database seeding script | **DO NOT RUN IN PRODUCTION** |
| `lib/mock-auth.ts` | Mock authentication | Safe - only used when `USE_MOCK_DATA=true` |
| `lib/mock-data/client.ts` | Mock database client | Safe - only loaded in mock mode |

### Irrelevant Seed Data (Safe to Leave)

The seed data files are **development-only** and are never loaded in production mode because:

1. `lib/db.ts:18` checks `USE_MOCK_DATA === "true"` before loading mock client
2. Mock data is in-memory only, never touches production database
3. Production uses Prisma with real PostgreSQL

**Recommendation:** Leave seed data files as-is. They're essential for local development.

### Demo Credentials in Login Page

**Issue:** Login page shows demo account buttons when `NEXT_PUBLIC_USE_MOCK_DATA=true`

**Location:** `app/login/page.tsx:182-225`

**Production Action:**
- ✅ If `NEXT_PUBLIC_USE_MOCK_DATA=false` on Vercel → Demo buttons hidden
- ⚠️ Verify this env var is set correctly on Vercel

---

## 3. Web Scraping Data Checklist

### Data Sources to Scrape

| Source | Data Type | Fields to Extract | Priority |
|--------|-----------|-------------------|----------|
| Zabihah.com | Halal restaurants, markets | Name, address, phone, category, coordinates | HIGH |
| Google Maps | Muslim businesses | Name, address, hours, reviews, photos | HIGH |
| Yelp | Halal-tagged businesses | Name, address, ratings, photos | MEDIUM |
| Local masjid directories | Islamic centers | Name, address, prayer times, services | HIGH |
| Chamber of commerce | Muslim-owned businesses | Name, address, owner info | MEDIUM |

### Data Fields Required Per Business

```typescript
{
  name: string;              // Business name
  address: string;           // Street address
  city: string;              // City
  state: string;             // State (2-letter)
  zipCode: string;           // ZIP code
  latitude: number;          // GPS latitude
  longitude: number;         // GPS longitude
  phone?: string;            // Phone number
  email?: string;            // Email address
  website?: string;          // Website URL
  category: BusinessCategory; // HALAL_FOOD, MASJID, RESTAURANT, etc.
  description?: string;      // Business description
  hours?: OperatingHours;    // Hours of operation
  services?: string[];       // Services offered
  sourceUrl: string;         // Where data was scraped from
  confidence: number;        // 0-100 confidence it's Muslim/halal
  signals: string[];         // Why we think it's relevant
}
```

### Scraping Workflow

1. **Scrape** → Data stored in `ScrapedBusiness` table with `status: PENDING_REVIEW`
2. **Admin Review** → Admin reviews at `/admin/businesses/review-queue`
3. **Approve** → Creates real `Business` entry, or **Reject** with reason
4. **Verify** → Business owner can claim and verify their listing

### Existing Scraper Infrastructure

**API Endpoint:** `POST /api/admin/scraper/run`
- Requires admin authentication
- Returns scraped business data
- Stores in `scrapedBusinesses` table

**Admin Pages:**
- `/admin/businesses/scraper` - Run scraper
- `/admin/businesses/review-queue` - Review scraped data

---

## 4. Security Audit Results

### ✅ PASSED Checks

| Check | Details |
|-------|---------|
| Mock headers in production | Middleware logs warnings, real auth continues |
| Admin API protection | `checkAdminAuth()` returns `false` when not mock mode |
| Session validation | NextAuth handles real sessions in production |
| Environment secrets | `.env.local` gitignored |
| SQL injection | Prisma ORM with parameterized queries |
| XSS protection | Next.js escapes by default |

### ⚠️ WARNINGS (Review Required)

| Issue | Location | Risk | Recommendation |
|-------|----------|------|----------------|
| Demo accounts visible | `login/page.tsx:182-225` | LOW | Verify `NEXT_PUBLIC_USE_MOCK_DATA=false` |
| Auto-admin by email | `mock-auth.ts:78` | NONE | Only works in mock mode |
| MapTiler API key public | `.env.local:21` | LOW | Use domain restrictions on MapTiler dashboard |

### ✅ Production Auth Flow

When `USE_MOCK_DATA=false`:

1. **Login** → `POST /api/auth/login` → NextAuth validates against DB
2. **Session** → JWT stored in httpOnly cookie
3. **API Auth** → `checkAdminAuth()` returns `false` → Proper session check needed
4. **Mock headers** → Logged but ignored, real auth required

### Verified Security Measures

1. **Mock Header Protection** (`middleware.ts`)
   - Detects `x-user-id` and `x-user-role` headers in production
   - Logs security warnings with IP tracking
   - Does NOT block requests (security through obscurity)
   - Rate limits logging to prevent log flooding

2. **Admin Route Protection** (`api/admin/*/route.ts`)
   - `checkAdminAuth()` checks `isMockMode()` first
   - Returns `false` in production → 403 Forbidden
   - Real admin auth needs proper session validation

3. **Database Isolation**
   - Mock data never touches production DB
   - Prisma used for production queries
   - Connection string from env vars only

---

## 5. Post-Deployment Verification

### Manual Tests to Run

```bash
# 1. Verify mock mode is disabled
curl https://your-app.vercel.app/api/businesses | head

# 2. Test admin routes are protected (should return 403)
curl -X GET https://your-app.vercel.app/api/admin/users \
  -H "x-user-role: ADMIN"
# Expected: {"error":"Unauthorized"}

# 3. Test login page doesn't show demo accounts
# Visit /login and verify no "Demo Accounts" section

# 4. Test database connection
# Create an account and verify it persists
```

### Vercel Dashboard Checks

- [ ] Environment variables set correctly
- [ ] `USE_MOCK_DATA=false`
- [ ] `NEXT_PUBLIC_USE_MOCK_DATA=false`
- [ ] `DATABASE_URL` points to production database
- [ ] `NEXTAUTH_SECRET` is strong (32+ random chars)
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled (optional)

---

## 6. Known Limitations

1. **Admin Auth in Production**: Currently `checkAdminAuth()` returns `false` when not in mock mode. Production admin access requires implementing proper session-based admin verification.

2. **2FA Login Challenge**: Backend throws error but no UI catches it (documented in PROJECT.md)

3. **Leaflet Packages**: Still in bundle but unused (deferred cleanup to v1.2)

---

*Generated by deployment diagnostics - 2026-01-19*
