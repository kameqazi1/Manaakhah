# Manakhaah MVP - Complete Setup Guide

This guide will walk you through setting up the Manakhaah platform from scratch.

## Prerequisites

Before you begin, make sure you have:
- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **PostgreSQL** database (local or hosted)
- **npm** package manager (comes with Node.js)

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 16 (React framework)
- Prisma 5 (Database ORM)
- NextAuth (Authentication)
- Tailwind CSS (Styling)
- And more...

## Step 2: Set Up Database

### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database:
```bash
createdb manakhaah
```

3. Your connection string will look like:
```
postgresql://postgres:your-password@localhost:5432/manakhaah
```

### Option B: Supabase (Recommended for quick setup)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > Database
4. Copy your connection string (it looks like):
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Option C: Railway, Render, or Neon

Similar to Supabase - create an account, create a PostgreSQL database, and copy the connection string.

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and update the following:

```env
# Replace with your actual database connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/manakhaah"

# Generate a random secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"

# Keep these as-is for local development
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LAT="37.5485"
NEXT_PUBLIC_DEFAULT_LNG="-121.9886"
NEXT_PUBLIC_DEFAULT_CITY="Fremont, CA"
```

To generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 4: Initialize the Database

Run Prisma migrations to create all tables:

```bash
npm run db:push
```

This will create all the necessary tables in your database:
- users
- businesses
- reviews
- messages
- conversations
- verification_requests
- events
- and more...

## Step 5: Generate Prisma Client

```bash
npm run db:generate
```

This generates the TypeScript types for your database models.

## Step 6: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## Step 7: Create Your First User

1. Click "Get Started" or "Sign Up"
2. Fill in your information
3. Choose "Business Owner" if you want to create listings
4. If your email contains "admin" (e.g., admin@manakhaah.com), you'll automatically get admin access

## Step 8: Create a Test Listing

1. After logging in, click "Create New Listing"
2. Fill in the business information:
   - Business name
   - Category
   - Description
   - Address (use a Fremont, CA address for testing)
   - Phone number
   - Services
   - Tags (select Muslim-owned, Halal verified, etc.)
3. Click "Create Listing"
4. Your listing will be in "Pending Review" status

## Optional: View Database with Prisma Studio

Open a visual database editor:
```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables
- Edit data
- Add test data manually
- Approve pending listings (change status to "PUBLISHED")

## Optional: Add External Services

### Mapbox (for maps)
1. Create free account at [mapbox.com](https://mapbox.com)
2. Get your access token
3. Add to `.env.local`:
```env
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token"
```

### Cloudinary (for image uploads)
1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from dashboard
3. Add to `.env.local`:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Resend (for emails)
1. Create free account at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
```env
RESEND_API_KEY="your-resend-api-key"
```

## Common Issues & Solutions

### Issue: "Can't connect to database"
- Make sure PostgreSQL is running
- Verify your DATABASE_URL is correct
- Check if database exists

### Issue: "Prisma Client not found"
- Run `npm run db:generate`

### Issue: "Invalid credentials" when logging in
- Make sure you registered first
- Check if email and password are correct
- Clear browser cookies and try again

### Issue: Port 3000 already in use
- Kill the process using port 3000, or
- Run on different port: `npm run dev -- -p 3001`

## Database Schema Overview

Your database includes these main tables:

- **users**: User accounts (consumers, business owners, admins)
- **businesses**: Business listings with location, hours, services
- **business_photos**: Photos for each business
- **business_tags**: Tags like Muslim-owned, Halal verified
- **reviews**: User reviews and ratings
- **conversations**: Message threads between users and businesses
- **messages**: Individual messages
- **verification_requests**: Requests for halal/Muslim-owned verification
- **events**: Community events (future feature)

## Next Steps

Now that your app is running:

1. **Test the flow**:
   - Register as a business owner
   - Create a test listing
   - Use Prisma Studio to approve it (set status to PUBLISHED)
   - Search for it on the /search page
   - View the business detail page

2. **Add test data**:
   - Create multiple businesses
   - Add reviews (requires separate user accounts)
   - Test filters and search

3. **Customize**:
   - Update colors in `tailwind.config.ts`
   - Add your logo to the header
   - Customize categories in `lib/constants.ts`

## Deploying to Production

When ready to deploy:

1. **Deploy to Vercel** (easiest):
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. Set environment variables in Vercel dashboard
3. Connect your PostgreSQL database
4. Done!

## Getting Help

- Check the [Next.js docs](https://nextjs.org/docs)
- Check the [Prisma docs](https://www.prisma.io/docs)
- Review the code comments
- Open an issue in your project repository

## Project Structure

```
manakhaah/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   └── businesses/     # Business CRUD endpoints
│   ├── dashboard/          # User dashboard
│   ├── search/             # Search page
│   ├── business/[id]/      # Business detail page
│   ├── login/              # Login page
│   └── register/           # Registration page
├── components/             # React components
│   └── ui/                # UI components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth config
│   ├── utils.ts          # Helper functions
│   └── constants.ts      # App constants
├── prisma/
│   └── schema.prisma     # Database schema
└── types/                # TypeScript types
```

---

You're all set! Start building and customizing your Muslim business marketplace. 🚀
