"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { formatTimeDisplay } from "@/lib/availability";

interface Service {
  id: string;
  name: string;
  price: number;
  priceType: string;
  duration: number;
}

interface Business {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
}

interface BookingSummaryProps {
  business: Business;
  service: Service;
  date: Date;
  time: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  submitting: boolean;
}

export function BookingSummary({
  business,
  service,
  date,
  time,
  notes,
  onNotesChange,
  onConfirm,
  onBack,
  submitting,
}: BookingSummaryProps) {
  const formatPrice = (service: Service) => {
    if (service.priceType === "custom") return "Contact for Quote";
    const priceStr = `$${service.price.toFixed(2)}`;
    switch (service.priceType) {
      case "starting":
        return `From ${priceStr}`;
      case "hourly":
        return `${priceStr}/hr`;
      default:
        return priceStr;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hour${hours > 1 ? "s" : ""} ${mins} min` : `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Business</span>
              <span className="font-medium">{business.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Service</span>
              <span className="font-medium">{service.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Date</span>
              <span className="font-medium">{format(date, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Time</span>
              <span className="font-medium">{formatTimeDisplay(time)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{formatDuration(service.duration)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Price</span>
              <span className="font-bold text-green-600 text-lg">{formatPrice(service)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notes for the business (optional)
            </label>
            <Textarea
              placeholder="Any special requests or information..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
            <p className="font-medium">What happens next?</p>
            <p className="mt-1">
              Your booking request will be sent to {business.name}. They will confirm or contact
              you about your appointment.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={submitting}>
          Back
        </Button>
        <Button onClick={onConfirm} className="flex-1" disabled={submitting}>
          {submitting ? "Submitting..." : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
}
