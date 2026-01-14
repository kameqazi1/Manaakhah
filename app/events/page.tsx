"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EVENT_TYPES } from "@/lib/constants";

interface Event {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  imageUrl?: string;
  isFree: boolean;
  price?: number;
  maxAttendees?: number;
  attendeeCount: number;
}

const MOCK_EVENTS: Event[] = [
  {
    id: "1",
    businessId: "b1",
    businessName: "Fremont Islamic Center",
    title: "Community Iftar Gathering",
    description: "Join us for a community iftar during the blessed month of Ramadan. Food provided for all attendees.",
    eventType: "RELIGIOUS",
    startDate: "2026-03-15",
    endDate: "2026-03-15",
    startTime: "18:30",
    endTime: "21:00",
    location: "Fremont Islamic Center, 42000 Blacow Rd, Fremont, CA",
    isVirtual: false,
    isFree: true,
    maxAttendees: 200,
    attendeeCount: 145,
  },
  {
    id: "2",
    businessId: "b2",
    businessName: "Bay Area Muslim Business Network",
    title: "Halal Business Workshop",
    description: "Learn how to start and grow your halal-certified business. Topics include certification, marketing, and community engagement.",
    eventType: "WORKSHOP",
    startDate: "2026-01-25",
    endDate: "2026-01-25",
    startTime: "10:00",
    endTime: "14:00",
    location: "Marriott Fremont, Silicon Valley",
    isVirtual: false,
    isFree: false,
    price: 25,
    maxAttendees: 50,
    attendeeCount: 32,
  },
  {
    id: "3",
    businessId: "b3",
    businessName: "Saffron Kitchen",
    title: "Grand Opening Celebration",
    description: "Join us for our grand opening! Free samples, live music, and special discounts all day.",
    eventType: "PROMOTION",
    startDate: "2026-02-01",
    endDate: "2026-02-01",
    startTime: "11:00",
    endTime: "20:00",
    location: "39170 Fremont Hub, Fremont, CA",
    isVirtual: false,
    isFree: true,
    attendeeCount: 89,
  },
  {
    id: "4",
    businessId: "b4",
    businessName: "Muslim Youth Alliance",
    title: "Youth Leadership Conference",
    description: "Annual conference for Muslim youth featuring speakers, workshops, and networking opportunities.",
    eventType: "COMMUNITY",
    startDate: "2026-02-15",
    endDate: "2026-02-16",
    startTime: "09:00",
    endTime: "17:00",
    location: "Virtual Event",
    isVirtual: true,
    virtualLink: "https://zoom.us/meeting",
    isFree: false,
    price: 15,
    maxAttendees: 500,
    attendeeCount: 287,
  },
  {
    id: "5",
    businessId: "b5",
    businessName: "Helping Hands Foundation",
    title: "Community Food Drive",
    description: "Help us collect non-perishable food items for families in need. Drop-off locations available.",
    eventType: "CHARITY",
    startDate: "2026-01-20",
    endDate: "2026-01-27",
    startTime: "08:00",
    endTime: "18:00",
    location: "Multiple locations in Fremont",
    isVirtual: false,
    isFree: true,
    attendeeCount: 156,
  },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    // Load from localStorage or use mock data
    const savedEvents = localStorage.getItem("communityEvents");
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch {
        setEvents(MOCK_EVENTS);
        localStorage.setItem("communityEvents", JSON.stringify(MOCK_EVENTS));
      }
    } else {
      setEvents(MOCK_EVENTS);
      localStorage.setItem("communityEvents", JSON.stringify(MOCK_EVENTS));
    }
    setLoading(false);
  };

  const getEventTypeInfo = (type: string) => {
    return EVENT_TYPES.find((t) => t.value === type);
  };

  const filteredEvents = selectedType
    ? events.filter((e) => e.eventType === selectedType)
    : events;

  const upcomingEvents = filteredEvents
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pastEvents = filteredEvents
    .filter((e) => new Date(e.startDate) < new Date())
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
      const eventDate = new Date(e.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleRegister = (eventId: string) => {
    // In production, this would call an API
    const updatedEvents = events.map((e) =>
      e.id === eventId ? { ...e, attendeeCount: e.attendeeCount + 1 } : e
    );
    setEvents(updatedEvents);
    localStorage.setItem("communityEvents", JSON.stringify(updatedEvents));
    alert("You have been registered for this event!");
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

        {viewMode === "list" ? (
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
                    const typeInfo = getEventTypeInfo(event.eventType);
                    const isFull = event.maxAttendees && event.attendeeCount >= event.maxAttendees;

                    return (
                      <Card key={event.id} className="overflow-hidden">
                        <div className="h-32 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                          <span className="text-5xl">{typeInfo?.icon}</span>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{typeInfo?.label}</Badge>
                            {event.isVirtual && (
                              <Badge variant="outline">Virtual</Badge>
                            )}
                            {event.isFree ? (
                              <Badge className="bg-green-100 text-green-700">Free</Badge>
                            ) : (
                              <Badge variant="outline">${event.price}</Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">{event.businessName}</p>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {event.description}
                          </p>

                          <div className="space-y-1 text-sm text-gray-500 mb-4">
                            <p>
                              {formatDate(event.startDate)}
                              {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                            </p>
                            <p>{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                            <p className="line-clamp-1">{event.location}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {event.attendeeCount} attending
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
                    const typeInfo = getEventTypeInfo(event.eventType);

                    return (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{typeInfo?.icon}</span>
                            <Badge variant="outline">Past</Badge>
                          </div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-gray-500">{event.businessName}</p>
                          <p className="text-sm text-gray-500 mt-2">{formatDate(event.startDate)}</p>
                          <p className="text-sm text-gray-500">{event.attendeeCount} attended</p>
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
                          const typeInfo = getEventTypeInfo(event.eventType);
                          return (
                            <div
                              key={event.id}
                              className="text-xs p-0.5 bg-green-100 rounded truncate cursor-pointer hover:bg-green-200"
                              title={event.title}
                            >
                              {typeInfo?.icon} {event.title}
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
