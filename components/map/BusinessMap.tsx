"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  reviewCount: number;
  distance?: number;
}

interface BusinessMapProps {
  userLat?: number;
  userLng?: number;
  radius?: number;
}

export function BusinessMap({ userLat = 37.5485, userLng = -121.9886, radius = 10 }: BusinessMapProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyBusinesses();
  }, [userLat, userLng, radius]);

  const fetchNearbyBusinesses = async () => {
    try {
      const response = await fetch(
        `/api/businesses?lat=${userLat}&lng=${userLng}&radius=${radius}`
      );

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      RESTAURANT: "🍽️",
      HALAL_MARKET: "🛒",
      MASJID: "🕌",
      AUTO_REPAIR: "🔧",
      TUTORING: "📚",
      HEALTH_WELLNESS: "⚕️",
      LEGAL: "⚖️",
    };
    return icons[category] || "📍";
  };

  // Simple grid-based map visualization
  const getPositionStyle = (business: Business) => {
    // Normalize coordinates to fit in a container
    const latRange = 0.2; // ~14 miles
    const lngRange = 0.2;

    const x = ((business.longitude - (userLng - lngRange / 2)) / lngRange) * 100;
    const y = ((userLat + latRange / 2 - business.latitude) / latRange) * 100;

    return {
      left: `${Math.max(0, Math.min(100, x))}%`,
      top: `${Math.max(0, Math.min(100, y))}%`,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading map...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Map View */}
      <Card>
        <CardContent className="p-0">
          <div className="relative h-[500px] bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
            {/* Center marker (user location) */}
            <div
              className="absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: "50%", top: "50%" }}
            >
              <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-75"></div>
            </div>

            {/* Business markers */}
            {businesses.map((business) => (
              <button
                key={business.id}
                onClick={() => setSelectedBusiness(business)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 focus:scale-125 focus:outline-none"
                style={getPositionStyle(business)}
              >
                <div
                  className={`text-2xl ${
                    selectedBusiness?.id === business.id
                      ? "drop-shadow-lg scale-150"
                      : "drop-shadow"
                  }`}
                >
                  {getCategoryIcon(business.category)}
                </div>
              </button>
            ))}

            {/* Radius indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[80%] border-2 border-blue-300 border-dashed rounded-full opacity-30"></div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>Businesses ({businesses.length})</span>
              </div>
            </div>

            {/* Radius info */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-2 shadow-lg text-xs">
              <span className="font-semibold">Radius: {radius} miles</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business List */}
      <Card>
        <CardContent className="p-4">
          <div className="h-[500px] overflow-y-auto space-y-3">
            {businesses.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                No businesses found in this area
              </div>
            ) : (
              businesses.map((business) => (
                <div
                  key={business.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedBusiness?.id === business.id
                      ? "border-primary bg-blue-50"
                      : "hover:border-gray-300 hover:shadow"
                  }`}
                  onClick={() => setSelectedBusiness(business)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">
                        {getCategoryIcon(business.category)}
                      </span>
                      <div>
                        <h3 className="font-semibold">{business.name}</h3>
                        <p className="text-xs text-gray-600">
                          {business.category.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    {business.distance !== undefined && (
                      <span className="text-xs text-gray-500">
                        {business.distance.toFixed(1)} mi
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2 text-sm">
                    {business.averageRating > 0 && (
                      <>
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold">
                          {business.averageRating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          ({business.reviewCount})
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mb-3">
                    {business.address}, {business.city}
                  </p>

                  <Link href={`/business/${business.id}`}>
                    <Button size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
