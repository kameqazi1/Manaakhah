"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PrayerTime {
  name: string;
  nameArabic: string;
  time: string;
  icon: string;
}

interface Location {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

interface NearbyMasjid {
  id: string;
  name: string;
  distance: number;
  address: string;
  nextPrayer?: string;
  hasJummah: boolean;
}

// Helper to calculate prayer times (simplified mock calculation)
function calculatePrayerTimes(date: Date, location: Location): PrayerTime[] {
  // These would normally be calculated based on sun position
  // Using mock times for demonstration
  const baseHours = {
    fajr: 5,
    sunrise: 6,
    dhuhr: 12,
    asr: 15,
    maghrib: 18,
    isha: 19,
  };

  // Adjust slightly based on latitude (simplified)
  const latAdjust = Math.abs(location.lat - 34) * 0.02;

  const formatTime = (hour: number, minute: number = 0) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60 + minute);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  return [
    { name: "Fajr", nameArabic: "الفجر", time: formatTime(baseHours.fajr + latAdjust, 30), icon: "🌙" },
    { name: "Sunrise", nameArabic: "الشروق", time: formatTime(baseHours.sunrise + latAdjust, 45), icon: "🌅" },
    { name: "Dhuhr", nameArabic: "الظهر", time: formatTime(baseHours.dhuhr + latAdjust, 15), icon: "☀️" },
    { name: "Asr", nameArabic: "العصر", time: formatTime(baseHours.asr + latAdjust, 45), icon: "🌤️" },
    { name: "Maghrib", nameArabic: "المغرب", time: formatTime(baseHours.maghrib + latAdjust, 20), icon: "🌇" },
    { name: "Isha", nameArabic: "العشاء", time: formatTime(baseHours.isha + latAdjust, 30), icon: "🌃" },
  ];
}

function getNextPrayer(prayerTimes: PrayerTime[]): PrayerTime | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const prayer of prayerTimes) {
    const [time, ampm] = prayer.time.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let prayerHours = hours;
    if (ampm === "PM" && hours !== 12) prayerHours += 12;
    if (ampm === "AM" && hours === 12) prayerHours = 0;
    const prayerMinutes = prayerHours * 60 + minutes;

    if (prayerMinutes > currentMinutes && prayer.name !== "Sunrise") {
      return prayer;
    }
  }

  return prayerTimes[0]; // Return Fajr for next day
}

function getTimeUntilPrayer(prayerTime: string): string {
  const now = new Date();
  const [time, ampm] = prayerTime.split(" ");
  const [hours, minutes] = time.split(":").map(Number);
  let prayerHours = hours;
  if (ampm === "PM" && hours !== 12) prayerHours += 12;
  if (ampm === "AM" && hours === 12) prayerHours = 0;

  const prayerDate = new Date();
  prayerDate.setHours(prayerHours, minutes, 0, 0);

  if (prayerDate < now) {
    prayerDate.setDate(prayerDate.getDate() + 1);
  }

  const diff = prayerDate.getTime() - now.getTime();
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours === 0) {
    return `${diffMinutes}m`;
  }
  return `${diffHours}h ${diffMinutes}m`;
}

const mockNearbyMasjids: NearbyMasjid[] = [
  { id: "m1", name: "Islamic Center of Los Angeles", distance: 1.2, address: "434 S Vermont Ave", nextPrayer: "12:15 PM", hasJummah: true },
  { id: "m2", name: "King Fahad Mosque", distance: 2.5, address: "10980 Washington Blvd", nextPrayer: "12:30 PM", hasJummah: true },
  { id: "m3", name: "Omar Ibn Al-Khattab Mosque", distance: 3.8, address: "1025 S Exposition Blvd", nextPrayer: "12:20 PM", hasJummah: true },
  { id: "m4", name: "Masjid Al-Rasool", distance: 4.2, address: "4016 S Central Ave", nextPrayer: "12:25 PM", hasJummah: false },
];

export default function PrayerTimesPage() {
  const { data: session } = useMockSession();
  const [location, setLocation] = useState<Location | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    getLocation();
    loadNotificationPreference();
  }, []);

  useEffect(() => {
    if (location) {
      const times = calculatePrayerTimes(selectedDate, location);
      setPrayerTimes(times);
    }
  }, [location, selectedDate]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: "Los Angeles", // Would normally reverse geocode
            country: "USA",
          });
          setLoading(false);
        },
        () => {
          // Default to LA
          setLocation({
            lat: 34.0522,
            lng: -118.2437,
            city: "Los Angeles",
            country: "USA",
          });
          setLoading(false);
        }
      );
    } else {
      setLocation({
        lat: 34.0522,
        lng: -118.2437,
        city: "Los Angeles",
        country: "USA",
      });
      setLoading(false);
    }
  };

  const loadNotificationPreference = () => {
    const saved = localStorage.getItem("manakhaah-prayer-notifications");
    setNotificationsEnabled(saved === "true");
  };

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem("manakhaah-prayer-notifications", String(newValue));
  };

  const nextPrayer = getNextPrayer(prayerTimes);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Detecting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Prayer Times</h1>
        <p className="text-gray-600 mb-6">
          {location?.city}, {location?.country}
        </p>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => changeDate(-1)}>
            &larr; Previous
          </Button>
          <div className="text-center">
            <p className="font-semibold">{formatDate(selectedDate)}</p>
            {selectedDate.toDateString() !== new Date().toDateString() && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-sm text-primary hover:underline"
              >
                Go to Today
              </button>
            )}
          </div>
          <Button variant="outline" onClick={() => changeDate(1)}>
            Next &rarr;
          </Button>
        </div>

        {/* Next Prayer Highlight */}
        {nextPrayer && selectedDate.toDateString() === new Date().toDateString() && (
          <Card className="mb-6 bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Next Prayer</p>
                  <h2 className="text-3xl font-bold">
                    {nextPrayer.icon} {nextPrayer.name}
                  </h2>
                  <p className="text-xl mt-1">{nextPrayer.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm">Time Remaining</p>
                  <p className="text-4xl font-bold">{getTimeUntilPrayer(nextPrayer.time)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Prayer Times */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Daily Prayer Schedule</span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleNotifications}
              >
                {notificationsEnabled ? "🔔 Notifications On" : "🔕 Notifications Off"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prayerTimes.map((prayer) => {
                const isNext = nextPrayer?.name === prayer.name && selectedDate.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={prayer.name}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isNext ? "bg-green-50 border-2 border-green-200" : "hover:bg-gray-50"
                    } ${prayer.name === "Sunrise" ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{prayer.icon}</span>
                      <div>
                        <p className="font-semibold">{prayer.name}</p>
                        <p className="text-sm text-gray-500">{prayer.nameArabic}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{prayer.time}</p>
                      {isNext && (
                        <Badge className="bg-green-100 text-green-700">Next</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Nearby Masjids */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nearby Masjids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockNearbyMasjids.map((masjid) => (
                <Link
                  key={masjid.id}
                  href={`/business/${masjid.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{masjid.name}</p>
                    <p className="text-sm text-gray-500">{masjid.address}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {masjid.distance} mi
                      </Badge>
                      {masjid.hasJummah && (
                        <Badge variant="secondary" className="text-xs">
                          Jummah Available
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {masjid.nextPrayer && (
                      <>
                        <p className="text-sm text-gray-500">Next Salah</p>
                        <p className="font-semibold">{masjid.nextPrayer}</p>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link href="/search?category=MASJID">
                <Button variant="outline" className="w-full">
                  View All Masjids
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Qibla Direction */}
        <Card>
          <CardHeader>
            <CardTitle>Qibla Direction</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
              <div
                className="absolute top-1/2 left-1/2 w-1 h-16 bg-green-600 origin-bottom transform -translate-x-1/2"
                style={{ transform: "translateX(-50%) rotate(45deg)" }}
              ></div>
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-green-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <p className="text-gray-600">
              Qibla is approximately <strong>45° NE</strong> from your location
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Distance to Makkah: ~7,500 miles
            </p>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Prayer Time Settings</h4>
                <p className="text-sm text-gray-600">
                  Customize calculation method and notification preferences
                </p>
              </div>
              <Link href="/settings/prayer-times">
                <Button variant="outline">Settings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
