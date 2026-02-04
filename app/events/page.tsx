"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Building2 } from "lucide-react";
import { EVENT_TYPES } from "@/lib/constants";

interface Event {
  id: string;
  businessId: string;
  businessName?: string;
  business?: { id: string; name: string; slug: string };
  title: string;
  description: string;
  startTime: string; // DateTime from API
  endTime: string; // DateTime from API
  location: string | null;
  isTicketed: boolean;
  ticketPrice: number | null;
  maxAttendees: number | null;
  currentAttendees: number;
  coverImage: string | null;
  isCancelled: boolean;
  rsvps?: any[];
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeInfo = (type: string) => {
    return EVENT_TYPES.find((t) => t.value === type);
  };

  const filteredEvents = events; // All events for now

  const upcomingEvents = filteredEvents
    .filter((e) => new Date(e.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const pastEvents = filteredEvents
    .filter((e) => new Date(e.startTime) < new Date())
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty days for the start of the week
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((e) => {
      const eventDate = new Date(e.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleRegister = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "going" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register");
      }

      alert("You have been registered for this event!");
      await loadEvents(); // Reload events to update counts
    } catch (error) {
      console.error("Error registering:", error);
      alert(error instanceof Error ? error.message : "Failed to register for event");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Community Events</h1>
            <p className="text-gray-600">Discover events in your Muslim community</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              List View
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              Calendar
            </Button>
          </div>
        </div>

        {/* Event Type Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedType === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("")}
          >
            All Events
          </Button>
          {EVENT_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type.value)}
            >
              {type.icon} {type.label}
            </Button>
          ))}
        </div>

        {events.length === 0 ? (
          /* Empty State */
          <Card className="text-center p-12 bg-gradient-to-br from-green-50 to-emerald-50 border-dashed border-2 border-green-200">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No Events Yet</h3>
              <p className="text-gray-600 mb-6">
                Community events will appear here as businesses and organizations create them.
                Check back soon for upcoming gatherings, workshops, and celebrations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button size="lg">
                    <Building2 className="w-4 h-4 mr-2" />
                    List Your Business
                  </Button>
                </Link>
                <Link href="/search">
                  <Button size="lg" variant="outline">
                    Find Businesses
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : viewMode === "list" ? (
          <div className="space-y-8">
            {/* Upcoming Events */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming Events ({upcomingEvents.length})</h2>
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No upcoming events found
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map((event) => {
                    const isFull = event.maxAttendees ? event.currentAttendees >= event.maxAttendees : false;
                    const businessName = event.business?.name || event.businessName || "Unknown Business";

                    return (
                      <Card key={event.id} className="overflow-hidden">
                        {event.coverImage ? (
                          <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${event.coverImage})` }} />
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-green-600" />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {!event.isTicketed ? (
                              <Badge className="bg-green-100 text-green-700">Free</Badge>
                            ) : (
                              <Badge variant="outline">${event.ticketPrice}</Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">{businessName}</p>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {event.description}
                          </p>

                          <div className="space-y-1 text-sm text-gray-500 mb-4">
                            <p>{formatDate(event.startTime)}</p>
                            <p>{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                            {event.location && <p className="line-clamp-1">{event.location}</p>}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {event.currentAttendees} attending
                              {event.maxAttendees && ` / ${event.maxAttendees}`}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleRegister(event.id)}
                              disabled={isFull}
                            >
                              {isFull ? "Full" : "Register"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Past Events ({pastEvents.length})</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                  {pastEvents.slice(0, 6).map((event) => {
                    const businessName = event.business?.name || event.businessName || "Unknown Business";

                    return (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5" />
                            <Badge variant="outline">Past</Badge>
                          </div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-gray-500">{businessName}</p>
                          <p className="text-sm text-gray-500 mt-2">{formatDate(event.startTime)}</p>
                          <p className="text-sm text-gray-500">{event.currentAttendees} attended</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                >
                  Previous
                </Button>
                <CardTitle>
                  {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                >
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(selectedMonth).map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-24" />;
                  }

                  const dayEvents = getEventsForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={date.toISOString()}
                      className={`h-24 border rounded p-1 ${
                        isToday ? "bg-green-50 border-green-300" : "bg-white"
                      }`}
                    >
                      <div className={`text-sm ${isToday ? "font-bold text-green-600" : "text-gray-600"}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((event) => {
                          return (
                            <div
                              key={event.id}
                              className="text-xs p-0.5 bg-green-100 rounded truncate cursor-pointer hover:bg-green-200"
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
