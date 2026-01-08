# Manakhaah MVP

A Business-to-Consumer (B2C) platform connecting Muslim consumers to Muslim-owned businesses, halal services, masjids, and community aid resources in the Bay Area.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Maps**: Mapbox GL JS
- **Image Upload**: Cloudinary
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Mapbox account (free tier)
- Cloudinary account (free tier)
- Resend account (optional, for emails)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your environment variables by copying `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

3. Update `.env.local` with your credentials:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://user:password@localhost:5432/manakhaah"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Mapbox (get from https://mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN="your-token-here"

# Cloudinary (get from https://cloudinary.com)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Resend (get from https://resend.com)
RESEND_API_KEY="your-api-key"
```

4. Set up the database:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
manakhaah/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── search/            # Search & browse listings
│   ├── dashboard/         # User dashboard
│   ├── admin/             # Admin panel
│   └── page.tsx           # Landing page
├── components/            # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # NextAuth configuration
│   ├── utils.ts           # Helper functions
│   └── constants.ts       # App constants
├── prisma/
│   └── schema.prisma      # Database schema
└── types/                 # TypeScript type definitions
```

## Features Implemented (Phase 1)

- [x] User authentication (registration, login, session management)
- [x] User roles (Consumer, Business Owner, Admin)
- [x] Landing page with categories
- [x] Database schema with Prisma
- [x] Responsive UI components

## Next Steps

- [ ] Business listing creation and management
- [ ] Search and filter functionality
- [ ] Mapbox integration for maps
- [ ] Review and rating system
- [ ] Messaging system
- [ ] Admin dashboard
- [ ] Verification system (halal, Muslim-owned)
- [ ] Image upload functionality

## Database Schema

Key models:
- **User**: Authentication and profile data
- **Business**: Business listings with location, category, hours
- **Review**: User reviews with ratings
- **Message/Conversation**: Direct messaging
- **VerificationRequest**: Halal and Muslim-owned verification
- **Event**: Community events

See `prisma/schema.prisma` for full schema.

## Admin Account

Users with "admin" in their email address (e.g., `admin@manakhaah.com`) are automatically assigned the ADMIN role upon registration.

## Location

Default location: **Fremont, CA** (37.5485, -121.9886)
This can be changed in `lib/constants.ts`

## Contributing

This is an MVP project. Future improvements include:
- Mobile app (React Native)
- Advanced search with AI recommendations
- Payment integration for promoted listings
- Multi-language support (Arabic, Urdu)
- SMS verification

## License

Private - All rights reserved
