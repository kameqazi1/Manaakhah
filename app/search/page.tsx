"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamic import to avoid SSR issues with WebGL
const MapLibreMap = dynamic(() => import("@/components/map/MapLibreMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TAGS,
  DISTANCE_OPTIONS,
  SORT_OPTIONS,
  PRICE_RANGES,
  DEFAULT_LOCATION,
} from "@/lib/constants";
import { useMockSession } from "@/components/mock-session-provider";
import { useMapSearch, type Business } from "@/hooks/useMapSearch";
import { ViewToggle, type ViewMode } from "@/components/search/ViewToggle";

function SearchContent() {
  const { data: session } = useMockSession();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Use the useMapSearch hook for URL-first state management
  const { filters, setFilters, businesses, isLoading } = useMapSearch(userLocation);

  // Load favorites and recently viewed from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("manakhaah-favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    const savedRecent = localStorage.getItem("manakhaah-recently-viewed");
    if (savedRecent) {
      setRecentlyViewed(JSON.parse(savedRecent));
    }
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({
            lat: DEFAULT_LOCATION.latitude,
            lng: DEFAULT_LOCATION.longitude,
          });
        }
      );
    } else {
      setUserLocation({
        lat: DEFAULT_LOCATION.latitude,
        lng: DEFAULT_LOCATION.longitude,
      });
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filters already sync to URL via setFilters, React Query auto-refetches
  };

  const handleTagFilter = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    setFilters({ tags: newTags });
  };

  const toggleFavorite = (businessId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorites = favorites.includes(businessId)
      ? favorites.filter((id) => id !== businessId)
      : [...favorites, businessId];
    setFavorites(newFavorites);
    localStorage.setItem("manakhaah-favorites", JSON.stringify(newFavorites));
  };

  const addToRecentlyViewed = (businessId: string) => {
    const newRecent = [businessId, ...recentlyViewed.filter((id) => id !== businessId)].slice(0, 10);
    setRecentlyViewed(newRecent);
    localStorage.setItem("manakhaah-recently-viewed", JSON.stringify(newRecent));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      tags: [],
      distance: "25",
      sort: "distance",
      priceRange: "",
      minRating: "",
    });
  };

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    filters.tags.length +
    (filters.priceRange ? 1 : 0) +
    (filters.minRating ? 1 : 0);

  // Sort businesses client-side based on filter selection
  const sortedBusinesses = useMemo(() => {
    const sorted = [...businesses];
    if (filters.sort === "rating") {
      sorted.sort((a, b) => b.averageRating - a.averageRating);
    } else if (filters.sort === "reviews") {
      sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    }
    // distance sort is default from API
    return sorted;
  }, [businesses, filters.sort]);

  // Transform businesses for map component (needs latitude/longitude)
  const businessesForMap = useMemo(() => {
    return sortedBusinesses
      .filter((b) => b.latitude && b.longitude)
      .map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        address: b.address,
        city: b.city,
        latitude: b.latitude,
        longitude: b.longitude,
        averageRating: b.averageRating,
        reviewCount: b.reviewCount,
        distance: b.distance,
        tags: b.tags?.map((t) => t.tag) || [],
        imageUrl: b.photos?.[0]?.url,
        description: b.description,
      }));
  }, [sortedBusinesses]);

  // Render business card
  const renderBusinessCard = (business: Business, compact: boolean = false) => (
    <Link
      href={`/business/${business.id}`}
      key={business.id}
      onClick={() => addToRecentlyViewed(business.id)}
    >
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <CardContent className="p-0">
          <div className="relative">
            {business.photos.length > 0 ? (
              <div className={`${compact ? 'aspect-[16/9]' : 'aspect-video'} bg-gray-200 rounded-t-lg`} />
            ) : (
              <div className={`${compact ? 'aspect-[16/9]' : 'aspect-video'} bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center`}>
                <span className={compact ? 'text-2xl' : 'text-4xl'}>
                  {business.category === "MASJID" ? "🕌" : "🏪"}
                </span>
              </div>
            )}

            <button
              onClick={(e) => toggleFavorite(business.id, e)}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
            >
              {favorites.includes(business.id) ? "❤️" : "🤍"}
            </button>

            {business.verificationStatus === "APPROVED" && (
              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                ✓ Verified
              </div>
            )}

            {business.priceRange && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {PRICE_RANGES.find((p) => p.value === business.priceRange)?.label}
              </div>
            )}
          </div>

          <div className={compact ? 'p-3' : 'p-4'}>
            <div className="flex items-start justify-between mb-1">
              <h3 className={`font-semibold group-hover:text-primary transition-colors line-clamp-1 ${compact ? 'text-sm' : 'text-lg'}`}>
                {business.name}
              </h3>
              {business.distance !== undefined && (
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {business.distance.toFixed(1)} mi
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              {business.averageRating > 0 && (
                <div className="flex items-center text-sm">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 font-medium">
                    {business.averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-500 ml-1">
                    ({business.reviewCount})
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-400">
                {BUSINESS_CATEGORIES.find((c) => c.value === business.category)?.label}
              </span>
            </div>

            {!compact && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {business.description}
              </p>
            )}

            <p className="text-sm text-gray-500 mb-3 line-clamp-1">
              {business.address}, {business.city}
            </p>

            {!compact && (
              <div className="flex flex-wrap gap-1">
                {business.tags.slice(0, 3).map((tag) => {
                  const tagInfo = BUSINESS_TAGS.find((t) => t.value === tag.tag);
                  return (
                    <Badge key={tag.tag} variant="secondary" className="text-xs">
                      {tagInfo?.icon} {tagInfo?.label.split(" ")[0]}
                    </Badge>
                  );
                })}
                {business.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{business.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b py-6 px-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-4">Find Muslim Businesses</h1>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <Input
                placeholder="Search businesses..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="md:col-span-2"
              />

              <Select
                value={filters.category}
                onChange={(e) => setFilters({ category: e.target.value })}
              >
                <option value="">All Categories</option>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="relative"
                >
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Distance</label>
                    <Select
                      value={filters.distance}
                      onChange={(e) => setFilters({ distance: e.target.value })}
                    >
                      {DISTANCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Sort By</label>
                    <Select
                      value={filters.sort}
                      onChange={(e) => setFilters({ sort: e.target.value })}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Price Range</label>
                    <Select
                      value={filters.priceRange}
                      onChange={(e) => setFilters({ priceRange: e.target.value })}
                    >
                      <option value="">Any Price</option>
                      {PRICE_RANGES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} - {opt.description}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum Rating</label>
                    <Select
                      value={filters.minRating}
                      onChange={(e) => setFilters({ minRating: e.target.value })}
                    >
                      <option value="">Any Rating</option>
                      <option value="4">4+ Stars</option>
                      <option value="3">3+ Stars</option>
                      <option value="2">2+ Stars</option>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Tag Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {BUSINESS_TAGS.map((tag) => (
              <button
                key={tag.value}
                onClick={() => handleTagFilter(tag.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  filters.tags.includes(tag.value)
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-gray-300 hover:border-primary hover:text-primary"
                }`}
              >
                {tag.icon} {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto max-w-6xl py-8 px-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Finding businesses near you...</p>
          </div>
        ) : sortedBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 mb-4">No businesses found</p>
            <p className="text-sm text-gray-500 mb-4">
              Try adjusting your search filters or expanding your search radius
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Found <strong>{sortedBusinesses.length}</strong> businesses
                {userLocation && ` within ${filters.distance} miles`}
              </p>
              <div className="flex items-center gap-2">
                {favorites.length > 0 && (
                  <Link href="/favorites">
                    <Button variant="outline" size="sm">
                      View Favorites ({favorites.length})
                    </Button>
                  </Link>
                )}
                {/* View Toggle */}
                <ViewToggle value={viewMode} onChange={setViewMode} />
              </div>
            </div>

            {viewMode === "split" ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* List on left */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {sortedBusinesses.map((business) => renderBusinessCard(business, true))}
                </div>
                {/* Map on right */}
                <div className="h-[600px] rounded-lg overflow-hidden border sticky top-24">
                  <MapLibreMap
                    businesses={businessesForMap}
                    userLat={userLocation?.lat ?? 37.5485}
                    userLng={userLocation?.lng ?? -121.9886}
                    radius={parseInt(filters.distance) || 25}
                  />
                </div>
              </div>
            ) : viewMode === "map" ? (
              <div className="h-[600px] rounded-lg overflow-hidden border">
                <MapLibreMap
                  businesses={businessesForMap}
                  userLat={userLocation?.lat ?? 37.5485}
                  userLng={userLocation?.lng ?? -121.9886}
                  radius={parseInt(filters.distance) || 25}
                />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedBusinesses.map((business) => renderBusinessCard(business))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
