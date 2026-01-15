"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  loadCalendarConfig,
  saveCalendarConfig,
  loadSyncedEvents,
  getUpcomingEvents,
  addToCalendar,
  unsyncEvent,
  CalendarSyncConfig,
  CalendarEvent,
} from "@/lib/services/calendar-sync";

export default function CalendarSettingsPage() {
  const { data: session } = useMockSession();
  const [config, setConfig] = useState<CalendarSyncConfig | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [allSyncedEvents, setAllSyncedEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    setConfig(loadCalendarConfig());
    setUpcomingEvents(getUpcomingEvents(14));
    setAllSyncedEvents(loadSyncedEvents());
  }, []);

  const handleConfigChange = (updates: Partial<CalendarSyncConfig>) => {
    if (!config) return;
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveCalendarConfig(newConfig);
  };

  const handleConnectGoogle = () => {
    // In a real implementation, this would initiate OAuth flow
    handleConfigChange({ provider: config?.provider === "apple" ? "both" : "google", enabled: true });
  };

  const handleConnectApple = () => {
    // Apple Calendar uses .ics files, no OAuth needed
    handleConfigChange({ provider: config?.provider === "google" ? "both" : "apple", enabled: true });
  };

  const handleDisconnect = (provider: "google" | "apple") => {
    if (!config) return;
    if (config.provider === "both") {
      handleConfigChange({ provider: provider === "google" ? "apple" : "google" });
    } else {
      handleConfigChange({ provider: "none", enabled: false });
    }
  };

  const handleRemoveEvent = (eventId: string) => {
    unsyncEvent(eventId);
    setAllSyncedEvents(allSyncedEvents.filter((e) => e.id !== eventId));
    setUpcomingEvents(upcomingEvents.filter((e) => e.id !== eventId));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">
              Please sign in to manage your calendar sync settings.
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isGoogleConnected = config.provider === "google" || config.provider === "both";
  const isAppleConnected = config.provider === "apple" || config.provider === "both";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <Link href="/dashboard" className="text-primary hover:underline text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Calendar Sync</h1>
        <p className="text-gray-600 mb-6">
          Connect your calendar to automatically sync bookings and events
        </p>

        {/* Connected Calendars */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connected Calendars</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Calendar */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Google Calendar</h4>
                  <p className="text-sm text-gray-500">
                    {isGoogleConnected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              {isGoogleConnected ? (
                <Button variant="outline" onClick={() => handleDisconnect("google")}>
                  Disconnect
                </Button>
              ) : (
                <Button onClick={handleConnectGoogle}>Connect</Button>
              )}
            </div>

            {/* Apple Calendar */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">📅</span>
                </div>
                <div>
                  <h4 className="font-medium">Apple Calendar</h4>
                  <p className="text-sm text-gray-500">
                    {isAppleConnected ? "Enabled (via .ics files)" : "Not enabled"}
                  </p>
                </div>
              </div>
              {isAppleConnected ? (
                <Button variant="outline" onClick={() => handleDisconnect("apple")}>
                  Disable
                </Button>
              ) : (
                <Button onClick={handleConnectApple}>Enable</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        {config.enabled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Auto-sync new events</p>
                  <p className="text-sm text-gray-500">
                    Automatically add new bookings and events to your calendar
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSync}
                    onChange={(e) => handleConfigChange({ autoSync: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-t">
                <div>
                  <p className="font-medium">Sync bookings</p>
                  <p className="text-sm text-gray-500">
                    Add your appointments and bookings to calendar
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.syncBookings}
                    onChange={(e) => handleConfigChange({ syncBookings: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-t">
                <div>
                  <p className="font-medium">Sync community events</p>
                  <p className="text-sm text-gray-500">
                    Add events you're attending to calendar
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.syncEvents}
                    onChange={(e) => handleConfigChange({ syncEvents: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-t">
                <div>
                  <p className="font-medium">Prayer time reminders</p>
                  <p className="text-sm text-gray-500">
                    Add prayer time reminders to calendar
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.syncReminders}
                    onChange={(e) => handleConfigChange({ syncReminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Synced Events */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upcoming Synced Events</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-600">No upcoming synced events</p>
                <p className="text-sm text-gray-500">
                  Events will appear here when you sync them to your calendar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {event.eventType === "booking"
                          ? "📆"
                          : event.eventType === "event"
                          ? "🎉"
                          : "🕌"}
                      </div>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(event.startDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isGoogleConnected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCalendar(event, "google")}
                        >
                          Add to Google
                        </Button>
                      )}
                      {isAppleConnected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCalendar(event, "apple")}
                        >
                          Add to Apple
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveEvent(event.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">How Calendar Sync Works</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Google Calendar:</strong> Opens Google Calendar with event details pre-filled</li>
              <li>• <strong>Apple Calendar:</strong> Downloads an .ics file you can open with Calendar app</li>
              <li>• <strong>Auto-sync:</strong> When enabled, new bookings are automatically added</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
