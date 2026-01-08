# Manakhaah - Mock Mode Development Guide

## Overview

Mock Mode allows you to run Manakhaah **completely locally** without:
- PostgreSQL database
- Prisma
- NextAuth
- Any third-party APIs

All data is stored in-memory (localStorage) and resets when you clear your browser.

---

## Quick Start

### 1. Verify Mock Mode is Enabled

Check `.env.local`:
```env
USE_MOCK_DATA=true
NEXT_PUBLIC_USE_MOCK_DATA=true
```

### 2. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. You're Ready!

No database setup needed. The app will use mock data stored in your browser.

---

## Pre-loaded Mock Data

When you start in mock mode, you get:

### Users (3 pre-loaded)
1. **Consumer**: consumer@test.com / password123
2. **Business Owner**: owner@test.com / password123
3. **Admin**: admin@test.com / password123

### Businesses (3 pre-loaded)
1. **Al-Noor Halal Market** (Published) - Halal food store
2. **Islamic Center of Fremont** (Published) - Masjid
3. **Bay Area Auto Repair** (Pending Review) - Auto repair shop

### Reviews (2 pre-loaded)
- 5-star review on Al-Noor Market
- 5-star review on Islamic Center

### Scraped Businesses (3 in queue)
1. **Zabiha Halal Restaurant** - PENDING (ready to review)
2. **Masjid Warithuddin Mohammed** - PENDING
3. **Ahmed's Barber Shop** - FLAGGED (needs verification)

---

## Testing User Flows

### Flow 1: Consumer Experience

1. Go to homepage (or use role switcher to switch to Consumer)
2. Click "Find Services"
3. Browse businesses
4. Click on a business to see details
5. View reviews
6. Click "Call Now" or "Get Directions"

### Flow 2: Business Owner Experience

1. Use role switcher to become "Business Owner"
2. Go to Dashboard
3. Click "Create New Listing"
4. Fill in business details
5. Submit → Status will be "Pending Review"
6. View your listings in dashboard

### Flow 3: Admin Moderation

1. Use role switcher to become "Admin"
2. Go to `/admin/review-queue` (we'll create this)
3. See list of scraped businesses
4. For each business:
   - View details and confidence score
   - See signals (keywords found)
   - Edit if needed
   - Approve → becomes real listing
   - Reject → removed from queue
   - Flag → mark for further verification

---

## Role Switcher (Bottom-Right Corner)

In mock mode, you'll see a yellow badge at the bottom-right:

🎭 **Mock Mode (CONSUMER)**

Click it to:
- Switch between Consumer / Business Owner / Admin instantly
- Reset all data (clear localStorage)
- See current logged-in user

This allows rapid testing without logging in/out.

---

## File Structure

```
lib/
├── mock-data/
│   ├── types.ts          # TypeScript types (mirrors Prisma)
│   ├── seed-data.ts      # Initial mock data
│   ├── storage.ts        # localStorage manager
│   └── client.ts         # Mock DB client (mimics Prisma API)
├── db.ts                 # Switches between Prisma/Mock
├── mock-auth.ts          # Mock authentication
└── ...

components/
├── role-switcher.tsx     # UI for switching roles
├── mock-session-provider.tsx  # Session management
└── ...

app/api/
├── auth/
│   ├── register/route.ts  # Mock-aware registration
│   └── login/route.ts     # Mock-aware login
├── businesses/
│   └── route.ts           # Mock-aware CRUD
└── scraped/
    └── route.ts           # Scraped business API (new)
```

---

## Data Persistence

Mock data is stored in **localStorage**:
- Key: `manakhaah-mock-data`
- Key: `manakhaah-mock-session`

### To Reset Data

1. Click role switcher → "Reset All Data"
2. Or: `localStorage.clear()` in console
3. Or: Clear browser data

### Data Survives Page Refresh

Yes! Mock data persists across page refreshes (until you clear it).

---

## API Endpoints (Mock-Aware)

All API routes automatically detect mock mode:

### Authentication
- POST `/api/auth/register` - Create new user
- POST `/api/auth/login` - Login (no NextAuth needed)

### Businesses
- GET `/api/businesses` - List businesses (supports filters)
- POST `/api/businesses` - Create business
- GET `/api/businesses/:id` - Get single business
- PUT `/api/businesses/:id` - Update business
- DELETE `/api/businesses/:id` - Delete business

### Scraped Businesses (New)
- GET `/api/scraped` - List scraped businesses
- POST `/api/scraped` - Add scraped business
- PUT `/api/scraped/:id` - Update status (approve/reject/flag)
- DELETE `/api/scraped/:id` - Delete scraped business

### Reviews (Coming)
- POST `/api/businesses/:id/reviews` - Add review

---

## Testing Scraped Business Flow

### 1. View Scraped Queue (Admin Only)

```
/admin/review-queue
```

You'll see:
- **Zabiha Halal Restaurant** (95% confidence)
- **Masjid Warithuddin Mohammed** (100% confidence)
- **Ahmed's Barber Shop** (70% confidence - FLAGGED)

### 2. Review a Business

Click on a scraped business to see:
- Full details
- Confidence score
- Signals found ("zabiha", "halal", "muslim owner mention")
- Source (Google Maps, Yelp, Zabihah)

### 3. Take Action

- **Approve**: Converts scraped business → real Business listing
- **Reject**: Removes from queue permanently
- **Flag**: Mark for further verification
- **Edit**: Modify details before approval

---

## Adding Your Own Mock Data

Edit `lib/mock-data/seed-data.ts`:

```typescript
export const initialMockData: MockDatabase = {
  users: [
    // Add more users here
  ],
  businesses: [
    // Add more businesses here
  ],
  scrapedBusinesses: [
    // Add scraped businesses here
  ],
  // ...
};
```

Refresh the page → new data loads!

---

## Switching to Real Mode

To switch back to Prisma + PostgreSQL:

1. Update `.env.local`:
```env
USE_MOCK_DATA=false
NEXT_PUBLIC_USE_MOCK_DATA=false
DATABASE_URL="postgresql://..."
```

2. Restart dev server:
```bash
npm run dev
```

The app will now use real database and NextAuth.

---

## Mock Mode Limitations

### What Works
✅ All CRUD operations
✅ User registration/login
✅ Business listings
✅ Search and filters
✅ Reviews (basic)
✅ Role switching
✅ Data persistence (localStorage)

### What Doesn't Work
❌ Real password hashing (passwords are plain text)
❌ Email verification
❌ Image uploads (can only use URLs)
❌ Multi-user collaboration (localStorage is per-browser)
❌ Server-side sessions
❌ Real OAuth (Google, etc.)

### Security Note

**NEVER deploy mock mode to production!**
Mock mode is for local development only. Passwords are not hashed, and there's no real security.

---

## Troubleshooting

### Issue: "No data showing"
- Check if mock mode is enabled in `.env.local`
- Clear localStorage and refresh
- Check browser console for errors

### Issue: "Can't log in"
- Use pre-loaded credentials:
  - consumer@test.com / password123
  - owner@test.com / password123
  - admin@test.com / password123

### Issue: "Changes not saving"
- Check if localStorage is enabled in your browser
- Try incognito mode
- Check browser console for errors

### Issue: "Role switcher not showing"
- Verify `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local`
- Restart dev server

---

## Next Steps

Now you can:
1. Test all user flows without a database
2. Build the scraped business review UI
3. Implement web scraping scripts
4. Add more mock data for testing
5. Build additional features

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Frontend (Browser)              │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   React Components               │  │
│  │   (uses useMockSession)          │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│  ┌──────────▼───────────────────────┐  │
│  │   Mock Session Provider          │  │
│  │   (localStorage: session)        │  │
│  └──────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ HTTP Requests
┌──────────────▼──────────────────────────┐
│         Next.js API Routes              │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   /api/businesses/route.ts       │  │
│  │   (checks isMockMode())          │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│      ┌──────▼──────────┐               │
│      │  Mock Mode?     │               │
│      └─────┬────────┬──┘               │
│            │        │                   │
│        YES │        │ NO                │
│            │        │                   │
│  ┌─────────▼──┐  ┌─▼────────────┐      │
│  │  mockDb    │  │  prisma      │      │
│  │  (mock)    │  │  (real DB)   │      │
│  └─────┬──────┘  └─┬────────────┘      │
│        │           │                    │
└────────┼───────────┼────────────────────┘
         │           │
    ┌────▼───┐   ┌───▼────────┐
    │localStorage│  │PostgreSQL│
    └────────────┘  └──────────┘
```

---

**You're ready to build without any external dependencies!** 🚀
