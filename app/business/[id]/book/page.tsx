"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/components/mock-session-provider";
import { DatePicker } from "@/components/booking/DatePicker";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { BookingSummary } from "@/components/booking/BookingSummary";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceType: string;
  duration: number;
  isFeatured: boolean;
}

interface Business {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  owner: { id: string };
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface AvailabilityData {
  slots: TimeSlot[];
  isOpen: boolean;
  message?: string;
  hours?: { start: string; end: string };
}

type BookingStep = "service" | "datetime" | "confirm";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useMockSession();
  const businessId = params.id as string;

  // Build mock headers for authenticated requests
  const mockHeaders = useMemo((): Record<string, string> => {
    if (!session?.user?.id) return {};
    return {
      "x-user-id": session.user.id,
      "x-user-role": session.user.role || "CONSUMER",
    };
  }, [session?.user?.id, session?.user?.role]);

  // Data states
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [availableDays, setAvailableDays] = useState<number[]>([]);

  // Booking state
  const [step, setStep] = useState<BookingStep>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch business and services
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch business
        const bizRes = await fetch(`/api/businesses/${businessId}`);
        if (!bizRes.ok) throw new Error("Business not found");
        const bizData = await bizRes.json();
        setBusiness(bizData);

        // Fetch services
        const svcRes = await fetch(`/api/businesses/${businessId}/services`);
        if (svcRes.ok) {
          const svcData = await svcRes.json();
          setServices(svcData.services || []);
        }

        // Fetch business availability to get open days
        const availRes = await fetch(`/api/businesses/${businessId}/availability/days`);
        if (availRes.ok) {
          const availData = await availRes.json();
          setAvailableDays(availData.days || [0, 1, 2, 3, 4, 5, 6]);
        } else {
          // Default to all days if endpoint doesn't exist
          setAvailableDays([0, 1, 2, 3, 4, 5, 6]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load booking information");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  // Fetch time slots when date changes
  const fetchTimeSlots = useCallback(async () => {
    if (!selectedDate || !selectedService) return;

    setLoadingSlots(true);
    setAvailability(null);

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(
        `/api/businesses/${businessId}/availability?date=${dateStr}&duration=${selectedService.duration}`
      );

      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      } else {
        setAvailability({ slots: [], isOpen: false, message: "Failed to load availability" });
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
      setAvailability({ slots: [], isOpen: false, message: "Failed to load availability" });
    } finally {
      setLoadingSlots(false);
    }
  }, [businessId, selectedDate, selectedService]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchTimeSlots();
    }
  }, [selectedDate, selectedService, fetchTimeSlots]);

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setStep("datetime");
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Proceed to confirmation
  const handleProceedToConfirm = () => {
    if (selectedService && selectedDate && selectedTime) {
      setStep("confirm");
    }
  };

  // Submit booking
  const handleConfirmBooking = async () => {
    if (!session?.user?.id) {
      router.push(`/auth/signin?callbackUrl=/business/${businessId}/book`);
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...mockHeaders,
        },
        body: JSON.stringify({
          businessId,
          serviceId: selectedService.id,
          serviceType: selectedService.name,
          appointmentDate: format(selectedDate, "yyyy-MM-dd"),
          appointmentTime: selectedTime,
          duration: selectedService.duration,
          notes: notes || null,
          price: selectedService.price,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create booking");
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      setError("Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Error state
  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">Business not found</p>
            <Link href="/search">
              <Button>Back to Search</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cannot book own business
  if (session?.user?.id === business.owner?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">You cannot book your own business.</p>
            <Link href={`/business/${businessId}`}>
              <Button>Back to Business</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto max-w-2xl px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2">Booking Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your booking request has been sent to {business.name}. They will confirm your
                appointment soon.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/bookings">
                  <Button>View My Bookings</Button>
                </Link>
                <Link href={`/business/${businessId}`}>
                  <Button variant="outline">Back to Business</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/business/${businessId}`}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            ← Back to {business.name}
          </Link>
          <h1 className="text-2xl font-bold">Book an Appointment</h1>
          <p className="text-gray-600">{business.name}</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`flex items-center gap-2 ${
              step === "service" ? "text-primary font-medium" : "text-gray-400"
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">
              1
            </span>
            <span className="hidden sm:inline">Service</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200" />
          <div
            className={`flex items-center gap-2 ${
              step === "datetime" ? "text-primary font-medium" : "text-gray-400"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                step === "datetime" || step === "confirm"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </span>
            <span className="hidden sm:inline">Date & Time</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200" />
          <div
            className={`flex items-center gap-2 ${
              step === "confirm" ? "text-primary font-medium" : "text-gray-400"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                step === "confirm" ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </span>
            <span className="hidden sm:inline">Confirm</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Service Selection */}
        {step === "service" && (
          <Card>
            <CardHeader>
              <CardTitle>Select a Service</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceSelector
                services={services}
                selectedService={selectedService}
                onSelect={handleServiceSelect}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === "datetime" && selectedService && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Select Date & Time</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setStep("service")}>
                    Change Service
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Selected: {selectedService.name} ({selectedService.duration} min)
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <div>
                    <h3 className="font-medium mb-3">Choose a date</h3>
                    <DatePicker
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      availableDays={availableDays}
                    />
                  </div>

                  {/* Time slots */}
                  <div>
                    <h3 className="font-medium mb-3">
                      {selectedDate
                        ? `Available times for ${format(selectedDate, "MMM d")}`
                        : "Select a date first"}
                    </h3>
                    {selectedDate ? (
                      availability?.isOpen === false ? (
                        <div className="text-center py-8 text-gray-500">
                          {availability.message || "Business is closed on this day"}
                        </div>
                      ) : (
                        <TimeSlotGrid
                          slots={availability?.slots || []}
                          selectedTime={selectedTime}
                          onSelect={handleTimeSelect}
                          loading={loadingSlots}
                        />
                      )
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Select a date to see available times
                      </div>
                    )}
                  </div>
                </div>

                {selectedDate && selectedTime && (
                  <div className="mt-6 pt-4 border-t">
                    <Button onClick={handleProceedToConfirm} className="w-full">
                      Continue to Confirmation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirm" && selectedService && selectedDate && selectedTime && (
          <BookingSummary
            business={business}
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            notes={notes}
            onNotesChange={setNotes}
            onConfirm={handleConfirmBooking}
            onBack={() => setStep("datetime")}
            submitting={submitting}
          />
        )}

        {/* Login prompt for unauthenticated users */}
        {!session?.user && step === "confirm" && (
          <Card className="mt-4">
            <CardContent className="p-4 text-center">
              <p className="text-gray-600 mb-3">Please sign in to complete your booking</p>
              <Link href={`/auth/signin?callbackUrl=/business/${businessId}/book`}>
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
