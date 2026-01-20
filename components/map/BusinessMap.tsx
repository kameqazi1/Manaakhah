"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CATEGORY_ICON_MAP } from "./icons/CategoryIcon";

// Dynamically import MapLibreMap to avoid SSR issues with WebGL
const MapLibreMap = dynamic(() => import("./MapLibreMap"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="p-8 text-center h-[600px] flex items-center justify-center">
        <p>Loading map...</p>
      </CardContent>
    </Card>
  )
});

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
  tags?: string[];
  imageUrl?: string;
  description?: string;
}

interface BusinessMapProps {
  userLat?: number;
  userLng?: number;
  radius?: number;
}

export const BUSINESS_TAGS = [
  { value: "MUSLIM_OWNED", label: "Muslim Owned", iconPath: "/icons/other.png" },
  { value: "HALAL_VERIFIED", label: "Halal Verified", iconPath: "/icons/halal-market.png" },
  { value: "SISTERS_FRIENDLY", label: "Sisters Friendly", iconPath: "/icons/other.png" },
  { value: "KID_FRIENDLY", label: "Kid Friendly", iconPath: "/icons/other.png" },
  { value: "WHEELCHAIR_ACCESSIBLE", label: "Accessible", iconPath: "/icons/other.png" },
  { value: "PRAYER_SPACE", label: "Prayer Space", iconPath: "/icons/mosque.png" },
];

export const CATEGORIES = [
  { value: "ALL", label: "All Categories", iconPath: "/icons/all-categories.png", color: "#6B7280" },
  { value: "RESTAURANT", label: "Restaurant", iconPath: "/icons/restaurant.png", color: "#EF4444" },
  { value: "HALAL_MARKET", label: "Halal Market", iconPath: "/icons/halal-market.png", color: "#10B981" },
  { value: "MASJID", label: "Masjid", iconPath: "/icons/mosque.png", color: "#8B5CF6" },
  { value: "AUTO_REPAIR", label: "Auto Repair", iconPath: "/icons/car-repair.png", color: "#F97316" },
  { value: "TUTORING", label: "Tutoring", iconPath: "/icons/tutoring.png", color: "#3B82F6" },
  { value: "HEALTH_WELLNESS", label: "Health & Wellness", iconPath: "/icons/health-wellness.png", color: "#EC4899" },
  { value: "LEGAL_SERVICES", label: "Legal", iconPath: "/icons/legal.png", color: "#6366F1" },
  { value: "BARBER_SALON", label: "Barber/Salon", iconPath: "/icons/barber.png", color: "#EAB308" },
  { value: "PLUMBING", label: "Plumbing", iconPath: "/icons/plumbing.png", color: "#06B6D4" },
  { value: "ELECTRICAL", label: "Electrical", iconPath: "/icons/electrical.png", color: "#F59E0B" },
  { value: "REAL_ESTATE", label: "Real Estate", iconPath: "/icons/real-estate.png", color: "#14B8A6" },
];

export function BusinessMap({ userLat = 37.5485, userLng = -121.9886, radius = 10 }: BusinessMapProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    fetchNearbyBusinesses();
  }, [userLat, userLng, radius]);

  useEffect(() => {
    applyFilters();
  }, [businesses, selectedCategory, selectedTags]);

  const fetchNearbyBusinesses = async () => {
    try {
      console.log(`Fetching businesses near ${userLat}, ${userLng} within ${radius} miles`);
      const response = await fetch(
        `/api/businesses?lat=${userLat}&lng=${userLng}&radius=${radius}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`Received ${data.length} businesses from API:`, data);
        setBusinesses(data || []);
      } else {
        console.error(`API responded with status ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = businesses;

    // Filter by category
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((b) => b.category === selectedCategory);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((b) =>
        selectedTags.every((tag) => b.tags?.includes(tag))
      );
    }

    setFilteredBusinesses(filtered);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-1.5 ${
                        selectedCategory === cat.value
                          ? "bg-primary text-white border-primary"
                          : "bg-white border-gray-300 hover:border-primary"
                      }`}
                    >
                      <Image
                        src={cat.iconPath}
                        alt={cat.label}
                        width={16}
                        height={16}
                        className="flex-shrink-0"
                      />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Filters */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      onClick={() => toggleTag(tag.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-1.5 ${
                        selectedTags.includes(tag.value)
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white border-gray-300 hover:border-green-500"
                      }`}
                    >
                      <Image
                        src={tag.iconPath}
                        alt={tag.label}
                        width={16}
                        height={16}
                        className="flex-shrink-0"
                      />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCategory !== "ALL" || selectedTags.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setSelectedTags([]);
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredBusinesses.length}</span> of{" "}
            <span className="font-semibold">{businesses.length}</span> businesses
          </div>
        </CardContent>
      </Card>

      {/* Map Component */}
      <MapLibreMap
        businesses={filteredBusinesses}
        userLat={userLat}
        userLng={userLng}
        radius={radius}
      />
    </div>
  );
}
