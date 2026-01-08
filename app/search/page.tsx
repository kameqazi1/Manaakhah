"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_CATEGORIES, BUSINESS_TAGS } from "@/lib/constants";

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
  tags: { tag: string }[];
  photos: { url: string }[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    tags: searchParams.get("tags") || "",
  });

  useEffect(() => {
    fetchBusinesses();
  }, [filters]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.category) params.append("category", filters.category);
      if (filters.tags) params.append("tags", filters.tags);
      params.append("status", "PUBLISHED");

      const response = await fetch(`/api/businesses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBusinesses();
  };

  const handleTagFilter = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags === tag ? "" : tag,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-4">Find Muslim Businesses</h1>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Input
                placeholder="Search businesses..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />

              <Select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <option value="">All Categories</option>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>

              <Button type="submit">Search</Button>
            </div>
          </form>

          {/* Tag Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {BUSINESS_TAGS.map((tag) => (
              <button
                key={tag.value}
                onClick={() => handleTagFilter(tag.value)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  filters.tags === tag.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-gray-300 hover:border-primary"
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
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading businesses...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No businesses found</p>
            <p className="text-sm text-gray-500">
              Try adjusting your search filters
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Found {businesses.length} businesses
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <Link href={`/business/${business.id}`} key={business.id}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      {business.photos.length > 0 ? (
                        <div className="aspect-video bg-gray-200 rounded-t-lg" />
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center">
                          <span className="text-4xl">
                            {business.category === "MASJID" ? "🕌" : "🏪"}
                          </span>
                        </div>
                      )}

                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">
                          {business.name}
                        </h3>

                        <div className="flex items-center gap-2 mb-2">
                          {business.averageRating > 0 && (
                            <div className="flex items-center text-sm">
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1">
                                {business.averageRating.toFixed(1)}
                              </span>
                              <span className="text-gray-500 ml-1">
                                ({business.reviewCount})
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {business.description}
                        </p>

                        <p className="text-sm text-gray-500 mb-3">
                          {business.address}, {business.city}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {business.tags.slice(0, 3).map((tag) => {
                            const tagInfo = BUSINESS_TAGS.find(
                              (t) => t.value === tag.tag
                            );
                            return (
                              <Badge
                                key={tag.tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tagInfo?.icon} {tagInfo?.label.split(" ")[0]}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
