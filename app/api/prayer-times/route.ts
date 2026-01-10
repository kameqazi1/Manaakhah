import { NextResponse } from "next/server";

// GET /api/prayer-times?lat=X&lng=Y
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat") || "37.5485";
    const lng = searchParams.get("lng") || "-121.9886";

    // Use Aladhan API for prayer times
    const response = await fetch(
      `http://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      // Fallback to mock data if API fails
      return NextResponse.json({
        timings: {
          Fajr: "05:30",
          Dhuhr: "13:00",
          Asr: "16:30",
          Maghrib: "19:00",
          Isha: "20:30",
        },
        date: new Date().toISOString().split("T")[0],
      });
    }

    const data = await response.json();

    return NextResponse.json({
      timings: {
        Fajr: data.data.timings.Fajr,
        Dhuhr: data.data.timings.Dhuhr,
        Asr: data.data.timings.Asr,
        Maghrib: data.data.timings.Maghrib,
        Isha: data.data.timings.Isha,
      },
      date: data.data.date.gregorian.date,
    });
  } catch (error) {
    console.error("Error fetching prayer times:", error);

    // Return fallback prayer times
    return NextResponse.json({
      timings: {
        Fajr: "05:30",
        Dhuhr: "13:00",
        Asr: "16:30",
        Maghrib: "19:00",
        Isha: "20:30",
      },
      date: new Date().toISOString().split("T")[0],
    });
  }
}
