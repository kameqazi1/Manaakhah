# Coding Conventions

**Analysis Date:** 2026-01-19

## Naming Patterns

**Files:**
- React components: PascalCase (`ReviewSection.tsx`, `WriteReviewModal.tsx`, `NotificationBell.tsx`)
- Pages: lowercase with hyphens for directories (`app/claim-business/page.tsx`, `app/prayer-times/page.tsx`)
- API routes: lowercase (`app/api/businesses/route.ts`, `app/api/auth/register/route.ts`)
- Utility files: camelCase (`lib/utils.ts`, `lib/mock-auth.ts`, `lib/cloudinary.ts`)
- Type definition files: camelCase or kebab-case (`types/next-auth.d.ts`, `lib/scraper/types.ts`)
- Constants: camelCase (`lib/constants.ts`)

**Functions:**
- Regular functions: camelCase (`calculateDistance`, `fetchReviews`, `handleSubmitResponse`)
- React components: PascalCase (`ReviewSection`, `Header`, `Button`)
- Event handlers: `handle` prefix (`handleMouseEnter`, `handleReportReview`, `handleHelpful`)
- API route handlers: HTTP method names (`GET`, `POST`, `PUT`, `DELETE`)
- Async functions: no special prefix, same as regular functions

**Variables:**
- Local variables: camelCase (`businessId`, `userId`, `reviewCount`)
- Boolean variables: `is`, `has`, `can` prefixes (`isOwner`, `hasDelivery`, `canWriteReview`)
- State variables: camelCase (`loading`, `reviews`, `stats`, `filter`)
- Constants/enums: UPPER_SNAKE_CASE (`HALAL_FOOD`, `BUSINESS_OWNER`, `PENDING_REVIEW`)

**Types/Interfaces:**
- Types and interfaces: PascalCase (`Review`, `ReviewStats`, `ScrapedBusiness`, `AuthenticityScore`)
- Type unions: PascalCase (`DataSource`, `BusinessCategory`, `VerificationLevel`)
- Enums: PascalCase with UPPER_SNAKE_CASE values (defined in Prisma schema)

## Code Style

**Formatting:**
- No dedicated Prettier config (uses Next.js defaults)
- 2-space indentation (inferred from files)
- Single quotes for imports
- Double quotes in JSX attributes
- Semicolons at end of statements
- Trailing commas in multi-line arrays/objects

**Linting:**
- ESLint with `next/core-web-vitals` preset
- Config: `.eslintrc.json`
- Run: `npm run lint`
- Strict TypeScript enabled (`"strict": true` in tsconfig.json)

## Import Organization

**Order:**
1. React and React hooks (`import { useState, useEffect } from "react"`)
2. Next.js imports (`import Link from "next/link"`, `import { NextResponse } from "next/server"`)
3. Third-party libraries (`import { z } from "zod"`, `import bcrypt from "bcryptjs"`)
4. Internal absolute imports using `@/` alias (`import { db } from "@/lib/db"`)
5. Relative imports for local files (rare, prefer absolute)
6. Type imports (`import type { NextAuthConfig } from "next-auth"`)

**Path Aliases:**
- `@/*` maps to project root (`./`)
- Usage: `@/lib/utils`, `@/components/ui/button`, `@/lib/db`
- Configured in `tsconfig.json`

**Example:**
```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMockSession } from "@/components/mock-session-provider";
```

## Error Handling

**API Routes Pattern:**
```typescript
export async function POST(req: Request) {
  try {
    // Validation first
    const body = await req.json();
    const validatedData = schema.parse(body);

    // Auth check
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Business logic
    const result = await db.model.create({ data: validatedData });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    // Generic errors
    console.error("Operation error:", error);
    return NextResponse.json(
      { error: "Failed to perform operation" },
      { status: 500 }
    );
  }
}
```

**HTTP Status Codes Used:**
- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad request / validation error
- `401` - Unauthorized
- `403` - Forbidden (wrong role)
- `404` - Not found
- `500` - Internal server error
- `501` - Not implemented

**Client-Side Error Handling:**
```typescript
try {
  const response = await fetch(`/api/endpoint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const data = await response.json();
    // Handle success
  }
} catch (error) {
  console.error("Error description:", error);
}
```

## Logging

**Framework:** Native `console` methods

**Patterns:**
- `console.log` - Debug info with emoji prefixes (`console.log("🔧 Using MOCK DATA")`)
- `console.error` - Errors with descriptive context (`console.error("Error fetching reviews:", error)`)
- No structured logging library in use

**When to Log:**
- API errors before returning error responses
- Important state changes (mode switches)
- Development/debugging information

## Comments

**When to Comment:**
- Complex business logic
- Non-obvious calculations (e.g., Haversine formula for distance)
- Type definitions requiring explanation
- API route documentation (// GET /api/businesses - List all businesses)

**JSDoc/TSDoc:**
- Used sparingly, primarily for service functions
- Example from `lib/services/review-authenticity.ts`:
```typescript
// Review Authenticity AI Service
// Analyzes reviews for authenticity and quality

export interface AuthenticityScore {
  overall: number; // 0-100
  factors: {
    lengthQuality: number;
    // ...
  };
}
```

**Inline Comments:**
- Used for explaining non-obvious code
- Section separators in long files (e.g., Prisma schema)

## Function Design

**Size:**
- Keep functions focused on single responsibility
- API handlers can be longer (50-100+ lines) due to validation, auth, business logic
- Helper functions should be short and focused

**Parameters:**
- Use destructuring for objects with multiple properties
- Use TypeScript interfaces for complex parameter objects
- Optional parameters at end with `?` or default values

**Return Values:**
- API routes: Always return `NextResponse.json()`
- Components: Return JSX
- Utilities: Return typed values
- Async functions: Return Promises with proper typing

**Example:**
```typescript
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  // ... implementation
  return R * c;
}
```

## Module Design

**Exports:**
- Named exports preferred over default exports
- Exception: Page components use default export (Next.js convention)
- Group related exports in barrel files for components

**UI Component Pattern (shadcn/ui style):**
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, ...props }, ref) => (
    <element ref={ref} className={cn("base-styles", className)} {...props} />
  )
)
Component.displayName = "Component"

export { Component }
```

**Barrel Files:**
- Not extensively used
- Individual component imports preferred: `import { Button } from "@/components/ui/button"`

## React Patterns

**Client vs Server Components:**
- Client components: Add `"use client"` directive at top
- Server components: Default in Next.js App Router (no directive needed)
- Pages in `/app` are client components when interactive

**State Management:**
- React `useState` for local component state
- No global state management library (Redux, Zustand)
- Context for cross-component state (`useMockSession`)

**Data Fetching:**
- Client components: `fetch` in `useEffect` or event handlers
- @tanstack/react-query available but not extensively used

**Component Props Pattern:**
```typescript
interface ComponentProps {
  businessId: string;
  businessOwnerId?: string;
}

export function Component({ businessId, businessOwnerId }: ComponentProps) {
  // ...
}
```

## API Design

**Route File Structure:**
- Each route in own directory: `app/api/[resource]/route.ts`
- Dynamic routes: `app/api/[resource]/[id]/route.ts`
- Nested resources: `app/api/[resource]/[id]/[action]/route.ts`

**Request/Response Pattern:**
```typescript
// GET with query params
const { searchParams } = new URL(req.url);
const category = searchParams.get("category");

// POST with body
const body = await req.json();
const validatedData = schema.parse(body);

// Response format
return NextResponse.json({
  data: result,
  message: "Success message",
  pagination: { page, limit, total }
});
```

**Authentication Pattern (Mock Mode):**
```typescript
if (isMockMode()) {
  userId = req.headers.get("x-user-id");
  userRole = req.headers.get("x-user-role");
}

if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

## Validation

**Zod Schemas:**
- Define at top of route files
- Use descriptive error messages
- Example:
```typescript
const createBusinessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["HALAL_FOOD", "RESTAURANT", /* ... */]),
  email: z.string().email().optional().or(z.literal("")),
});
```

## Database Access

**Prisma/Mock Pattern:**
- Use `db` from `@/lib/db` (auto-switches between Prisma and mock)
- Use `isMockMode()` to check current mode
- Prisma-style queries work in both modes

**Query Pattern:**
```typescript
const businesses = await db.business.findMany({
  where: { status: "PUBLISHED" },
  include: {
    owner: { select: { id: true, name: true } },
    photos: { orderBy: { order: "asc" }, take: 1 },
  },
  orderBy: { createdAt: "desc" },
  take: 100,
});
```

## CSS/Styling

**Tailwind CSS:**
- Primary styling approach
- Use utility classes directly in JSX
- Custom colors via CSS variables in `tailwind.config.ts`

**Class Name Pattern:**
- Use `cn()` utility for conditional classes
- Example: `className={cn("base-styles", isActive && "active-styles", className)}`

**Component Variants (CVA):**
```typescript
const buttonVariants = cva(
  "base-styles",
  {
    variants: {
      variant: {
        default: "default-styles",
        destructive: "destructive-styles",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## Constants

**Location:** `lib/constants.ts`

**Pattern:**
```typescript
export const BUSINESS_CATEGORIES = [
  { value: 'HALAL_FOOD', label: 'Halal Food' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  // ...
] as const;
```

**Usage:** Import and use with TypeScript inference for type safety.

---

*Convention analysis: 2026-01-19*
