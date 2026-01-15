// Calendar Sync Service
// Handles Google Calendar and Apple Calendar integration

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  url?: string;
  businessId?: string;
  eventType: "booking" | "event" | "reminder";
}

export interface CalendarSyncConfig {
  enabled: boolean;
  provider: "google" | "apple" | "both" | "none";
  autoSync: boolean;
  syncBookings: boolean;
  syncEvents: boolean;
  syncReminders: boolean;
}

const CONFIG_KEY = "manakhaah-calendar-config";
const EVENTS_KEY = "manakhaah-calendar-events";

// Default configuration
export const defaultConfig: CalendarSyncConfig = {
  enabled: false,
  provider: "none",
  autoSync: true,
  syncBookings: true,
  syncEvents: true,
  syncReminders: true,
};

// Load configuration
export function loadCalendarConfig(): CalendarSyncConfig {
  if (typeof window === "undefined") return defaultConfig;

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error loading calendar config:", error);
  }
  return defaultConfig;
}

// Save configuration
export function saveCalendarConfig(config: CalendarSyncConfig): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Error saving calendar config:", error);
  }
}

// Load synced events
export function loadSyncedEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    if (stored) {
      const events = JSON.parse(stored);
      // Convert date strings back to Date objects
      return events.map((e: CalendarEvent) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: new Date(e.endDate),
      }));
    }
  } catch (error) {
    console.error("Error loading synced events:", error);
  }
  return [];
}

// Save synced events
export function saveSyncedEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (error) {
    console.error("Error saving synced events:", error);
  }
}

// Generate Google Calendar URL
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${formatDateForGoogle(event.startDate)}/${formatDateForGoogle(event.endDate)}`,
  });

  return `${baseUrl}?${params.toString()}`;
}

// Generate Apple Calendar (.ics) file content
export function generateICSContent(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Manakhaah//Calendar//EN
BEGIN:VEVENT
UID:${event.id}@manakhaah.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, "\\n")}
LOCATION:${event.location}
${event.url ? `URL:${event.url}` : ""}
END:VEVENT
END:VCALENDAR`;
}

// Download ICS file
export function downloadICSFile(event: CalendarEvent): void {
  const content = generateICSContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, "-")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format date for Google Calendar URL
function formatDateForGoogle(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// Add event to calendar (opens appropriate calendar)
export function addToCalendar(event: CalendarEvent, provider: "google" | "apple"): void {
  if (provider === "google") {
    window.open(generateGoogleCalendarUrl(event), "_blank");
  } else {
    downloadICSFile(event);
  }
}

// Sync event to saved events list
export function syncEventToList(event: CalendarEvent): void {
  const events = loadSyncedEvents();
  const existingIndex = events.findIndex((e) => e.id === event.id);

  if (existingIndex >= 0) {
    events[existingIndex] = event;
  } else {
    events.push(event);
  }

  saveSyncedEvents(events);
}

// Remove event from synced list
export function unsyncEvent(eventId: string): void {
  const events = loadSyncedEvents();
  saveSyncedEvents(events.filter((e) => e.id !== eventId));
}

// Create booking event
export function createBookingEvent(booking: {
  id: string;
  businessName: string;
  serviceName: string;
  date: Date;
  duration: number; // in minutes
  address: string;
  notes?: string;
}): CalendarEvent {
  const endDate = new Date(booking.date.getTime() + booking.duration * 60000);

  return {
    id: `booking-${booking.id}`,
    title: `${booking.serviceName} at ${booking.businessName}`,
    description: booking.notes || `Booking at ${booking.businessName}`,
    location: booking.address,
    startDate: booking.date,
    endDate,
    eventType: "booking",
  };
}

// Create community event
export function createCommunityEvent(event: {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}): CalendarEvent {
  return {
    id: `event-${event.id}`,
    title: event.title,
    description: event.description,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    url: event.url,
    eventType: "event",
  };
}

// Create prayer reminder
export function createPrayerReminder(
  prayerName: string,
  time: Date,
  masjidName?: string,
  masjidAddress?: string
): CalendarEvent {
  const endDate = new Date(time.getTime() + 30 * 60000); // 30 min duration

  return {
    id: `prayer-${prayerName}-${time.toISOString()}`,
    title: `${prayerName} Prayer${masjidName ? ` at ${masjidName}` : ""}`,
    description: `Time for ${prayerName} prayer`,
    location: masjidAddress || "",
    startDate: time,
    endDate,
    eventType: "reminder",
  };
}

// Check if Google Calendar API is available (for future OAuth implementation)
export function isGoogleCalendarApiAvailable(): boolean {
  // This would check for Google API availability
  // For now, we use URL-based approach which works without API
  return true;
}

// Get upcoming synced events
export function getUpcomingEvents(days: number = 7): CalendarEvent[] {
  const events = loadSyncedEvents();
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return events
    .filter((e) => e.startDate >= now && e.startDate <= future)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}
