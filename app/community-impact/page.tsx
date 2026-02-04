"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Building2, TrendingUp, Users, DollarSign, Calendar, Star, MapPin } from "lucide-react";

interface CommunityStats {
  totalBusinesses: number;
  totalUsers: number;
  totalReviews: number;
  totalEvents: number;
  newBusinessesThisMonth: number;
  growthRate: number;
  businessesByCategory: { category: string; count: number }[];
  topCities: { city: string; count: number }[];
}

export default function CommunityImpactPage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/community/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error loading stats:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading community impact data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Economic Impact</h1>
          <p className="text-gray-600 text-lg">
            See how supporting Muslim-owned businesses strengthens our community
          </p>
        </div>

        {!stats || stats.totalBusinesses === 0 ? (
          /* Empty State */
          <Card className="text-center p-12 bg-gradient-to-br from-green-50 to-emerald-50 border-dashed border-2 border-green-200 mb-8">
            <div className="max-w-lg mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Impact Data Coming Soon</h3>
              <p className="text-gray-600 mb-6">
                As our community grows, we'll track and display the economic impact of supporting Muslim-owned businesses.
                Be part of building this data by listing your business or supporting local businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button size="lg">
                    <Building2 className="w-4 h-4 mr-2" />
                    List Your Business
                  </Button>
                </Link>
                <Link href="/search">
                  <Button size="lg" variant="outline">
                    Find Businesses
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold mb-1">{stats.totalBusinesses}</h3>
                  <p className="text-sm text-gray-600">Muslim-Owned Businesses</p>
                  {stats.newBusinessesThisMonth > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      +{stats.newBusinessesThisMonth} this month
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold mb-1">{stats.totalUsers}</h3>
                  <p className="text-sm text-gray-600">Community Members</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold mb-1">{stats.totalReviews}</h3>
                  <p className="text-sm text-gray-600">Reviews & Recommendations</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold mb-1">{stats.totalEvents}</h3>
                  <p className="text-sm text-gray-600">Community Events</p>
                </CardContent>
              </Card>
            </div>

            {/* Growth Rate */}
            {stats.growthRate !== 0 && (
              <Card className="mb-8 bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Community Growth</h3>
                      <p className="text-green-100 text-sm">
                        {stats.growthRate > 0 ? "Growing" : "Adjusting"} this month
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-8 h-8" />
                      <span className="text-4xl font-bold">
                        {stats.growthRate > 0 ? "+" : ""}{stats.growthRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Cities */}
            {stats.topCities.length > 0 && (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-bold">Top Cities</h2>
                  </div>
                  <div className="space-y-3">
                    {stats.topCities.map((city, index) => (
                      <div key={city.city} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                          <span className="font-medium">{city.city}</span>
                        </div>
                        <span className="text-gray-600">{city.count} businesses</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Categories */}
            {stats.businessesByCategory.length > 0 && (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-bold">Business Categories</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {stats.businessesByCategory.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium capitalize">{cat.category.toLowerCase()}</span>
                        <span className="text-gray-600">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* What We'll Track */}
        <h2 className="text-2xl font-bold mb-4 text-center">What We'll Track</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Businesses Listed</h3>
              <p className="text-sm text-gray-600">Total Muslim-owned businesses in our directory</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Community Members</h3>
              <p className="text-sm text-gray-600">Users supporting local businesses</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1">Economic Impact</h3>
              <p className="text-sm text-gray-600">Money kept within our community</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-1">Growth Trends</h3>
              <p className="text-sm text-gray-600">How our community is expanding</p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Be Part of the Impact</h2>
            <p className="text-green-100 mb-6">
              Every purchase at a Muslim-owned business strengthens our community.
              Join us in building a thriving local economy.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/search">
                <Button variant="secondary">Find Businesses</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="text-white border-white hover:bg-white/10">
                  List Your Business
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
