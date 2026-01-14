"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_CATEGORIES, BUSINESS_TAGS, PRICE_RANGES } from "@/lib/constants";
import { useMockSession } from "@/components/mock-session-provider";

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  averageRating: number;
  reviewCount: number;
  priceRange?: string;
  verificationStatus?: string;
  tags: { tag: string }[];
  photos: { url: string }[];
}

export default function FavoritesPage() {
  const { data: session } = useMockSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Business[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"favorites" | "recent">("favorites");

  useEffect(() => {
    const savedFavorites = localStorage.getItem("manakhaah-favorites");
    const savedRecent = localStorage.getItem("manakhaah-recently-viewed");

    const favoriteIds = savedFavorites ? JSON.parse(savedFavorites) : [];
    const recentIds = savedRecent ? JSON.parse(savedRecent) : [];

    setFavorites(favoriteIds);
    fetchBusinesses(favoriteIds, recentIds);
  }, []);

  const fetchBusinesses = async (favoriteIds: string[], recentIds: string[]) => {
    setLoading(true);
    try {
      const response = await fetch("/api/businesses?status=PUBLISHED");
      if (response.ok) {
        const allBusinesses = await response.json();

        const favBusinesses = allBusinesses.filter((b: Business) => favoriteIds.includes(b.id));
        const recentBusinesses = recentIds
          .map((id: string) => allBusinesses.find((b: Business) => b.id === id))
          .filter(Boolean);

        setBusinesses(favBusinesses);
        setRecentlyViewed(recentBusinesses);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (businessId: string) => {
    const newFavorites = favorites.includes(businessId)
      ? favorites.filter((id) => id !== businessId)
      : [...favorites, businessId];
    setFavorites(newFavorites);
    localStorage.setItem("manakhaah-favorites", JSON.stringify(newFavorites));

    if (!newFavorites.includes(businessId)) {
      setBusinesses(businesses.filter((b) => b.id !== businessId));
    }
  };

  const clearRecentlyViewed = () => {
    localStorage.removeItem("manakhaah-recently-viewed");
    setRecentlyViewed([]);
  };

  const displayedBusinesses = activeTab === "favorites" ? businesses : recentlyViewed;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">My Saved Businesses</h1>
            <Link href="/search">
              <Button variant="outline">Browse All</Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "favorites"
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "recent"
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Recently Viewed ({recentlyViewed.length})
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : displayedBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {activeTab === "favorites" ? "❤️" : "👀"}
            </div>
            <p className="text-gray-600 mb-4">
              {activeTab === "favorites"
                ? "You haven't saved any favorites yet"
                : "No recently viewed businesses"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {activeTab === "favorites"
                ? "Click the heart icon on any business to save it here"
                : "Businesses you view will appear here"}
            </p>
            <Link href="/search">
              <Button>Find Businesses</Button>
            </Link>
          </div>
        ) : (
          <>
            {activeTab === "recent" && recentlyViewed.length > 0 && (
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={clearRecentlyViewed}>
                  Clear History
                </Button>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedBusinesses.map((business) => (
                <Card key={business.id} className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <Link href={`/business/${business.id}`}>
                      <div className="relative">
                        {business.photos.length > 0 ? (
                          <div className="aspect-video bg-gray-200 rounded-t-lg" />
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center">
                            <span className="text-4xl">
                              {business.category === "MASJID" ? "🕌" : "🏪"}
                            </span>
                          </div>
                        )}

                        {business.verificationStatus === "APPROVED" && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            ✓ Verified
                          </div>
                        )}

                        {business.priceRange && (
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            {PRICE_RANGES.find((p) => p.value === business.priceRange)?.label}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <Link href={`/business/${business.id}`} className="flex-1">
                          <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                            {business.name}
                          </h3>
                        </Link>
                        {activeTab === "favorites" && (
                          <button
                            onClick={() => toggleFavorite(business.id)}
                            className="p-1 hover:scale-110 transition-transform ml-2"
                          >
                            ❤️
                          </button>
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

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {business.description}
                      </p>

                      <p className="text-sm text-gray-500 mb-3">
                        {business.address}, {business.city}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {business.tags.slice(0, 3).map((tag) => {
                          const tagInfo = BUSINESS_TAGS.find((t) => t.value === tag.tag);
                          return (
                            <Badge key={tag.tag} variant="secondary" className="text-xs">
                              {tagInfo?.icon} {tagInfo?.label.split(" ")[0]}
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <a href={`tel:${business.phone}`} className="flex-1">
                          <Button size="sm" className="w-full">
                            Call
                          </Button>
                        </a>
                        <Link href={`/business/${business.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
