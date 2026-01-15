"use client";

// Push Notification Service
// Handles browser push notifications with localStorage persistence for mock mode

export interface PushNotificationPreferences {
  enabled: boolean;
  newReviews: boolean;
  newMessages: boolean;
  bookingUpdates: boolean;
  dealAlerts: boolean;
  savedSearchAlerts: boolean;
  eventReminders: boolean;
  priceDrops: boolean;
  systemAnnouncements: boolean;
}

export const defaultPreferences: PushNotificationPreferences = {
  enabled: false,
  newReviews: true,
  newMessages: true,
  bookingUpdates: true,
  dealAlerts: true,
  savedSearchAlerts: true,
  eventReminders: true,
  priceDrops: false,
  systemAnnouncements: true,
};

const STORAGE_KEY = "manakhaah-push-preferences";
const SUBSCRIPTION_KEY = "manakhaah-push-subscription";

// Check if push notifications are supported
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

// Get current notification permission status
export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

// Request notification permission
export async function requestPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) return "unsupported";

  const permission = await Notification.requestPermission();
  return permission;
}

// Load preferences from localStorage
export function loadPreferences(): PushNotificationPreferences {
  if (typeof window === "undefined") return defaultPreferences;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error loading push preferences:", error);
  }
  return defaultPreferences;
}

// Save preferences to localStorage
export function savePreferences(prefs: PushNotificationPreferences): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error("Error saving push preferences:", error);
  }
}

// Show a local notification (for mock mode / testing)
export function showLocalNotification(title: string, options?: NotificationOptions): void {
  if (!isPushSupported()) return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    ...options,
  });

  // Auto close after 5 seconds
  setTimeout(() => notification.close(), 5000);
}

// Subscribe to push notifications (mock implementation)
export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await requestPermission();
  if (permission !== "granted") return false;

  try {
    // In a real implementation, this would register with a push service
    // For mock mode, we just store the subscription locally
    const subscription = {
      endpoint: `mock://push/${userId}`,
      userId,
      subscribedAt: new Date().toISOString(),
    };

    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));

    // Update preferences
    const prefs = loadPreferences();
    prefs.enabled = true;
    savePreferences(prefs);

    return true;
  } catch (error) {
    console.error("Error subscribing to push:", error);
    return false;
  }
}

// Unsubscribe from push notifications
export function unsubscribeFromPush(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SUBSCRIPTION_KEY);
    const prefs = loadPreferences();
    prefs.enabled = false;
    savePreferences(prefs);
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
  }
}

// Check if user is subscribed
export function isSubscribed(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const subscription = localStorage.getItem(SUBSCRIPTION_KEY);
    return !!subscription;
  } catch {
    return false;
  }
}

// Notification types and their handlers
export type NotificationType =
  | "NEW_REVIEW"
  | "NEW_MESSAGE"
  | "BOOKING_UPDATE"
  | "DEAL_ALERT"
  | "SAVED_SEARCH_MATCH"
  | "EVENT_REMINDER"
  | "PRICE_DROP"
  | "SYSTEM_ANNOUNCEMENT";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Send notification based on type (checks preferences)
export function sendNotification(payload: NotificationPayload): void {
  const prefs = loadPreferences();
  if (!prefs.enabled) return;

  // Check if this type is enabled
  const typePrefs: Record<NotificationType, keyof PushNotificationPreferences> = {
    NEW_REVIEW: "newReviews",
    NEW_MESSAGE: "newMessages",
    BOOKING_UPDATE: "bookingUpdates",
    DEAL_ALERT: "dealAlerts",
    SAVED_SEARCH_MATCH: "savedSearchAlerts",
    EVENT_REMINDER: "eventReminders",
    PRICE_DROP: "priceDrops",
    SYSTEM_ANNOUNCEMENT: "systemAnnouncements",
  };

  const prefKey = typePrefs[payload.type];
  if (!prefs[prefKey]) return;

  showLocalNotification(payload.title, {
    body: payload.body,
    tag: payload.type,
    data: { url: payload.url, ...payload.data },
  });
}
