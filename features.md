# Manaakhah - Features & Technical Documentation

## Overview

Manaakhah is a directory platform for Muslim-owned and halal-certified businesses. The platform includes web scraping capabilities to automatically discover and import businesses from various halal certification directories.

---

## Scraper System

### Architecture

The scraper system consists of:

1. **Scraper Sources** (`lib/scraper/sources/`) - Individual scrapers for each data source
2. **Orchestrator** (`lib/scraper/scraper.ts`) - Coordinates scraping, processing, and saving
3. **CLI Scripts** (`scripts/`) - Standalone scripts to run scrapers locally
4. **Admin UI** (`app/admin/businesses/scraper/`) - Web interface for triggering scrapers

### Implemented Scrapers

| Source | Type | Vercel Compatible | Description |
|--------|------|-------------------|-------------|
| **HFSAA** | Puppeteer (Browser) | No | Halal Food Standards Alliance of America |
| **HMS** | Puppeteer (Browser) | No | Halal Monitoring Services USA |
| **Zabihah** | Puppeteer (Browser) | No | Zabihah.com restaurant directory |
| **IFANCA** | Cheerio (Static) | Yes | IFANCA certified manufacturers |

### Scraper Types

#### BrowserScraperSource (Puppeteer)
- Used when JavaScript execution is required
- Supports lazy loading, infinite scroll, button clicks
- **Cannot run on Vercel** due to Chromium binary size (~130MB)

```typescript
// Example: lib/scraper/sources/hfsaa.ts
export class HFSAAScraperSource extends BrowserScraperSource {
  name = "hfsaa" as const;
  requiresBrowser = true;
  // Uses Puppeteer to click "Load More" buttons
}
```

#### StaticScraperSource (Cheerio)
- Used for static HTML parsing
- No JavaScript execution needed
- **Works on Vercel**

```typescript
// Example: lib/scraper/sources/ifanca.ts
export class IFANCAScraperSource extends StaticScraperSource {
  name = "ifanca" as const;
  requiresBrowser = false;
  // Parses HTML table directly
}
```

### CLI Scripts

Run scrapers locally (required for browser-based scrapers):

```bash
# HFSAA - All regions
npx tsx scripts/scrape-hfsaa.ts --verbose

# HFSAA - Specific state
npx tsx scripts/scrape-hfsaa.ts --state=CA --verbose

# HMS - All certified businesses
npx tsx scripts/scrape-hms.ts --verbose

# Zabihah - Specific city
npx tsx scripts/scrape-zabihah.ts --region="New York" --max-results=10 --verbose

# Check database status
npx tsx scripts/check-status.ts

# Batch approve/reject by source
npx tsx scripts/batch-approve-reject.ts
```

### Data Flow

```
Scrapers (CLI/API)
    ↓
ScrapedBusiness table (staging)
    ↓
Admin Review Queue (/admin/businesses/review-queue)
    ↓
Approve → Business table (production)
Reject → Marked as REJECTED
```

---

## Database Schema

### ScrapedBusiness Table

Staging table for scraped data before admin review:

```prisma
model ScrapedBusiness {
  id            String   @id @default(cuid())
  name          String
  address       String
  city          String
  state         String
  zipCode       String
  latitude      Float?
  longitude     Float?
  phone         String?
  email         String?
  website       String?
  category      BusinessCategory
  description   String?
  sourceUrl     String
  claimStatus   ClaimStatus @default(PENDING_REVIEW)
  scrapedAt     DateTime @default(now())
  reviewedAt    DateTime?
  metadata      Json?    // Contains: source, confidence, signals, etc.
}
```

### Business Table

Production table for approved businesses:

```prisma
model Business {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  description       String
  category          BusinessCategory
  address           String
  city              String
  state             String
  zipCode           String
  latitude          Float
  longitude         Float
  phone             String
  email             String?
  website           String?
  ownerId           String
  status            BusinessStatus
  verificationStatus VerificationStatus
  isScraped         Boolean  @default(false)
  scrapedBusinessId String?
  scrapedFrom       String?
  scrapedAt         DateTime?
  confidenceScore   Float?
}
```

### Claim Status Flow

```
PENDING_REVIEW → APPROVED → Creates Business entry
PENDING_REVIEW → REJECTED → No Business created
```

---

## Admin Management Systems

### 1. Review Queue (`/admin/businesses/review-queue`)

- Lists all scraped businesses by status
- Shows confidence score and validation flags
- Approve/Reject actions
- Filter by: Pending, Approved, Rejected, All

**API Endpoints:**
- `GET /api/admin/scraped-businesses` - List scraped businesses
- `PUT /api/admin/scraped-businesses/[id]` - Approve/Reject
- `PATCH /api/admin/scraped-businesses/[id]` - Edit details
- `DELETE /api/admin/scraped-businesses/[id]` - Delete

### 2. Scraper UI (`/admin/businesses/scraper`)

- Shows available data sources with implementation status
- IFANCA marked as "Ready" (works on Vercel)
- HFSAA, HMS, Zabihah marked as "Local CLI" (require local execution)
- Warning about Vercel limitations

### 3. Dashboard (`/admin`)

- Total businesses count
- Pending review count
- User statistics
- Review statistics

---

## Vercel Limitations

### Problem
Puppeteer-based scrapers don't work on Vercel serverless functions:
1. Chromium binary is ~130MB (exceeds function size limits)
2. Function timeout limits (10-60 seconds)
3. Missing system dependencies

### Solution
Run browser-based scrapers locally using CLI scripts:

```bash
# On your local machine with .env configured
npx tsx scripts/scrape-hfsaa.ts --verbose
npx tsx scripts/scrape-hms.ts --verbose
npx tsx scripts/scrape-zabihah.ts --verbose
```

Data is saved directly to the Neon PostgreSQL database and appears in the admin review queue.

---

## Environment Setup

### Required Environment Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
USE_MOCK_DATA=false
```

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run scrapers (requires DATABASE_URL in .env)
npx tsx scripts/scrape-hfsaa.ts --verbose
```

---

## Key Technical Decisions

### 1. Two-Stage Import Process
Scraped data goes to `ScrapedBusiness` first for admin review before being promoted to `Business` table. This prevents low-quality or incorrect data from appearing on the site.

### 2. Confidence Scoring
Each scraped business gets a confidence score based on:
- Presence of halal keywords
- Certification body recognition
- Data completeness

### 3. Geolocation
Addresses are geocoded using Nominatim (free, 1 request/second limit) and stored with lat/lng for map display.

### 4. Duplicate Detection
Before saving, scrapers check for duplicates by:
- Name similarity
- Address matching
- Phone number matching

---

## Data Statistics (Current)

| Metric | Count |
|--------|-------|
| Total Scraped | 849 |
| Pending Review | 763 |
| Approved | 48 |
| **By Source** | |
| - HMS | 606 |
| - HFSAA | 158 |
| - Zabihah | 35 |
| - Google Places | 30 |
| - Yelp | 20 |

---

## Known Issues & Lessons Learned

### 1. Owner ID Required for Business Creation
When approving a scraped business, a valid `ownerId` is required. The system now:
- Uses the admin user ID from request headers
- Falls back to finding any admin user
- Returns error if no admin exists

### 2. Slug Uniqueness
Business slugs must be unique. The system generates slugs like:
- `restaurant-name` (first occurrence)
- `restaurant-name-2` (subsequent)

### 3. HFSAA Regional Pages
Not all HFSAA regional pages have the Elfsight widget. Currently working:
- Bay Area (36 establishments)
- Chicago (115 establishments)
- Pennsylvania (8 establishments)

### 4. HMS Lazy Loading
HMS uses infinite scroll. The scraper:
1. Scrolls to trigger lazy loading
2. Waits for content to load
3. Extracts all visible establishments

### 5. Zabihah Geolocation
Zabihah.com uses browser geolocation to show nearby restaurants. The scraper:
1. Spoofs geolocation for 15 major US cities
2. Extracts JSON-LD structured data from detail pages

---

## File Structure

```
lib/scraper/
├── sources/
│   ├── base.ts          # Base classes (BrowserScraperSource, StaticScraperSource)
│   ├── hfsaa.ts         # HFSAA scraper
│   ├── hms.ts           # HMS scraper
│   ├── zabihah.ts       # Zabihah scraper
│   ├── ifanca.ts        # IFANCA scraper
│   └── index.ts         # Registry and exports
├── scraper.ts           # Main orchestrator
├── types.ts             # TypeScript types
├── utils.ts             # Utility functions
├── signals.ts           # Confidence scoring
├── validation.ts        # Data validation
└── import.ts            # CSV/JSON import

scripts/
├── scrape-hfsaa.ts      # HFSAA CLI
├── scrape-hms.ts        # HMS CLI
├── scrape-zabihah.ts    # Zabihah CLI
├── scrape-all.ts        # All scrapers
├── check-status.ts      # Database status
├── batch-approve-reject.ts # Batch operations
└── debug/               # Debug scripts

app/admin/
├── page.tsx                      # Dashboard
├── businesses/
│   ├── page.tsx                  # Business list
│   ├── review-queue/page.tsx     # Scraped review
│   └── scraper/page.tsx          # Scraper UI
└── ...

app/api/admin/
├── stats/route.ts                # Dashboard stats
├── scraped-businesses/
│   ├── route.ts                  # List/create
│   └── [id]/route.ts             # CRUD operations
└── scraper/run/route.ts          # Run scraper API
```

---

## Future Improvements

1. **Add more static scrapers** - Convert browser-based scrapers where possible
2. **Scheduled scraping** - Set up cron jobs for regular data refresh
3. **Bulk approval** - Allow approving multiple businesses at once
4. **Better duplicate detection** - Fuzzy matching for business names
5. **Source prioritization** - Prefer certified sources over community directories
