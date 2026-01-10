import { NextResponse } from "next/server";

// Mock notifications for demonstration
const mockNotifications = [
  {
    id: "notif-1",
    type: "NEW_REVIEW",
    title: "New Review",
    message: "Ahmed Khan left a 5-star review on your business",
    link: "/dashboard/reviews",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: "notif-2",
    type: "BOOKING_REQUEST",
    title: "New Booking Request",
    message: "You have a new booking request for tomorrow at 2:00 PM",
    link: "/dashboard/bookings",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    id: "notif-3",
    type: "NEW_MESSAGE",
    title: "New Message",
    message: "Fatima Ali sent you a message about your halal certification",
    link: "/messages",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

// GET /api/notifications
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Filter unread notifications
    const unreadCount = mockNotifications.filter((n) => !n.read).length;

    return NextResponse.json({
      notifications: mockNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
