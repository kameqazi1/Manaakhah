"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Dynamically import the actual map component to avoid SSR issues
const LeafletMap = dynamic(() => import("./LeafletMap"), {
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
  { value: "MUSLIM_OWNED", label: "Muslim Owned", icon: "🤝" },
  { value: "HALAL_VERIFIED", label: "Halal Verified", icon: "✓" },
  { value: "SISTERS_FRIENDLY", label: "Sisters Friendly", icon: "👭" },
  { value: "KID_FRIENDLY", label: "Kid Friendly", icon: "👶" },
  { value: "WHEELCHAIR_ACCESSIBLE", label: "Accessible", icon: "♿" },
  { value: "PRAYER_SPACE", label: "Prayer Space", icon: "🕌" },
];

export const CATEGORIES = [
  { value: "ALL", label: "All Categories", icon: "📍", color: "#6B7280" },
  { value: "RESTAURANT", label: "Restaurant", icon: "🍽️", color: "#EF4444" },
  { value: "HALAL_MARKET", label: "Halal Market", icon: "🛒", color: "#10B981" },
  { value: "MASJID", label: "Masjid", icon: "🕌", color: "#8B5CF6" },
  { value: "AUTO_REPAIR", label: "Auto Repair", icon: "🔧", color: "#F97316" },
  { value: "TUTORING", label: "Tutoring", icon: "📚", color: "#3B82F6" },
  { value: "HEALTH_WELLNESS", label: "Health & Wellness", icon: "⚕️", color: "#EC4899" },
  { value: "LEGAL_SERVICES", label: "Legal", icon: "⚖️", color: "#6366F1" },
  { value: "BARBER_SALON", label: "Barber/Salon", icon: "✂️", color: "#EAB308" },
  { value: "PLUMBING", label: "Plumbing", icon: "🚰", color: "#06B6D4" },
  { value: "ELECTRICAL", label: "Electrical", icon: "⚡", color: "#F59E0B" },
  { value: "REAL_ESTATE", label: "Real Estate", icon: "🏠", color: "#14B8A6" },
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
      const response = await fetch(
        `/api/businesses?lat=${userLat}&lng=${userLng}&radius=${radius}`
      );

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data || []);
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
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selectedCategory === cat.value
                          ? "bg-primary text-white border-primary"
                          : "bg-white border-gray-300 hover:border-primary"
                      }`}
                    >
                      <span className="mr-1">{cat.icon}</span>
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
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selectedTags.includes(tag.value)
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white border-gray-300 hover:border-green-500"
                      }`}
                    >
                      <span className="mr-1">{tag.icon}</span>
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
      <LeafletMap
        businesses={filteredBusinesses}
        userLat={userLat}
        userLng={userLng}
        radius={radius}
      />
    </div>
  );
}
