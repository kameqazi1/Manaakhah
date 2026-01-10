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
  tags?: string[];
}

interface BusinessMapProps {
  userLat?: number;
  userLng?: number;
  radius?: number;
}

const BUSINESS_TAGS = [
  { value: "MUSLIM_OWNED", label: "Muslim Owned", icon: "🤝" },
  { value: "HALAL_VERIFIED", label: "Halal Verified", icon: "✓" },
  { value: "SISTERS_FRIENDLY", label: "Sisters Friendly", icon: "👭" },
  { value: "KID_FRIENDLY", label: "Kid Friendly", icon: "👶" },
  { value: "WHEELCHAIR_ACCESSIBLE", label: "Accessible", icon: "♿" },
  { value: "PRAYER_SPACE", label: "Prayer Space", icon: "🕌" },
];

const CATEGORIES = [
  { value: "ALL", label: "All Categories", icon: "📍" },
  { value: "RESTAURANT", label: "Restaurant", icon: "🍽️" },
  { value: "HALAL_MARKET", label: "Halal Market", icon: "🛒" },
  { value: "MASJID", label: "Masjid", icon: "🕌" },
  { value: "AUTO_REPAIR", label: "Auto Repair", icon: "🔧" },
  { value: "TUTORING", label: "Tutoring", icon: "📚" },
  { value: "HEALTH_WELLNESS", label: "Health & Wellness", icon: "⚕️" },
  { value: "LEGAL_SERVICES", label: "Legal", icon: "⚖️" },
  { value: "BARBER_SALON", label: "Barber/Salon", icon: "✂️" },
  { value: "PLUMBING", label: "Plumbing", icon: "🚰" },
  { value: "ELECTRICAL", label: "Electrical", icon: "⚡" },
  { value: "REAL_ESTATE", label: "Real Estate", icon: "🏠" },
];

export function BusinessMap({ userLat = 37.5485, userLng = -121.9886, radius = 10 }: BusinessMapProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat?.icon || "📍";
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      RESTAURANT: "bg-red-500",
      HALAL_MARKET: "bg-green-500",
      MASJID: "bg-purple-500",
      AUTO_REPAIR: "bg-orange-500",
      TUTORING: "bg-blue-500",
      HEALTH_WELLNESS: "bg-pink-500",
      LEGAL_SERVICES: "bg-indigo-500",
      BARBER_SALON: "bg-yellow-500",
      PLUMBING: "bg-cyan-500",
      ELECTRICAL: "bg-amber-500",
      REAL_ESTATE: "bg-teal-500",
    };
    return colors[category] || "bg-gray-500";
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

      <div className="grid md:grid-cols-2 gap-4">
        {/* Map View */}
        <Card>
          <CardContent className="p-0">
            <div className="relative h-[600px] bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
              {/* Center marker (user location) */}
              <div
                className="absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: "50%", top: "50%" }}
                title="Your Location"
              >
                <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-75"></div>
              </div>

              {/* Business markers */}
              {filteredBusinesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => setSelectedBusiness(business)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 focus:scale-125 focus:outline-none group"
                  style={getPositionStyle(business)}
                  title={business.name}
                >
                  <div className="relative">
                    {/* Custom marker with category color */}
                    <div
                      className={`w-8 h-8 ${getCategoryColor(
                        business.category
                      )} rounded-full flex items-center justify-center border-2 border-white shadow-lg ${
                        selectedBusiness?.id === business.id
                          ? "ring-4 ring-primary ring-opacity-50 scale-125"
                          : ""
                      }`}
                    >
                      <span className="text-white text-sm">
                        {getCategoryIcon(business.category)}
                      </span>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {business.name}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Radius indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[80%] h-[80%] border-2 border-blue-300 border-dashed rounded-full opacity-30"></div>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg text-xs max-w-[200px]">
                <div className="font-semibold mb-2">Map Legend</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span>Your Location</span>
                  </div>
                  {CATEGORIES.slice(1, 6).map((cat) => (
                    <div key={cat.value} className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 ${getCategoryColor(
                          cat.value
                        )} rounded-full`}
                      ></div>
                      <span>{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radius info */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg p-2 shadow-lg text-xs">
                <span className="font-semibold">Radius: {radius} miles</span>
              </div>

              {/* No results message */}
              {filteredBusinesses.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/95 backdrop-blur rounded-lg p-6 shadow-lg text-center">
                    <p className="text-gray-600 mb-2">No businesses match your filters</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory("ALL");
                        setSelectedTags([]);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business List */}
        <Card>
          <CardContent className="p-4">
            <div className="h-[600px] overflow-y-auto space-y-3">
              {filteredBusinesses.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <p className="mb-2">No businesses found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                filteredBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedBusiness?.id === business.id
                        ? "border-primary bg-blue-50 ring-2 ring-primary ring-opacity-50"
                        : "hover:border-gray-300 hover:shadow"
                    }`}
                    onClick={() => setSelectedBusiness(business)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        {/* Category icon badge */}
                        <div
                          className={`w-10 h-10 ${getCategoryColor(
                            business.category
                          )} rounded-full flex items-center justify-center text-white flex-shrink-0`}
                        >
                          {getCategoryIcon(business.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{business.name}</h3>
                          <p className="text-xs text-gray-600">
                            {business.category.replace(/_/g, " ")}
                          </p>
                          {/* Tags */}
                          {business.tags && business.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {business.tags.slice(0, 3).map((tag) => {
                                const tagInfo = BUSINESS_TAGS.find((t) => t.value === tag);
                                return tagInfo ? (
                                  <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full"
                                  >
                                    {tagInfo.icon} {tagInfo.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      {business.distance !== undefined && (
                        <span className="text-xs text-gray-500 font-medium">
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
                            ({business.reviewCount} reviews)
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mb-3">
                      {business.address}, {business.city}
                    </p>

                    <Link href={`/business/${business.id}`}>
                      <Button size="sm" className="w-full">
                        View Details →
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
