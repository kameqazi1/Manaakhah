"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BUSINESS_CATEGORIES, BUSINESS_TAGS, PRICE_RANGES } from "@/lib/constants";

interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  website?: string;
  averageRating: number;
  reviewCount: number;
  priceRange?: string;
  verificationStatus?: string;
  tags: { tag: string }[];
  services: string[];
  hours?: Record<string, { open: string; close: string }>;
}

const COMPARE_STORAGE_KEY = "manakhaah-compare-list";

export default function ComparePage() {
  const { data: session } = useMockSession();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadCompareList();
  }, []);

  useEffect(() => {
    if (compareIds.length > 0) {
      fetchBusinesses();
    } else {
      setBusinesses([]);
      setLoading(false);
    }
  }, [compareIds]);

  const loadCompareList = () => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (stored) {
        setCompareIds(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading compare list:", error);
    }
    setLoading(false);
  };

  const saveCompareList = (ids: string[]) => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
      setCompareIds(ids);
    } catch (error) {
      console.error("Error saving compare list:", error);
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      // In mock mode, generate mock data for the IDs
      const mockBusinesses: Business[] = compareIds.map((id, index) => ({
        id,
        name: [`Al-Noor Restaurant`, `Bismillah Market`, `Medina Cafe`, `Salam Grocers`][index % 4],
        category: ["RESTAURANT", "GROCERY", "HALAL_FOOD", "GROCERY"][index % 4],
        description: "A wonderful Muslim-owned business serving the local community with quality products and services.",
        address: `${100 + index * 100} Main Street`,
        city: "Los Angeles",
        phone: `(555) ${100 + index}-${1000 + index}`,
        website: `https://example.com/${id}`,
        averageRating: 4.2 + (index * 0.2),
        reviewCount: 50 + index * 30,
        priceRange: ["$", "$$", "$$$"][index % 3],
        verificationStatus: index % 2 === 0 ? "APPROVED" : "PENDING",
        tags: [
          { tag: "HALAL_CERTIFIED" },
          { tag: index % 2 === 0 ? "SISTERS_FRIENDLY" : "FAMILY_FRIENDLY" },
        ],
        services: ["Dine-in", "Takeout", "Delivery"].slice(0, 2 + (index % 2)),
        hours: {
          monday: { open: "09:00", close: "21:00" },
          tuesday: { open: "09:00", close: "21:00" },
          wednesday: { open: "09:00", close: "21:00" },
          thursday: { open: "09:00", close: "21:00" },
          friday: { open: "09:00", close: "22:00" },
          saturday: { open: "10:00", close: "22:00" },
          sunday: { open: "10:00", close: "20:00" },
        },
      }));

      setBusinesses(mockBusinesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/businesses?search=${encodeURIComponent(searchQuery)}&status=PUBLISHED`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setSearching(false);
    }
  };

  const addToCompare = (business: Business) => {
    if (compareIds.length >= 4) {
      alert("You can compare up to 4 businesses at a time");
      return;
    }
    if (compareIds.includes(business.id)) return;

    const newIds = [...compareIds, business.id];
    saveCompareList(newIds);
    setBusinesses([...businesses, business]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeFromCompare = (id: string) => {
    const newIds = compareIds.filter((i) => i !== id);
    saveCompareList(newIds);
    setBusinesses(businesses.filter((b) => b.id !== id));
  };

  const clearAll = () => {
    saveCompareList([]);
    setBusinesses([]);
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      );
    }
    return stars;
  };

  const getTagInfo = (tagValue: string) => {
    return BUSINESS_TAGS.find((t) => t.value === tagValue);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Compare Businesses</h1>
            <p className="text-gray-600 mt-1">
              Compare up to 4 businesses side by side
            </p>
          </div>
          {businesses.length > 0 && (
            <Button variant="outline" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>

        {/* Add Business Search */}
        {businesses.length < 4 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search for a business to add..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 z-10">
                      {searchResults.map((business) => (
                        <button
                          key={business.id}
                          onClick={() => addToCompare(business)}
                          disabled={compareIds.includes(business.id)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="font-medium">{business.name}</div>
                          <div className="text-sm text-gray-500">
                            {BUSINESS_CATEGORIES.find((c) => c.value === business.category)?.label} • {business.city}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {4 - businesses.length} more businesses can be added
              </p>
            </CardContent>
          </Card>
        )}

        {/* Comparison Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading businesses...</p>
          </div>
        ) : businesses.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-6xl mb-4">⚖️</div>
              <h3 className="text-xl font-semibold mb-2">No Businesses to Compare</h3>
              <p className="text-gray-600 mb-4">
                Search for businesses above or add them from search results to start comparing.
              </p>
              <Link href="/search">
                <Button>Browse Businesses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left bg-gray-50 font-semibold w-48">Feature</th>
                  {businesses.map((business) => (
                    <th key={business.id} className="px-4 py-3 text-center bg-gray-50 min-w-[200px]">
                      <div className="flex flex-col items-center">
                        <Link
                          href={`/business/${business.id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {business.name}
                        </Link>
                        <button
                          onClick={() => removeFromCompare(business.id)}
                          className="text-xs text-red-500 hover:underline mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Category */}
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium bg-gray-50">Category</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      {BUSINESS_CATEGORIES.find((c) => c.value === b.category)?.label || b.category}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium bg-gray-50">Rating</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {renderRatingStars(Math.round(b.averageRating))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {b.averageRating.toFixed(1)} ({b.reviewCount} reviews)
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Price Range */}
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium bg-gray-50">Price Range</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      {b.priceRange ? (
                        <span className="text-lg font-medium text-green-600">{b.priceRange}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Verification */}
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium bg-gray-50">Verified</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      {b.verificationStatus === "APPROVED" ? (
                        <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
                      ) : (
                        <span className="text-gray-400">Not verified</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Tags */}
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium bg-gray-50">Features</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {b.tags.map((tag) => {
                          const tagInfo = getTagInfo(tag.tag);
                          return (
                            <Badge key={tag.tag} variant="secondary" className="text-xs">
                              {tagInfo?.icon} {tagInfo?.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Services */}
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium bg-gray-50">Services</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      <div className="text-sm">
                        {b.services?.join(", ") || <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium bg-gray-50">Location</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-center text-sm">
                      {b.address}, {b.city}
                    </td>
                  ))}
                </tr>

                {/* Contact */}
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium bg-gray-50">Contact</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-center text-sm">
                      <div>{b.phone}</div>
                      {b.website && (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Website
                        </a>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium bg-gray-50">Actions</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      <div className="flex flex-col gap-2">
                        <Link href={`/business/${b.id}`}>
                          <Button size="sm" className="w-full">View Details</Button>
                        </Link>
                        <Link href={`/business/${b.id}#contact`}>
                          <Button size="sm" variant="outline" className="w-full">Contact</Button>
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tip Card */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-medium">Quick Tip</h4>
                <p className="text-sm text-gray-600">
                  Add businesses to compare from the search results by clicking the "Compare" button on any business card.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
