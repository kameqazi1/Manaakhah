import { addMinutes, format, parse, isBefore, isAfter } from "date-fns";

export interface TimeSlot {
  time: string; // "09:00" format
  available: boolean;
  reason?: string; // "Already booked", "Outside hours", etc.
}

export interface BusinessAvailabilityData {
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDuration: number; // in minutes
  bufferTime: number; // buffer between appointments in minutes
  isAvailable: boolean;
}

export interface ExistingBooking {
  appointmentTime: string; // "09:00"
  duration: number; // in minutes
}

/**
 * Generate available time slots for a given date based on business availability
 * and existing bookings.
 */
export function generateTimeSlots(
  availability: BusinessAvailabilityData,
  existingBookings: ExistingBooking[],
  date: Date,
  serviceDuration: number
): TimeSlot[] {
  if (!availability.isAvailable) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const slotInterval = availability.slotDuration || serviceDuration;
  const buffer = availability.bufferTime || 0;

  // Parse start and end times
  let current = parse(availability.startTime, "HH:mm", date);
  const end = parse(availability.endTime, "HH:mm", date);

  // Generate slots
  while (isBefore(current, end)) {
    const timeStr = format(current, "HH:mm");
    const slotEnd = addMinutes(current, serviceDuration);

    // Check if slot extends beyond business hours
    if (isAfter(slotEnd, end)) {
      break;
    }

    // Check if slot overlaps with any existing booking
    const conflictingBooking = existingBookings.find((booking) => {
      const bookingStart = parse(booking.appointmentTime, "HH:mm", date);
      const bookingEnd = addMinutes(bookingStart, booking.duration);

      // Add buffer to booking end
      const bookingEndWithBuffer = addMinutes(bookingEnd, buffer);

      // Check for overlap: slot starts before booking ends AND slot ends after booking starts
      return isBefore(current, bookingEndWithBuffer) && isAfter(slotEnd, bookingStart);
    });

    slots.push({
      time: timeStr,
      available: !conflictingBooking,
      reason: conflictingBooking ? "Already booked" : undefined,
    });

    // Move to next slot
    current = addMinutes(current, slotInterval);
  }

  return slots;
}

/**
 * Format time for display (12-hour format)
 */
export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Check if a date is a valid booking date (not in the past, not too far in future)
 */
export function isValidBookingDate(date: Date, maxDaysAhead: number = 90): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDaysAhead);
  maxDate.setHours(23, 59, 59, 999);

  return date >= today && date <= maxDate;
}
