# Web Scraping Guide for Business Discovery

## Overview

This guide explains how to ethically scrape public data to discover Muslim-owned businesses.

## Ethical Scraping Principles

### DO:
✅ Respect robots.txt
✅ Add rate limiting (1-2 seconds between requests minimum)
✅ Identify yourself with a proper User-Agent
✅ Only scrape publicly available data
✅ Cache results to avoid repeat scraping
✅ Follow terms of service
✅ Manually review all scraped data before publishing

### DON'T:
❌ Scrape private/gated content
❌ Overwhelm servers with rapid requests
❌ Ignore robots.txt
❌ Auto-publish scraped data
❌ Scrape copyrighted content (images, full descriptions)
❌ Bypass paywalls or authentication

---

## Recommended Sources

### 1. Zabihah.com
**Best for**: Halal restaurants, masjids
**Robots.txt**: Allowed
**Method**: Parse HTML listings
**Data available**:
- Business name
- Address
- Phone
- Category
- Description
- Reviews (for confidence scoring)

**Example scraper**:
```javascript
// Use Cheerio or Puppeteer
const response = await fetch('https://zabihah.com/browse/United-States/California/Fremont');
const $ = cheerio.load(response);

$('.business-listing').each((i, el) => {
  const name = $(el).find('.business-name').text();
  const address = $(el).find('.address').text();
  // ... extract data
});
```

### 2. Local Masjid Directories
**Best for**: Masjids, Islamic centers
**Sources**:
- IslamicFinder.org
- SalatTimes.com
- Local Islamic organization websites

**Example**: Bay Area Islamic Directory

### 3. Google Maps API (with limits)
**Best for**: Any business
**Method**: Google Places API (free tier: 2,500 requests/month)
**Advantages**:
- Official API (ethical)
- Rich data (photos, reviews, hours)
- Geolocation included

**Example**:
```javascript
const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=halal+restaurant+fremont+ca&key=YOUR_KEY`;
const response = await fetch(url);
const data = await response.json();
```

### 4. Yelp Fusion API
**Best for**: Restaurants, services
**Method**: Official API (free tier available)
**Advantages**:
- Legal and ethical
- Search by keywords
- Reviews for confidence scoring

### 5. Public Facebook Pages/Groups
**Best for**: Community-recommended businesses
**Method**: Manual collection (no scraping)
**Process**:
1. Join local Muslim community Facebook groups
2. Look for business recommendations
3. Manually collect names/addresses
4. Add to scraping queue for verification

---

## Implementation Options

### Option A: Manual Collection + Verification
**Recommended for MVP**

1. Create a Google Sheet
2. Manually add businesses from:
   - Zabihah.com listings
   - IslamicFinder masjid directory
   - Local community recommendations
3. Export CSV
4. Import to scraping queue
5. Admin reviews and approves

**Pros**: No legal concerns, high quality
**Cons**: Labor-intensive

### Option B: Ethical API-Based Scraping
**Recommended for scale**

1. Use official APIs:
   - Google Places API
   - Yelp Fusion API
2. Search with keywords:
   - "halal restaurant [city]"
   - "mosque [city]"
   - "zabihah [city]"
   - "muslim owned [service] [city]"
3. Analyze results for Muslim signals
4. Add to review queue
5. Admin approves

**Pros**: Scalable, legal
**Cons**: Requires API keys, rate limits

### Option C: Website Scraping (Use Cautiously)
**Only if allowed by robots.txt**

Example: Scraping Zabihah listings
```javascript
import puppeteer from 'puppeteer';
import { sleep } from './utils';

async function scrapeZabihah(city: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set user agent
  await page.setUserAgent('ManakhaahBot/1.0 (+https://manakhaah.com/bot)');

  await page.goto(`https://zabihah.com/browse/United-States/California/${city}`);

  const businesses = await page.$$eval('.listing-item', (items) =>
    items.map((item) => ({
      name: item.querySelector('.name')?.textContent,
      address: item.querySelector('.address')?.textContent,
      phone: item.querySelector('.phone')?.textContent,
      type: item.querySelector('.category')?.textContent,
    }))
  );

  await browser.close();

  // Rate limit
  await sleep(2000);

  return businesses;
}
```

---

## Scraping Workflow

```
1. DISCOVERY
   ↓
   Search public sources (API or manual)
   ↓
2. EXTRACTION
   ↓
   Extract: name, address, phone, website, description
   ↓
3. ANALYSIS
   ↓
   Analyze text for Muslim keywords
   Calculate confidence score
   Categorize business
   Extract services
   Suggest tags
   ↓
4. GEOCODING
   ↓
   Convert address to lat/lng (Mapbox API)
   ↓
5. QUEUE
   ↓
   Save to ScrapedBusinesses table
   Status: PENDING
   ↓
6. ADMIN REVIEW
   ↓
   Admin views in review queue
   ↓
   [Approve] → Becomes real Business listing
   [Reject] → Deleted
   [Flag] → Needs more verification
```

---

## Example Scrapers

### 1. Zabihah Scraper

```typescript
// scripts/scrapers/zabihah.ts
import cheerio from 'cheerio';
import { analyzeMuslimSignals, categorizeBusinessimport { db } from '@/lib/db';

export async function scrapeZabihah(city: string = 'Fremont') {
  const url = `https://zabihah.com/browse/United-States/California/${city}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ManakhaahBot/1.0 (+https://manakhaah.com/bot)',
    },
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  const businesses: any[] = [];

  $('.business-card').each((i, el) => {
    const name = $(el).find('.business-name').text().trim();
    const address = $(el).find('.address').text().trim();
    const description = $(el).find('.description').text().trim();
    const website = $(el).find('.website a').attr('href');
    const phone = $(el).find('.phone').text().trim();

    if (name && address) {
      const { score, signals } = analyzeMuslimSignals(description + ' ' + name);
      const category = categorizeBusiness(description, name);

      businesses.push({
        name,
        address,
        city: city,
        state: 'CA',
        zipCode: '', // Extract from address
        phone,
        website,
        description,
        category,
        signals,
        confidence: score,
        source: 'zabihah',
        sourceUrl: url,
      });
    }
  });

  return businesses;
}
```

### 2. Google Maps API Scraper

```typescript
// scripts/scrapers/google-maps.ts
import { analyzeMuslimSignals, categorizeBusiness } from './utils';

export async function scrapeGoogleMaps(query: string, location: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Google Maps API key required');

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&location=${location}&radius=16000&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  const businesses = data.results.map((place: any) => {
    const { score, signals } = analyzeMuslimSignals(
      place.name + ' ' + (place.types?.join(' ') || '')
    );

    return {
      name: place.name,
      address: place.formatted_address,
      city: extractCity(place.formatted_address),
      state: 'CA',
      zipCode: extractZip(place.formatted_address),
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      phone: place.phone_number || null,
      website: place.website || null,
      description: place.editorial_summary || '',
      category: categorizeBusiness(place.name, place.types?.join(' ') || ''),
      signals,
      confidence: score,
      source: 'google_maps',
      sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    };
  });

  return businesses;
}

// Example queries to run:
const queries = [
  'halal restaurant Fremont CA',
  'mosque Fremont CA',
  'masjid Fremont CA',
  'zabihah Fremont CA',
  'islamic center Fremont CA',
];
```

---

## Running Scrapers

### Manual Script

```bash
# Create a script
npm run scrape:zabihah

# Or run directly
node scripts/run-scraper.js zabihah fremont
```

### Automated (Future)

```typescript
// Cron job: Run weekly
import cron from 'node-cron';

// Every Sunday at 2am
cron.schedule('0 2 * * 0', async () => {
  console.log('Running weekly business discovery...');

  const cities = ['Fremont', 'San Jose', 'Oakland'];

  for (const city of cities) {
    const businesses = await scrapeZabihah(city);

    for (const biz of businesses) {
      await db.scrapedBusiness.create({ data: biz });
    }

    await sleep(5000); // Rate limit between cities
  }
});
```

---

## Legal & Safety Checklist

Before scraping any site:

- [ ] Check robots.txt (`/robots.txt`)
- [ ] Read Terms of Service
- [ ] Check for official API
- [ ] Add 2-second rate limiting
- [ ] Use identifiable User-Agent
- [ ] Cache results (don't re-scrape)
- [ ] Only scrape public data
- [ ] Manual review before publishing
- [ ] Respect "nofollow" and "noindex"
- [ ] Have a contact page for takedown requests

---

## Robots.txt Examples

### Allowed
```
User-agent: *
Allow: /
```

### Partially Allowed
```
User-agent: *
Allow: /browse
Disallow: /admin
Crawl-delay: 2
```

### Not Allowed
```
User-agent: *
Disallow: /
```

---

## Next Steps

1. **Start with Manual Collection** (safest, highest quality)
   - Export Zabihah listings manually
   - Import CSV to scraping queue

2. **Use Official APIs** (Google Places, Yelp)
   - Set up API keys
   - Build query-based discovery
   - Add to review queue

3. **Build Review UI** (Admin dashboard)
   - Display scraped businesses
   - Show confidence scores
   - Allow approve/reject/flag/edit

4. **Automate Gradually**
   - Start with small batches
   - Monitor quality
   - Adjust confidence thresholds
   - Scale up

---

## Resources

- **Cheerio**: HTML parsing - https://cheerio.js.org/
- **Puppeteer**: Headless browser - https://pptr.dev/
- **Google Places API**: https://developers.google.com/maps/documentation/places
- **Yelp Fusion API**: https://www.yelp.com/developers
- **robots.txt checker**: https://en.ryte.com/free-tools/robots-txt/

---

**Remember**: Quality > Quantity. Manual review is essential!
