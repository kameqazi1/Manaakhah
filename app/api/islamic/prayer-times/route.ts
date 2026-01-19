import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/islamic/prayer-times - Get prayer times
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "Fremont";
    const date = searchParams.get("date");

    // Parse date or use today
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Try to get from database first
    let prayerTimes = await prisma.prayerTime.findUnique({
      where: {
        city_date: {
          city,
          date: targetDate,
        },
      },
    });

    if (!prayerTimes) {
      // Calculate prayer times using approximation
      // In production, use an API like Aladhan or local calculation library
      const times = calculatePrayerTimes(
        parseFloat(searchParams.get("lat") || "37.5485"),
        parseFloat(searchParams.get("lng") || "-121.9886"),
        targetDate
      );

      // Store in database
      prayerTimes = await prisma.prayerTime.create({
        data: {
          city,
          date: targetDate,
          fajr: times.fajr,
          sunrise: times.sunrise,
          dhuhr: times.dhuhr,
          asr: times.asr,
          maghrib: times.maghrib,
          isha: times.isha,
          hijriDate: getHijriDate(targetDate),
        },
      });
    }

    return NextResponse.json({
      prayerTimes: {
        city: prayerTimes.city,
        date: prayerTimes.date,
        hijriDate: prayerTimes.hijriDate,
        times: {
          fajr: prayerTimes.fajr,
          sunrise: prayerTimes.sunrise,
          dhuhr: prayerTimes.dhuhr,
          asr: prayerTimes.asr,
          maghrib: prayerTimes.maghrib,
          isha: prayerTimes.isha,
        },
      },
    });
  } catch (error) {
    console.error("Get prayer times error:", error);
    return NextResponse.json(
      { error: "Failed to get prayer times" },
      { status: 500 }
    );
  }
}

/**
 * Simple prayer time calculation (approximate)
 * For accurate times, use a proper Islamic astronomy library
 */
function calculatePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date
): Record<string, string> {
  // This is a simplified calculation
  // In production, use libraries like adhan-js or praytimes.js

  const dayOfYear = getDayOfYear(date);
  const timezone = -8; // PST, adjust as needed

  // Equation of time approximation
  const B = (360 / 365) * (dayOfYear - 81);
  const eot = 9.87 * Math.sin(2 * B * (Math.PI / 180)) -
    7.53 * Math.cos(B * (Math.PI / 180)) -
    1.5 * Math.sin(B * (Math.PI / 180));

  // Solar declination approximation
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180));

  // Solar noon
  const solarNoon = 12 - (longitude / 15) - (eot / 60) - timezone;

  // Hour angle calculations
  const latRad = latitude * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);

  // Sunrise/Sunset (0.833 degrees for atmospheric refraction)
  const sunriseAngle = Math.acos(
    (Math.sin(-0.833 * (Math.PI / 180)) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad))
  );
  const sunriseOffset = (sunriseAngle * 180 / Math.PI) / 15;

  // Calculate times
  const sunrise = solarNoon - sunriseOffset;
  const sunset = solarNoon + sunriseOffset;

  // Fajr (18 degrees below horizon - varies by school)
  const fajrAngle = Math.acos(
    (Math.sin(-18 * (Math.PI / 180)) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad))
  );
  const fajr = solarNoon - (fajrAngle * 180 / Math.PI) / 15;

  // Isha (17 degrees below horizon - varies by school)
  const ishaAngle = Math.acos(
    (Math.sin(-17 * (Math.PI / 180)) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad))
  );
  const isha = solarNoon + (ishaAngle * 180 / Math.PI) / 15;

  // Dhuhr (solar noon + 5 minutes for safety)
  const dhuhr = solarNoon + 5 / 60;

  // Asr (Shafi'i method - shadow equals object length)
  const asrShadowRatio = 1 + Math.tan(Math.abs(latRad - decRad));
  const asrAngle = Math.atan(1 / asrShadowRatio);
  const asrHA = Math.acos(
    (Math.sin(asrAngle) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad))
  );
  const asr = solarNoon + (asrHA * 180 / Math.PI) / 15;

  // Maghrib (sunset + 3 minutes for safety)
  const maghrib = sunset + 3 / 60;

  return {
    fajr: formatTime(fajr),
    sunrise: formatTime(sunrise),
    dhuhr: formatTime(dhuhr),
    asr: formatTime(asr),
    maghrib: formatTime(maghrib),
    isha: formatTime(isha),
  };
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function formatTime(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Approximate Hijri date conversion
 * For accurate conversion, use a proper library
 */
function getHijriDate(gregorianDate: Date): string {
  // Simplified approximation
  const epochGregorian = new Date(622, 6, 16); // July 16, 622 CE
  const diffDays = Math.floor(
    (gregorianDate.getTime() - epochGregorian.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Average Islamic lunar year is about 354.36667 days
  const hijriYear = Math.floor(diffDays / 354.36667) + 1;
  const daysInYear = diffDays % 354.36667;

  // Approximate month (average 29.5 days per month)
  const hijriMonth = Math.floor(daysInYear / 29.5) + 1;
  const hijriDay = Math.floor(daysInYear % 29.5) + 1;

  const monthNames = [
    "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
    "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
  ];

  return `${hijriDay} ${monthNames[(hijriMonth - 1) % 12]} ${hijriYear} AH`;
}
