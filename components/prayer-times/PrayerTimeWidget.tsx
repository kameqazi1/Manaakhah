"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface PrayerTimeWidgetProps {
  latitude?: number;
  longitude?: number;
  city?: string;
}

export function PrayerTimeWidget({
  latitude = 37.5485,
  longitude = -121.9886,
  city = "Fremont, CA",
}: PrayerTimeWidgetProps) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchPrayerTimes();
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [latitude, longitude]);

  useEffect(() => {
    if (prayerTimes) {
      calculateNextPrayer();
    }
  }, [prayerTimes, currentTime]);

  const fetchPrayerTimes = async () => {
    try {
      const response = await fetch(
        `/api/prayer-times?lat=${latitude}&lng=${longitude}`
      );

      if (response.ok) {
        const data = await response.json();
        setPrayerTimes(data.timings);
      }
    } catch (error) {
      console.error("Error fetching prayer times:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextPrayer = () => {
    if (!prayerTimes) return;

    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: "Fajr", time: prayerTimes.Fajr },
      { name: "Dhuhr", time: prayerTimes.Dhuhr },
      { name: "Asr", time: prayerTimes.Asr },
      { name: "Maghrib", time: prayerTimes.Maghrib },
      { name: "Isha", time: prayerTimes.Isha },
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(":").map(Number);
      const prayerMinutes = hours * 60 + minutes;

      if (prayerMinutes > currentMinutes) {
        setNextPrayer(prayer);
        return;
      }
    }

    // If no prayer is left today, next is Fajr tomorrow
    setNextPrayer({ name: "Fajr", time: prayerTimes.Fajr });
  };

  const getTimeUntilNext = () => {
    if (!nextPrayer) return "";

    const now = currentTime;
    const [hours, minutes] = nextPrayer.time.split(":").map(Number);
    const prayerTime = new Date(now);
    prayerTime.setHours(hours, minutes, 0, 0);

    // If prayer time is earlier than now, it's tomorrow
    if (prayerTime < now) {
      prayerTime.setDate(prayerTime.getDate() + 1);
    }

    const diff = prayerTime.getTime() - now.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minutesLeft}m`;
    }
    return `${minutesLeft}m`;
  };

  const getPrayerIcon = (name: string) => {
    const icons: Record<string, string> = {
      Fajr: "🌅",
      Dhuhr: "☀️",
      Asr: "🌤️",
      Maghrib: "🌇",
      Isha: "🌙",
    };
    return icons[name] || "🕌";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-gray-500">
            Loading prayer times...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prayerTimes) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>🕌</span>
          Prayer Times
        </CardTitle>
        <p className="text-xs text-gray-600">{city}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Next Prayer Countdown */}
        {nextPrayer && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getPrayerIcon(nextPrayer.name)}</span>
                <div>
                  <div className="font-semibold text-sm text-green-900">
                    Next: {nextPrayer.name}
                  </div>
                  <div className="text-xs text-green-700">
                    in {getTimeUntilNext()}
                  </div>
                </div>
              </div>
              <div className="text-lg font-bold text-green-900">
                {nextPrayer.time}
              </div>
            </div>
          </div>
        )}

        {/* All Prayer Times */}
        <div className="space-y-2">
          {Object.entries(prayerTimes).map(([name, time]) => (
            <div
              key={name}
              className={`flex items-center justify-between py-2 px-3 rounded ${
                nextPrayer?.name === name
                  ? "bg-green-100"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{getPrayerIcon(name)}</span>
                <span className="font-medium text-sm">{name}</span>
              </div>
              <span className="font-semibold text-sm">{time}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t text-xs text-center text-gray-500">
          Times updated daily
        </div>
      </CardContent>
    </Card>
  );
}
