"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceType: string;
  duration: number;
  isFeatured: boolean;
}

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

export function ServiceSelector({ services, selectedService, onSelect }: ServiceSelectorProps) {
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
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No services available for booking at this time.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {services.map((service) => (
        <Card
          key={service.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedService?.id === service.id
              ? "ring-2 ring-primary border-primary"
              : "hover:border-gray-300",
            service.isFeatured && "border-yellow-200 bg-yellow-50/50"
          )}
          onClick={() => onSelect(service)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{service.name}</h3>
                  {service.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                      Popular
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Duration: {formatDuration(service.duration)}
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg text-green-600">{formatPrice(service)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
