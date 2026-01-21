# Phase 1: Booking Foundation - Research

**Researched:** 2026-01-21
**Domain:** Appointment booking with calendar UI, service management
**Confidence:** HIGH

## Summary

This phase builds a complete appointment booking flow for the Manaakhah platform. Users will browse business services with pricing, select available time slots from a visual calendar, and submit booking requests that create PENDING database records.

The codebase already has substantial infrastructure: `Booking`, `BusinessAvailability`, and `AvailabilityException` Prisma models exist with proper status enums. The existing `/api/bookings` routes handle basic CRUD. The dashboard services page (`/dashboard/services`) demonstrates the pattern for service management using localStorage (to be migrated to database). The project uses `date-fns` for date manipulation which is already installed.

**Primary recommendation:** Add `react-day-picker` (the standard calendar library for Radix UI ecosystems) and build a Service model in Prisma to persist business services, then create the booking page at `/business/[id]/book` with a three-step flow: service selection, date/time selection, and confirmation.

## Current State Analysis

### Existing Infrastructure (HIGH Confidence)

**Prisma Models Already Available:**

```prisma
// Booking model (lines 1047-1103 in schema.prisma)
model Booking {
  id              String   @id @default(cuid())
  businessId      String
  customerId      String
  serviceType     String
  services        Json?        // Array for multi-service booking
  appointmentDate DateTime
  appointmentTime String
  duration        Int          // in minutes
  notes           String?
  status          BookingStatus @default(PENDING)
  statusHistory   Json[]
  price           Float?
  depositAmount   Float?
  paymentStatus   PaymentStatus @default(NOT_REQUIRED)
  // ... timestamps, cancellation fields, etc.
}

// BusinessAvailability model (lines 1105-1120)
model BusinessAvailability {
  id           String  @id @default(cuid())
  businessId   String
  dayOfWeek    Int     // 0-6 (Sunday-Saturday)
  startTime    String
  endTime      String
  slotDuration Int     // in minutes
  bufferTime   Int     @default(0)
  maxBookings  Int?
  isAvailable  Boolean @default(true)
  // Unique constraint: [businessId, dayOfWeek]
}

// AvailabilityException model (lines 1122-1135)
model AvailabilityException {
  id          String   @id @default(cuid())
  businessId  String
  date        DateTime @db.Date
  isAvailable Boolean
  startTime   String?
  endTime     String?
  reason      String?
  // Unique constraint: [businessId, date]
}

// Waitlist model (lines 1137-1148)
model Waitlist {
  id         String    @id @default(cuid())
  bookingId  String    @unique
  position   Int
  notifiedAt DateTime?
  expiresAt  DateTime?
}
```

**Booking Status Enum (line 128-136):**
```prisma
enum BookingStatus {
  PENDING
  CONFIRMED
  REJECTED
  CANCELLED
  COMPLETED
  NO_SHOW
  WAITLISTED
}
```

**Existing API Routes:**
- `POST /api/bookings` - Creates booking with validation
- `GET /api/bookings` - Lists bookings (customer or business view)
- `PUT /api/bookings/[id]/status` - Updates booking status
- `POST /api/bookings/waitlist` - Waitlist operations

**Existing UI Components:**
- `/dashboard/services/page.tsx` - Service management UI (localStorage-based)
- `/app/bookings/page.tsx` - Booking list page for users
- `/business/[id]/page.tsx` - Business detail page (booking entry point)
- Radix UI components: Tabs, DropdownMenu
- Custom UI: Button, Card, Input, Textarea, Badge, Select

**Mock Mode Support:**
- `lib/db.ts` - Database proxy that switches between Prisma and mock
- `lib/mock-data/client.ts` - Mock booking operations exist
- `isMockMode()` helper for conditional logic
- Headers `x-user-id` and `x-user-role` for mock auth

### Gap Analysis (HIGH Confidence)

**Missing: Service Model**
The current system stores service info in `Booking.serviceType` (string) and Business.services (string[]), but has no structured Service model with pricing, duration, and descriptions. The dashboard services page uses localStorage which needs to be migrated.

**Missing: Time Slot Generation Logic**
No utility exists to generate available time slots from `BusinessAvailability` records while considering existing bookings and exceptions.

**Missing: Public Booking Page**
No `/business/[id]/book` route exists. The current business page has "Request Quote" but not direct booking.

**Missing: Calendar UI Component**
No date picker or calendar component exists in `components/ui/`. The project has `date-fns` but no visual calendar.

**Missing: Availability API**
No endpoint to fetch available slots for a given business/date/service combination.

## Standard Stack

### Core Libraries (HIGH Confidence)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-day-picker | ^9.4.0 | Calendar/date picker UI | Powers shadcn/ui Calendar, 6M+ weekly downloads, works with Radix |
| date-fns | 4.1.0 | Date manipulation | Already installed, standard for React date handling |
| @radix-ui/react-popover | latest | Calendar popover wrapper | Already have Radix in project, standard pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 | Conditional classes | Already installed |
| tailwind-merge | 3.4.0 | Merge Tailwind classes | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-day-picker | react-big-calendar | Overkill for slot picking, better for full scheduler views |
| react-day-picker | @mobiscroll/react | Commercial license required |
| Native select | Radix Select | Native select is simpler for time slot dropdowns |

**Installation:**
```bash
npm install react-day-picker@^9.4.0 @radix-ui/react-popover
```

Note: The project already has date-fns 4.1.0 installed which is compatible.

## Architecture Patterns

### Recommended Project Structure
```
app/
  business/
    [id]/
      book/
        page.tsx           # Public booking page (3-step flow)
  api/
    businesses/
      [id]/
        services/
          route.ts         # GET services for a business
        availability/
          route.ts         # GET available slots for date
    bookings/
      route.ts             # Existing - enhance for service data

components/
  booking/
    ServiceSelector.tsx    # Service cards with pricing
    DatePicker.tsx         # Calendar component
    TimeSlotGrid.tsx       # Available time slots display
    BookingConfirmation.tsx # Summary before submit
    BookingSummary.tsx     # Final confirmation display

lib/
  availability.ts          # Time slot generation utilities

prisma/
  schema.prisma            # Add Service model
```

### Pattern 1: Three-Step Booking Flow
**What:** Progressive disclosure booking wizard
**When to use:** Complex booking with service selection, date, and confirmation
**Example:**
```typescript
// Booking page state machine
type BookingStep = 'service' | 'datetime' | 'confirm';

interface BookingState {
  step: BookingStep;
  selectedService: Service | null;
  selectedDate: Date | null;
  selectedTime: string | null;
}

// Step transitions
const handleServiceSelect = (service: Service) => {
  setBookingState({ ...state, selectedService: service, step: 'datetime' });
};

const handleSlotSelect = (date: Date, time: string) => {
  setBookingState({ ...state, selectedDate: date, selectedTime: time, step: 'confirm' });
};
```

### Pattern 2: Time Slot Generation
**What:** Generate available slots from BusinessAvailability minus booked slots
**When to use:** Displaying available appointment times
**Example:**
```typescript
// lib/availability.ts
import { addMinutes, format, parse, isAfter, isBefore } from 'date-fns';

interface TimeSlot {
  time: string;      // "09:00"
  available: boolean;
  reason?: string;   // "Already booked" | "Outside hours"
}

export function generateTimeSlots(
  availability: BusinessAvailability,
  existingBookings: Booking[],
  date: Date,
  serviceDuration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = availability.slotDuration || serviceDuration;
  const buffer = availability.bufferTime || 0;

  let current = parse(availability.startTime, 'HH:mm', date);
  const end = parse(availability.endTime, 'HH:mm', date);

  while (isBefore(current, end)) {
    const timeStr = format(current, 'HH:mm');
    const slotEnd = addMinutes(current, serviceDuration);

    // Check if slot overlaps with any booking
    const isBooked = existingBookings.some(booking => {
      const bookingStart = parse(booking.appointmentTime, 'HH:mm', date);
      const bookingEnd = addMinutes(bookingStart, booking.duration);
      return !(slotEnd <= bookingStart || current >= bookingEnd);
    });

    slots.push({
      time: timeStr,
      available: !isBooked && isBefore(slotEnd, end),
      reason: isBooked ? 'Already booked' : undefined
    });

    current = addMinutes(current, slotDuration + buffer);
  }

  return slots;
}
```

### Pattern 3: Service Model with Business Relationship
**What:** Dedicated model for bookable services
**When to use:** Services need structured data (price, duration, description)
**Example:**
```prisma
// Addition to schema.prisma
model Service {
  id          String   @id @default(cuid())
  businessId  String
  name        String
  description String?  @db.Text
  price       Float
  priceType   String   @default("fixed") // fixed, starting, hourly, custom
  duration    Int      // in minutes
  category    String?
  isActive    Boolean  @default(true)
  isFeatured  Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  bookings Booking[]

  @@index([businessId])
  @@index([businessId, isActive])
}
```

### Anti-Patterns to Avoid
- **Storing service details only in booking record:** Loses price history, makes service management impossible
- **Generating all slots on frontend:** Performance issue, should be server-side
- **Not validating slot availability before booking:** Race condition allows double-booking
- **Hardcoding business hours:** Must use BusinessAvailability model
- **Ignoring timezone:** All times should be stored in business timezone

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date parsing/formatting | Custom date utilities | `date-fns` | Edge cases with timezones, DST |
| Calendar UI | Custom grid component | `react-day-picker` | Accessibility, keyboard nav, localization |
| Date math | Manual calculations | `date-fns addMinutes, isBefore` | Leap years, month boundaries |
| Form validation | Manual checks | `zod` schema + react-hook-form | Consistent validation patterns |

**Key insight:** Time/date handling has countless edge cases (DST transitions, leap seconds, timezone offsets). Using battle-tested libraries prevents subtle bugs that only appear in production.

## Common Pitfalls

### Pitfall 1: Double Booking Race Condition
**What goes wrong:** Two users select same slot, both submit, both get confirmed
**Why it happens:** Availability check happens before booking creation, not atomically
**How to avoid:** Use database transaction with row-level locking when creating booking
**Warning signs:** Multiple bookings for same time slot in database

### Pitfall 2: Timezone Confusion
**What goes wrong:** User in different timezone sees wrong available times
**Why it happens:** Mixing local time, UTC, and business timezone
**How to avoid:**
- Store all times in business's local timezone
- Display times in user's timezone with clear timezone indicator
- Use ISO strings for API communication
**Warning signs:** Appointments showing at wrong times

### Pitfall 3: Stale Availability Data
**What goes wrong:** Calendar shows slot as available, but it was just booked
**Why it happens:** Frontend caches availability, doesn't refetch
**How to avoid:**
- Short cache TTL for availability API
- Revalidate on step transitions
- Show "Checking availability..." before final confirmation
**Warning signs:** Users complain slot was taken when they try to book

### Pitfall 4: Services Stored in localStorage
**What goes wrong:** Dashboard services page works but data doesn't persist across devices
**Why it happens:** Current implementation uses localStorage for demo purposes
**How to avoid:** Migrate to Service Prisma model with proper API routes
**Warning signs:** Services disappear when user clears browser data

### Pitfall 5: Missing Mock Mode Support
**What goes wrong:** New features work with Prisma but break in USE_MOCK_DATA=true mode
**Why it happens:** Forgetting to add mock implementations in `lib/mock-data/client.ts`
**How to avoid:**
- Always implement mock versions alongside real implementations
- Test in both modes during development
**Warning signs:** App crashes when USE_MOCK_DATA=true

## Code Examples

### Calendar Component with react-day-picker
```typescript
// components/booking/DatePicker.tsx
"use client";

import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DatePickerProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  disabledDays?: Date[];
  availableDays?: number[]; // 0-6 for days of week
  minDate?: Date;
}

export function DatePicker({
  selected,
  onSelect,
  disabledDays = [],
  availableDays,
  minDate = new Date(),
}: DatePickerProps) {
  const disableMatcher = (date: Date) => {
    // Disable past dates
    if (date < minDate) return true;

    // Disable days not in business hours
    if (availableDays && !availableDays.includes(date.getDay())) {
      return true;
    }

    // Disable specific dates (exceptions)
    return disabledDays.some(d =>
      d.toDateString() === date.toDateString()
    );
  };

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={disableMatcher}
      showOutsideDays={false}
      className="p-3"
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: cn(
          "h-9 w-9 p-0 font-normal",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:bg-accent focus:text-accent-foreground"
        ),
        day_selected: "bg-primary text-primary-foreground hover:bg-primary",
        day_disabled: "text-muted-foreground opacity-50",
        day_outside: "text-muted-foreground opacity-50",
      }}
    />
  );
}
```

### Time Slot Grid Component
```typescript
// components/booking/TimeSlotGrid.tsx
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

export function TimeSlotGrid({ slots, selectedTime, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No available times for this date. Please select another date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {slots.map((slot) => (
        <Button
          key={slot.time}
          variant={selectedTime === slot.time ? "default" : "outline"}
          size="sm"
          disabled={!slot.available}
          onClick={() => onSelect(slot.time)}
          className={cn(
            "w-full",
            !slot.available && "opacity-50 cursor-not-allowed"
          )}
          title={slot.reason}
        >
          {slot.time}
        </Button>
      ))}
    </div>
  );
}
```

### Availability API Route
```typescript
// app/api/businesses/[id]/availability/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTimeSlots } from "@/lib/availability";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const duration = searchParams.get("duration");

  if (!dateStr) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();

  // Get business availability for this day
  const availability = await db.businessAvailability.findUnique({
    where: {
      businessId_dayOfWeek: { businessId, dayOfWeek }
    }
  });

  if (!availability || !availability.isAvailable) {
    return NextResponse.json({ slots: [], message: "Business closed on this day" });
  }

  // Check for exception on this date
  const exception = await db.availabilityException.findUnique({
    where: {
      businessId_date: { businessId, date: startOfDay(date) }
    }
  });

  if (exception && !exception.isAvailable) {
    return NextResponse.json({
      slots: [],
      message: exception.reason || "Business closed on this date"
    });
  }

  // Get existing bookings for this date
  const existingBookings = await db.booking.findMany({
    where: {
      businessId,
      appointmentDate: {
        gte: startOfDay(date),
        lte: endOfDay(date)
      },
      status: { in: ["PENDING", "CONFIRMED"] }
    }
  });

  // Generate available slots
  const serviceDuration = duration ? parseInt(duration) : 60;
  const slots = generateTimeSlots(
    availability,
    existingBookings,
    date,
    serviceDuration
  );

  return NextResponse.json({ slots });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| moment.js for dates | date-fns | 2020+ | Smaller bundle, tree-shakeable |
| jQuery datepicker | react-day-picker | 2018+ | React-native, accessible |
| Full calendar libraries | Minimal picker + custom grid | 2022+ | Better UX for booking vs. viewing |
| Server-side rendering of time slots | Client-side with API | Current | Better interactivity |

**Deprecated/outdated:**
- moment.js: Large bundle, use date-fns instead
- FullCalendar for simple booking: Overkill, designed for viewing not picking
- react-dates (Airbnb): Unmaintained since 2021

## Open Questions

1. **Service Duration vs Slot Duration**
   - What we know: BusinessAvailability has slotDuration, Service has duration
   - What's unclear: Should slot duration always match service duration, or be configurable separately?
   - Recommendation: Use service duration as minimum, slot duration as the grid interval

2. **Max Bookings Per Slot**
   - What we know: BusinessAvailability has maxBookings field
   - What's unclear: Is this used for parallel appointments (e.g., multiple chairs at a salon)?
   - Recommendation: Default to 1 for Phase 1, document for Phase 3 enhancement

3. **Buffer Time Between Appointments**
   - What we know: BusinessAvailability has bufferTime field
   - What's unclear: Should buffer show as unavailable or just hidden?
   - Recommendation: Add buffer to slot calculation, don't show as separate blocked time

## Sources

### Primary (HIGH confidence)
- Prisma schema analysis - `/Users/saeed/Desktop/Manaakhah/prisma/schema.prisma`
- Existing bookings API - `/Users/saeed/Desktop/Manaakhah/app/api/bookings/route.ts`
- Dashboard services page - `/Users/saeed/Desktop/Manaakhah/app/dashboard/services/page.tsx`
- Mock data client - `/Users/saeed/Desktop/Manaakhah/lib/mock-data/client.ts`
- package.json dependencies - `/Users/saeed/Desktop/Manaakhah/package.json`

### Secondary (MEDIUM confidence)
- [Radix UI DatePicker Discussion](https://github.com/radix-ui/primitives/discussions/969)
- [react-day-picker documentation](https://react-day-picker.js.org/)
- [Builder.io React Calendar Guide](https://www.builder.io/blog/best-react-calendar-component-ai)
- [shadcn/ui Date Picker Patterns](https://www.jqueryscript.net/blog/best-shadcn-ui-date-picker.html)

### Tertiary (LOW confidence)
- [Mobiscroll Appointment Booking](https://demo.mobiscroll.com/react/calendar/appointment-booking)
- [DaySchedule Widget](https://dayschedule.com/docs/t/how-to-embed-appointment-booking-calendar-on-react/400)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-day-picker is industry standard, date-fns already installed
- Architecture: HIGH - Based on existing codebase patterns and Prisma models
- Pitfalls: HIGH - Common patterns well-documented in community
- Code examples: MEDIUM - Adapted from official docs, needs testing

**Research date:** 2026-01-21
**Valid until:** 2026-02-21 (30 days - stable domain)
