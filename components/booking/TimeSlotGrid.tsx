"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTimeDisplay } from "@/lib/availability";

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  loading?: boolean;
}

export function TimeSlotGrid({ slots, selectedTime, onSelect, loading }: TimeSlotGridProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading available times...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No available times for this date. Please select another date.
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="space-y-4">
      {availableSlots.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          All time slots are booked for this date. Please select another date.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {availableSlots.length} time slot{availableSlots.length !== 1 ? "s" : ""} available
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {slots.map((slot) => (
              <Button
                key={slot.time}
                variant={selectedTime === slot.time ? "default" : "outline"}
                size="sm"
                disabled={!slot.available}
                onClick={() => slot.available && onSelect(slot.time)}
                className={cn(
                  "w-full",
                  !slot.available && "opacity-50 cursor-not-allowed line-through"
                )}
                title={slot.reason || (slot.available ? "Available" : "Unavailable")}
              >
                {formatTimeDisplay(slot.time)}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
