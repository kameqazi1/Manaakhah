# Admin Dashboard & Web Scraper Guide

## Overview

The admin dashboard provides comprehensive tools for managing the Manakhaah platform, including business moderation, content management, user administration, and automated web scraping of Muslim-owned businesses.

## Access Requirements

**Login Credentials:**
- Email: `admin@example.com`
- Password: `password123`
- Role: ADMIN

**URL:** http://localhost:3000/admin

---

## Admin Dashboard Features

### 1. Business Management 🏪

#### Review Scraped Businesses
**URL:** `/admin/businesses/review-queue`

Review and approve businesses discovered by the web scraper:

**Features:**
- View pending, approved, and rejected businesses
- See complete business information (name, address, phone, website)
- View source URL where business was found
- Approve or reject with one click
- Auto-create business listings upon approval

**Actions:**
- **Approve:** Creates a published business listing
- **Reject:** Marks as rejected (won't create listing)
- **Filters:** PENDING_REVIEW, APPROVED, REJECTED, ALL

#### All Businesses
**URL:** `/admin/businesses`

View and manage all business listings on the platform.

#### Web Scraper
**URL:** `/admin/businesses/scraper`

Automated discovery of Muslim-owned businesses.

---

### 2. Content Moderation 🛡️

#### Flagged Reviews
**URL:** `/admin/reviews/flagged`

Review and moderate flagged user reviews.

**Actions:**
- Approve (keep published)
- Remove (hide from public)
- Contact reviewer
- Ban repeat offenders

#### Flagged Posts
**URL:** `/admin/posts/flagged`

Moderate flagged community posts.

#### All Reports
**URL:** `/admin/reports`

Central hub for all user-submitted reports.

---

### 3. User Management 👥

#### All Users
**URL:** `/admin/users`

View and manage all platform users.

**Capabilities:**
- View user profiles
- Change user roles
- Suspend accounts
- Reset passwords
- View user activity

#### Business Owners
**URL:** `/admin/users/business-owners`

Manage users with business owner role.

#### Suspended Users
**URL:** `/admin/users/suspended`

View and restore suspended accounts.

---

### 4. Analytics 📈

#### Platform Analytics
**URL:** `/admin/analytics`

**Metrics Displayed:**

**User Analytics:**
- Total consumers
- Total business owners
- Total admins

**Business Analytics:**
- Published businesses
- Draft businesses
- Pending approval
- Suspended businesses

**Review Analytics:**
- Published reviews
- Pending reviews
- Flagged reviews
- Removed reviews

**Booking Analytics:**
- Pending bookings
- Confirmed bookings
- Completed bookings
- Cancelled bookings
- Rejected bookings

**Engagement Metrics:**
- Total messages
- Community posts
- Flagged posts

#### Business Analytics
**URL:** `/admin/analytics/businesses`

Detailed business performance metrics.

#### User Engagement
**URL:** `/admin/analytics/engagement`

User activity and engagement patterns.

---

### 5. System Settings ⚙️

#### General Settings
**URL:** `/admin/settings`

Configure platform-wide settings.

#### Categories & Tags
**URL:** `/admin/categories`

Manage business categories and tags.

#### Notification Templates
**URL:** `/admin/notifications`

Configure email and notification templates.

---

### 6. Data Management 💾

#### Export Data
**URL:** `/admin/export`

Export platform data to CSV/JSON.

#### Import Data
**URL:** `/admin/import`

Bulk import businesses or users.

#### Backup & Restore
**URL:** `/admin/backup`

Create and restore database backups.

---

## Web Scraper System

### Overview

The web scraper automatically discovers Muslim-owned businesses from various online sources, respecting ethical scraping practices.

### Access

**URL:** `/admin/businesses/scraper`

### Supported Sources

1. **Google Places** (Recommended)
   - Most comprehensive data
   - Accurate location information
   - Business hours and contact details
   - User ratings (to be integrated)

2. **Yelp**
   - Business reviews and ratings
   - High-quality business descriptions
   - Category information

3. **Zabihah.com**
   - Community-maintained halal directory
   - Muslim business verification
   - Halal certification status

4. **Manual Entry**
   - Test mode with mock data
   - Quality assurance testing

### Configuration Options

#### Search Query
The main search term for finding businesses.

**Best Practices:**
```
✓ Good queries:
  - "halal restaurants fremont ca"
  - "muslim-owned grocery store"
  - "islamic center bay area"
  - "zabihah halal market"

✗ Avoid:
  - Too generic: "restaurants"
  - Too specific: "123 Main St halal"
  - Missing location: "halal food"
```

#### Location Parameters

**City:** e.g., "Fremont"
**State:** e.g., "CA"
**Zip Code:** e.g., "94536"
**Radius:** Search radius in miles (default: 10)

#### Category Selection

Choose the business category:
- Restaurant
- Halal Market
- Masjid
- Auto Repair
- Tutoring
- Health & Wellness
- Legal Services
- Real Estate
- Other

### Quick Presets

Pre-configured searches for common business types:

1. **Halal Restaurants**
   - Query: "halal restaurants fremont ca"
   - Category: RESTAURANT

2. **Halal Markets**
   - Query: "halal grocery store fremont ca"
   - Category: HALAL_MARKET

3. **Masjids**
   - Query: "islamic center mosque fremont ca"
   - Category: MASJID

4. **Halal Food Truck**
   - Query: "halal food truck bay area"
   - Category: RESTAURANT

5. **Muslim Tutoring**
   - Query: "islamic tutoring quran teacher fremont"
   - Category: TUTORING

### Scraping Process

1. **Configure Search**
   - Enter search query
   - Set location parameters
   - Select category
   - Choose data source

2. **Run Scraper**
   - Click "Start Scraping"
   - Wait for results (usually 5-30 seconds)
   - Review found businesses

3. **Review Results**
   - See number of businesses found
   - Preview business details
   - Check for duplicates

4. **Approve Businesses**
   - Navigate to Review Queue
   - Review each scraped business
   - Approve or reject

### Features

#### Duplicate Detection
- Automatically checks for existing businesses
- Compares name and address
- Prevents duplicate listings

#### Muslim Business Detection
- Keyword matching algorithm
- Detects: halal, muslim, islamic, masjid, zabihah, bismillah
- Pattern recognition for Muslim business names

#### Data Validation
- Validates addresses
- Geocodes locations (lat/lng)
- Normalizes phone numbers
- Validates website URLs

#### Metadata Tracking
- Source URL
- Scrape timestamp
- Search query used
- Confidence score

### Mock Scraper (Testing)

For testing purposes, the scraper generates realistic mock data:

**Generated Data Includes:**
- Business names (category-appropriate)
- Realistic addresses in specified city
- Phone numbers in local area code
- Plausible websites
- Category-specific descriptions
- Geocoded coordinates

**Example Mock Results:**
```
Halal Restaurants:
- Al-Noor Mediterranean Grill
- Bismillah Kabob House
- Crescent Moon Cafe

Halal Markets:
- Barakah Halal Market
- Al-Madina Grocery
- Crescent Foods

Masjids:
- Fremont Islamic Center
- Bay Area Masjid
- Al-Rahman Mosque
```

---

## API Endpoints

### Admin Stats
```http
GET /api/admin/stats
Headers: x-user-id, x-user-role: ADMIN

Response:
{
  "stats": {
    "totalBusinesses": 10,
    "pendingBusinesses": 3,
    "totalUsers": 50,
    "totalReviews": 25,
    "flaggedReviews": 2,
    "totalBookings": 15,
    "totalMessages": 100,
    "communityPosts": 20,
    "flaggedPosts": 1,
    "usersByRole": { ... },
    "businessesByStatus": { ... },
    "reviewsByStatus": { ... },
    "bookingsByStatus": { ... }
  }
}
```

### Scraped Businesses
```http
GET /api/admin/scraped-businesses?claimStatus=PENDING_REVIEW
Headers: x-user-id, x-user-role: ADMIN

Response:
{
  "businesses": [
    {
      "id": "scraped-1",
      "name": "Al-Noor Market",
      "category": "HALAL_MARKET",
      "address": "123 Main St",
      "city": "Fremont",
      "state": "CA",
      "claimStatus": "PENDING_REVIEW",
      "sourceUrl": "https://...",
      "scrapedAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

### Update Scraped Business
```http
PUT /api/admin/scraped-businesses/scraped-1
Headers: x-user-id, x-user-role: ADMIN
Body: { "claimStatus": "APPROVED" }

Response:
{
  "message": "Business approved and created",
  "business": { ... },
  "scrapedBusiness": { ... }
}
```

### Run Scraper
```http
POST /api/admin/scraper/run
Headers: x-user-id, x-user-role: ADMIN

Body:
{
  "searchQuery": "halal restaurants fremont ca",
  "city": "Fremont",
  "state": "CA",
  "zipCode": "94536",
  "radius": 10,
  "category": "RESTAURANT",
  "source": "google"
}

Response:
{
  "success": true,
  "businessesFound": 3,
  "businesses": [ ... ],
  "errors": []
}
```

---

## Testing the Admin Features

### Test Scenario 1: Web Scraping

1. Login as admin
2. Navigate to `/admin/businesses/scraper`
3. Use preset: "Halal Restaurants"
4. Click "Start Scraping"
5. Review found businesses
6. Go to Review Queue
7. Approve/reject businesses

### Test Scenario 2: Business Approval

1. Navigate to `/admin/businesses/review-queue`
2. Filter by "Pending Review"
3. Click on a business
4. Review details
5. Click "Approve" or "Reject"
6. Verify status changes

### Test Scenario 3: Analytics Review

1. Navigate to `/admin/analytics`
2. Review user statistics
3. Check business breakdowns
4. Monitor engagement metrics
5. Identify trends

---

## Best Practices

### Web Scraping
- ✓ Use specific search queries
- ✓ Include location information
- ✓ Review before approving
- ✓ Verify contact information
- ✓ Check for duplicates manually

### Content Moderation
- ✓ Review flagged content promptly
- ✓ Apply consistent moderation standards
- ✓ Provide feedback to users when appropriate
- ✓ Document moderation decisions

### User Management
- ✓ Verify business ownership before role changes
- ✓ Investigate before suspending accounts
- ✓ Maintain communication logs
- ✓ Respect user privacy

---

## Troubleshooting

### Scraper Issues

**Problem:** No businesses found
**Solution:**
- Check search query specificity
- Verify location parameters
- Try different data source
- Use preset queries

**Problem:** Duplicate businesses
**Solution:**
- Check existing listings first
- Review address matching
- Verify business name variations

**Problem:** Incorrect geocoding
**Solution:**
- Verify address format
- Check city/state/zip
- Manual coordinate adjustment if needed

### Permission Issues

**Problem:** Cannot access admin dashboard
**Solution:**
- Verify role is ADMIN
- Check session/authentication
- Use role switcher if in mock mode

---

## Future Enhancements

Planned features for production:

1. **Real API Integration**
   - Google Places API
   - Yelp Fusion API
   - Custom web scraping

2. **Advanced Analytics**
   - Real-time dashboards
   - Trend analysis
   - Predictive insights

3. **Automated Moderation**
   - AI-powered content filtering
   - Spam detection
   - Sentiment analysis

4. **Bulk Operations**
   - Batch approve/reject
   - CSV import/export
   - Bulk user management

5. **Audit Logs**
   - Track all admin actions
   - User activity monitoring
   - Change history

---

## Summary

The admin dashboard provides comprehensive tools for:

✅ **Business Management** - Scraping, review, approval
✅ **Content Moderation** - Reviews, posts, reports
✅ **User Administration** - Roles, permissions, suspension
✅ **Analytics** - Platform metrics and insights
✅ **System Configuration** - Settings and data management

All features are fully functional in mock mode and ready for testing!
