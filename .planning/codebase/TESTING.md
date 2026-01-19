# Testing Patterns

**Analysis Date:** 2026-01-19

## Test Framework

**Runner:**
- No test framework configured in project
- No Jest, Vitest, or other test runner in `package.json`
- No test configuration files present

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands available
# package.json scripts only include:
npm run dev        # Development server
npm run build      # Production build
npm run start      # Start production
npm run lint       # ESLint
```

## Test File Organization

**Location:**
- No test directories found in project root
- No `__tests__/` directories
- No `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` files in `app/`, `components/`, or `lib/`

**Current State:**
- This codebase has **no automated tests**
- Manual testing documentation exists in `TESTING_GUIDE.md` (manual QA checklist)

## Recommended Test Setup

If tests are to be added, the following structure is recommended based on conventions:

**Framework Recommendation:** Vitest (faster, native ESM support for Next.js)

**Installation:**
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

**Configuration (vitest.config.ts):**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**Recommended Directory Structure:**
```
tests/
├── setup.ts                    # Test setup and global mocks
├── unit/
│   ├── lib/
│   │   ├── utils.test.ts
│   │   └── services/
│   │       └── review-authenticity.test.ts
│   └── components/
│       └── ui/
│           └── button.test.tsx
├── integration/
│   └── api/
│       ├── businesses.test.ts
│       └── reviews.test.ts
└── e2e/                        # If Playwright/Cypress added
    └── flows/
        └── booking.test.ts
```

## What to Test

**Priority 1 - Utility Functions:**
- `lib/utils.ts` - `cn()` function
- `lib/services/review-authenticity.ts` - `analyzeReviewAuthenticity()`
- `lib/scraper/utils.ts` - Scraper utility functions

**Priority 2 - API Routes:**
- `app/api/auth/register/route.ts` - Registration validation
- `app/api/businesses/route.ts` - Business CRUD
- `app/api/reviews/route.ts` - Review creation and retrieval
- `app/api/bookings/route.ts` - Booking flow

**Priority 3 - Components:**
- `components/ui/*` - UI component rendering
- `components/reviews/ReviewSection.tsx` - Review display
- `components/header.tsx` - Navigation and auth state

## Mock Data Pattern

**Existing Mock System:**
The codebase has a built-in mock data system that can be leveraged for testing.

**Mock Mode Detection:**
```typescript
// lib/db.ts
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

export const isMockMode = () => USE_MOCK_DATA;
```

**Mock Database Client:**
- Location: `lib/mock-data/client.ts`
- Storage: `lib/mock-data/storage.ts`
- Types: `lib/mock-data/types.ts`
- Seed data: `lib/mock-data/seed-data.ts`

**Using Mock Data in Tests:**
```typescript
// Set environment before tests
process.env.USE_MOCK_DATA = "true";

// Import db - will use mock client
import { db } from "@/lib/db";
```

## Example Test Patterns

**Unit Test (Utility Function):**
```typescript
// tests/unit/lib/services/review-authenticity.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeReviewAuthenticity } from '@/lib/services/review-authenticity';

describe('analyzeReviewAuthenticity', () => {
  it('should flag very short reviews', () => {
    const review = {
      content: 'Good food',
      rating: 5,
      authorId: 'user-1',
      createdAt: new Date().toISOString(),
    };

    const result = analyzeReviewAuthenticity(review);

    expect(result.score.overall).toBeLessThan(50);
    expect(result.score.flags).toContain('Very short review');
  });

  it('should rate detailed reviews higher', () => {
    const review = {
      content: 'I ordered the lamb biryani and it was absolutely delicious. The portion size was generous and the service was excellent. The staff was friendly and the restaurant was very clean. I will definitely return.',
      rating: 5,
      authorId: 'user-1',
      createdAt: new Date().toISOString(),
    };

    const result = analyzeReviewAuthenticity(review);

    expect(result.score.overall).toBeGreaterThan(60);
    expect(result.isAuthentic).toBe(true);
  });
});
```

**API Route Test:**
```typescript
// tests/integration/api/businesses.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/businesses/route';

describe('GET /api/businesses', () => {
  it('should return businesses with status filter', async () => {
    const req = new Request('http://localhost/api/businesses?status=PUBLISHED');

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('POST /api/businesses', () => {
  it('should reject unauthenticated requests', async () => {
    const req = new Request('http://localhost/api/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Business' }),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
  });
});
```

**Component Test:**
```typescript
// tests/unit/components/ui/button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });
});
```

## Mocking Patterns

**Mocking External Services:**
```typescript
// tests/mocks/email.ts
import { vi } from 'vitest';

export const mockSendVerificationEmail = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/email', () => ({
  sendVerificationEmail: mockSendVerificationEmail,
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));
```

**Mocking Prisma/Database:**
```typescript
// Use the built-in mock mode
process.env.USE_MOCK_DATA = "true";

// Or mock specific functions
vi.mock('@/lib/db', () => ({
  db: {
    business: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'test-id' }),
    },
  },
  isMockMode: () => true,
}));
```

**Mocking Authentication:**
```typescript
// For API routes, set headers
const req = new Request('http://localhost/api/endpoint', {
  headers: {
    'x-user-id': 'test-user-id',
    'x-user-role': 'BUSINESS_OWNER',
  },
});

// For components, mock the session provider
vi.mock('@/components/mock-session-provider', () => ({
  useMockSession: () => ({
    data: {
      user: { id: 'test-user', name: 'Test', role: 'CONSUMER' },
    },
  }),
}));
```

## Fixtures and Factories

**Test Data Location:**
- Recommended: `tests/fixtures/`
- Can also leverage existing: `lib/mock-data/seed-data.ts`

**Factory Pattern:**
```typescript
// tests/fixtures/factories.ts
export function createTestBusiness(overrides = {}) {
  return {
    id: 'test-business-id',
    name: 'Test Business',
    slug: 'test-business',
    category: 'RESTAURANT',
    status: 'PUBLISHED',
    description: 'A test business for testing',
    address: '123 Test St',
    city: 'Fremont',
    state: 'CA',
    zipCode: '94538',
    latitude: 37.5485,
    longitude: -121.9886,
    phone: '555-1234',
    ...overrides,
  };
}

export function createTestReview(overrides = {}) {
  return {
    id: 'test-review-id',
    businessId: 'test-business-id',
    userId: 'test-user-id',
    rating: 4,
    content: 'This is a test review with sufficient content for authenticity checks.',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
```

## Coverage

**Requirements:**
- None currently enforced
- No coverage configuration

**Recommended Coverage Commands (once set up):**
```bash
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

**Recommended Coverage Targets:**
- Unit tests: 80%+ for utilities and services
- API routes: 70%+ for critical endpoints
- Components: 60%+ for interactive components

## Test Types

**Unit Tests:**
- Scope: Individual functions, utilities, pure components
- Mocking: External dependencies mocked
- Location: `tests/unit/`

**Integration Tests:**
- Scope: API routes with mock database
- Mocking: External services (email, etc.) mocked, database can use mock client
- Location: `tests/integration/`

**E2E Tests:**
- Scope: Full user flows through the application
- Framework: Playwright or Cypress (not configured)
- Location: `tests/e2e/` (to be created)

## Common Test Patterns

**Async Testing:**
```typescript
it('should handle async operations', async () => {
  const response = await GET(new Request('http://localhost/api/businesses'));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data).toBeDefined();
});
```

**Error Testing:**
```typescript
it('should return validation error for invalid input', async () => {
  const req = new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid-email' }),
  });

  const response = await POST(req);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toBe('Validation error');
  expect(data.details).toBeDefined();
});
```

**Snapshot Testing (for components):**
```typescript
import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

it('matches snapshot', () => {
  const { container } = render(<Button variant="default">Test</Button>);
  expect(container).toMatchSnapshot();
});
```

## Manual Testing Resources

**Existing Documentation:**
- `TESTING_GUIDE.md` - Manual QA checklist for all features
- `QUICK_START.md` - Setup instructions
- `LOCAL_DEV_COMPLETE_GUIDE.md` - Development environment setup

**Manual Test Approach:**
1. Start dev server: `npm run dev`
2. Set `USE_MOCK_DATA=true` in `.env.local` for consistent test data
3. Follow checklists in `TESTING_GUIDE.md`

## Recommended Next Steps

1. **Install Vitest and Testing Library:**
   ```bash
   npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
   ```

2. **Add test scripts to package.json:**
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:watch": "vitest --watch",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

3. **Create initial test files:**
   - Start with `lib/utils.ts` (simplest)
   - Add `lib/services/review-authenticity.ts` (has pure functions)
   - Then API routes for critical paths

4. **Set up CI testing** (when ready for production)

---

*Testing analysis: 2026-01-19*
