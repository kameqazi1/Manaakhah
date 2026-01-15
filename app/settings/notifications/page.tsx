"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  isPushSupported,
  getPermissionStatus,
  loadPreferences,
  savePreferences,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
  PushNotificationPreferences,
  showLocalNotification,
} from "@/lib/services/push-notifications";

export default function NotificationSettingsPage() {
  const { data: session } = useMockSession();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<PushNotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(getPermissionStatus());
    setSubscribed(isSubscribed());
    setPreferences(loadPreferences());
  }, []);

  const handleEnableNotifications = async () => {
    if (!session?.user?.id) return;

    setSaving(true);
    const success = await subscribeToPush(session.user.id);
    if (success) {
      setSubscribed(true);
      setPermission("granted");
      setPreferences(loadPreferences());
      showLocalNotification("Notifications Enabled!", {
        body: "You will now receive push notifications from Manakhaah.",
      });
    }
    setSaving(false);
  };

  const handleDisableNotifications = () => {
    unsubscribeFromPush();
    setSubscribed(false);
    setPreferences(loadPreferences());
  };

  const handleTogglePreference = (key: keyof PushNotificationPreferences) => {
    if (!preferences) return;

    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const handleTestNotification = () => {
    showLocalNotification("Test Notification", {
      body: "This is a test notification from Manakhaah!",
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">
              Please sign in to manage your notification preferences.
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const notificationTypes = [
    { key: "newMessages" as const, label: "New Messages", icon: "💬", desc: "When someone sends you a message" },
    { key: "newReviews" as const, label: "New Reviews", icon: "⭐", desc: "When your business receives a review" },
    { key: "bookingUpdates" as const, label: "Booking Updates", icon: "📅", desc: "Booking confirmations and cancellations" },
    { key: "dealAlerts" as const, label: "Deal Alerts", icon: "🏷️", desc: "New deals from businesses you follow" },
    { key: "savedSearchAlerts" as const, label: "Saved Search Alerts", icon: "🔍", desc: "New businesses matching your saved searches" },
    { key: "eventReminders" as const, label: "Event Reminders", icon: "📆", desc: "Reminders for events you're attending" },
    { key: "priceDrops" as const, label: "Price Drops", icon: "💰", desc: "Price drops on services you've viewed" },
    { key: "systemAnnouncements" as const, label: "System Announcements", icon: "📢", desc: "Important platform updates" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/dashboard" className="text-primary hover:underline text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>

        {/* Browser Support Check */}
        {!supported && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold">Push Notifications Not Supported</h3>
                  <p className="text-sm text-gray-600">
                    Your browser does not support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Toggle */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🔔</span>
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {subscribed ? "Notifications are enabled" : "Notifications are disabled"}
                </p>
                <p className="text-sm text-gray-600">
                  {subscribed
                    ? "You will receive push notifications based on your preferences below."
                    : "Enable push notifications to stay updated on messages, reviews, and more."}
                </p>
              </div>
              {subscribed ? (
                <Button variant="outline" onClick={handleDisableNotifications}>
                  Disable
                </Button>
              ) : (
                <Button onClick={handleEnableNotifications} disabled={!supported || saving}>
                  {saving ? "Enabling..." : "Enable"}
                </Button>
              )}
            </div>

            {permission === "denied" && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                <strong>Permission Denied:</strong> You have blocked notifications for this site.
                Please update your browser settings to allow notifications from Manakhaah.
              </div>
            )}

            {subscribed && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={handleTestNotification}>
                  Send Test Notification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Types */}
        {subscribed && preferences && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationTypes.map((type) => (
                <div
                  key={type.key}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{type.icon}</span>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-gray-500">{type.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[type.key]}
                      onChange={() => handleTogglePreference(type.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Email Notifications */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📧</span>
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Email notification settings can be configured in your account settings.
            </p>
            <Link href="/settings/account">
              <Button variant="outline">Manage Email Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
