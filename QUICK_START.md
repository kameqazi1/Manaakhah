# Quick Start - Run Manakhaah in Mock Mode (No Database!)

## ⚡ 2-Minute Setup

### Step 1: Start the App
```bash
npm run dev
```

### Step 2: Open Browser
Visit: http://localhost:3000

### Step 3: That's It!
You're done! The app is running with mock data (no database needed).

---

## 🎭 Using the App

### Yellow Badge (Bottom-Right)
You'll see: **🎭 Mock Mode (CONSUMER)**

Click it to:
- Switch between users instantly
- See all available test accounts
- Reset data

### Pre-loaded Test Accounts

1. **consumer@test.com** / password123
   - Role: Consumer
   - Can: Browse, search, review

2. **owner@test.com** / password123
   - Role: Business Owner
   - Can: Create listings, manage businesses

3. **admin@test.com** / password123
   - Role: Admin
   - Can: Review scraped businesses, approve/reject

---

## 📍 Key Pages

### Homepage
http://localhost:3000
- Browse categories
- See featured businesses

### Search
http://localhost:3000/search
- Search businesses
- Filter by category and tags

### Admin Review Queue
http://localhost:3000/admin/review-queue
- Switch to Admin (role switcher)
- Review scraped businesses
- Approve/reject/flag listings

### Dashboard
http://localhost:3000/dashboard
- Switch to Business Owner
- Create new listing
- Manage your businesses

---

## ✅ Testing Flows

### Test 1: Browse as Consumer
1. Click role switcher → Select "Consumer"
2. Go to /search
3. Filter by "Halal Food"
4. Click on "Al-Noor Halal Market"
5. See full details, reviews

### Test 2: Create Business
1. Click role switcher → Select "Business Owner"
2. Go to /dashboard
3. Click "Create New Listing"
4. Fill form:
   - Name: My Test Restaurant
   - Category: Restaurant
   - Description: Great halal food
   - Address: 123 Main St
   - City: Fremont
   - Zip: 94536
   - Phone: (510) 555-1234
   - Services: Dine-in, Takeout
   - Tags: Muslim-owned, Halal verified
5. Submit
6. See it in dashboard (status: Pending Review)

### Test 3: Approve Scraped Business
1. Click role switcher → Select "Admin"
2. Go to /admin/review-queue
3. Click "Zabiha Halal Restaurant"
4. Review:
   - Confidence: 95%
   - Signals: zabiha, halal, pakistani
   - Source: Google Maps
5. Click "✓ Approve & Publish"
6. Go to /search → See it published!

---

## 🔧 Troubleshooting

### Issue: Nothing showing
**Fix**: Clear localStorage
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Issue: Role switcher not showing
**Fix**: Check .env.local
```
NEXT_PUBLIC_USE_MOCK_DATA=true
```
Then restart: `npm run dev`

### Issue: Can't create business
**Fix**: Make sure you're logged in as Business Owner or Admin
- Click role switcher
- Select "owner@test.com"

---

## 📊 Mock Data Location

All data is stored in browser localStorage:
- Key: `manakhaah-mock-data`
- Key: `manakhaah-mock-session`

**View in console:**
```javascript
JSON.parse(localStorage.getItem('manakhaah-mock-data'))
```

**Reset data:**
Click role switcher → "Reset All Data"

---

## 🚀 Next Steps

1. ✅ Test all flows above
2. ✅ Create your own test businesses
3. ✅ Review scraped queue
4. ✅ Approve/reject businesses

For more details, see:
- **LOCAL_DEV_COMPLETE_GUIDE.md** - Full guide
- **MOCK_MODE_GUIDE.md** - Mock mode details
- **lib/scraper/SCRAPING_GUIDE.md** - Web scraping guide

---

**Enjoy building without any setup!** 🎉
