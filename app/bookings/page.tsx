"use client";

import { useEffect, useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Booking {
  id: string;
  serviceType: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  status: string;
  price?: number;
  paymentStatus: string;
  customerNotes?: string;
  ownerNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  business: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function BookingsPage() {
  const { data: session } = useMockSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [role, setRole] = useState<"customer" | "business">("customer");

  useEffect(() => {
    if (session?.user?.id) {
      fetchBookings();
    }
  }, [session, filter, role]);

  const fetchBookings = async () => {
    if (!session?.user?.id) return;

    try {
      const params = new URLSearchParams({ role });
      if (filter === "upcoming") {
        params.append("upcoming", "true");
      }

      const response = await fetch(`/api/bookings?${params}`, {
        headers: {
          "x-user-id": session.user.id,
          "x-user-role": session.user.role,
        },
      });

      if (response.ok) {
        const data = await response.json();
        let filteredBookings = data.bookings;

        if (filter === "past") {
          const now = new Date();
          filteredBookings = data.bookings.filter(
            (b: Booking) => new Date(b.appointmentDate) < now
          );
        }

        setBookings(filteredBookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string, notes?: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
          "x-user-role": session.user.role,
        },
        body: JSON.stringify({ status, ownerNotes: notes }),
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "outline",
      CONFIRMED: "default",
      COMPLETED: "secondary",
      CANCELLED: "destructive",
      REJECTED: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  const canConfirm = (booking: Booking) => {
    return (
      session?.user?.role === "BUSINESS_OWNER" &&
      booking.status === "PENDING"
    );
  };

  const canCancel = (booking: Booking) => {
    return (
      booking.status !== "COMPLETED" &&
      booking.status !== "CANCELLED" &&
      booking.status !== "REJECTED"
    );
  };

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <p className="text-gray-600 mb-4">
            You need to be logged in to view your bookings
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-gray-600">
            Manage your appointments and reservations
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex gap-2">
            <Button
              variant={role === "customer" ? "default" : "outline"}
              onClick={() => setRole("customer")}
            >
              My Appointments
            </Button>
            {session.user.role === "BUSINESS_OWNER" && (
              <Button
                variant={role === "business" ? "default" : "outline"}
                onClick={() => setRole("business")}
              >
                Business Bookings
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant={filter === "upcoming" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </Button>
            <Button
              variant={filter === "past" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("past")}
            >
              Past
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">No bookings found</p>
              <Link href="/search">
                <Button>Browse Businesses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            {role === "customer"
                              ? booking.business.name
                              : booking.customer.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {booking.serviceType}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">📅</span>
                          <span>
                            {new Date(booking.appointmentDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">🕐</span>
                          <span>
                            {booking.appointmentTime} ({booking.duration} min)
                          </span>
                        </div>

                        {role === "customer" && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">📍</span>
                              <span>
                                {booking.business.address}, {booking.business.city}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">📞</span>
                              <a
                                href={`tel:${booking.business.phone}`}
                                className="text-primary hover:underline"
                              >
                                {booking.business.phone}
                              </a>
                            </div>
                          </>
                        )}

                        {role === "business" && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">📞</span>
                            <a
                              href={`tel:${booking.customer.phone}`}
                              className="text-primary hover:underline"
                            >
                              {booking.customer.phone}
                            </a>
                          </div>
                        )}

                        {booking.price && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">💰</span>
                            <span>
                              ${booking.price.toFixed(2)} - {booking.paymentStatus}
                            </span>
                          </div>
                        )}

                        {booking.customerNotes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              Customer Notes:
                            </p>
                            <p className="text-sm">{booking.customerNotes}</p>
                          </div>
                        )}

                        {booking.ownerNotes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              Owner Notes:
                            </p>
                            <p className="text-sm">{booking.ownerNotes}</p>
                          </div>
                        )}

                        {booking.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 rounded">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-sm">{booking.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 md:min-w-[150px]">
                      {canConfirm(booking) && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, "CONFIRMED")}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt("Rejection reason:");
                              if (reason) {
                                handleStatusUpdate(booking.id, "REJECTED", reason);
                              }
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {booking.status === "CONFIRMED" && role === "business" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(booking.id, "COMPLETED")}
                        >
                          Mark Complete
                        </Button>
                      )}

                      {canCancel(booking) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("Are you sure you want to cancel this booking?")) {
                              handleStatusUpdate(booking.id, "CANCELLED");
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      )}

                      {role === "customer" && (
                        <Link href={`/business/${booking.business.id}`}>
                          <Button size="sm" variant="outline" className="w-full">
                            View Business
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
