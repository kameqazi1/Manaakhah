# Database Migration Required

## Overview
A new `SpendingEntry` model has been added to the Prisma schema to enable spending insights tracking.

## What Was Added

### Schema Changes (prisma/schema.prisma)
- New `SpendingEntry` model to track user spending at businesses
- Added `spendingEntries` relation to `User` model
- Added `spendingEntries` relation to `Business` model

### API Endpoints Created
- `POST /api/spending` - Create a spending entry
- `GET /api/spending` - Get user's spending entries with summaries
- `PUT /api/spending/[id]` - Update a spending entry
- `DELETE /api/spending/[id]` - Delete a spending entry

### UI Updates
- Updated `app/insights/page.tsx` to display spending data
- Added form to manually add spending entries
- Added spending summaries, category breakdowns, and top businesses

## How to Apply the Migration

### Option 1: Using Prisma Migrate (Recommended for Production)
```bash
# Generate and apply migration
npx prisma migrate dev --name add_spending_entry_model

# This will:
# 1. Create a new migration file in prisma/migrations/
# 2. Apply the migration to your database
# 3. Regenerate Prisma Client
```

### Option 2: Using Prisma DB Push (Quick for Development)
```bash
# Push schema changes directly to database
npx prisma db push

# This will:
# 1. Apply schema changes without creating a migration file
# 2. Regenerate Prisma Client
```

### Option 3: Manual SQL (If Prisma commands fail)
Run this SQL directly on your Neon database:

```sql
-- Create SpendingEntry table
CREATE TABLE IF NOT EXISTS "SpendingEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SpendingEntry_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "SpendingEntry_businessId_fkey"
    FOREIGN KEY ("businessId")
    REFERENCES "Business"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "SpendingEntry_userId_date_idx"
  ON "SpendingEntry"("userId", "date");

CREATE INDEX IF NOT EXISTS "SpendingEntry_businessId_idx"
  ON "SpendingEntry"("businessId");

CREATE INDEX IF NOT EXISTS "SpendingEntry_category_idx"
  ON "SpendingEntry"("category");
```

Then regenerate Prisma Client:
```bash
npx prisma generate
```

## After Migration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Test the spending insights page:
   - Navigate to `/insights`
   - Click "Add Spending" to record a purchase
   - Verify the data displays correctly

3. Test the API endpoints:
   ```bash
   # Get spending data
   curl http://localhost:3000/api/spending

   # Add a spending entry (requires authentication)
   curl -X POST http://localhost:3000/api/spending \
     -H "Content-Type: application/json" \
     -d '{"businessId": "...", "amount": 25.50, "description": "Lunch"}'
   ```

## Model Details

The `SpendingEntry` model stores:
- **userId**: Which user made the purchase
- **businessId**: Which business received the spending
- **amount**: Dollar amount spent
- **category**: Business category (automatically copied from Business)
- **description**: Optional note about the purchase
- **date**: When the spending occurred
- **createdAt/updatedAt**: Audit timestamps

This enables features like:
- Total spending tracking
- Category-wise spending breakdown
- Top businesses by spending
- Monthly spending trends
- Community economic impact metrics
