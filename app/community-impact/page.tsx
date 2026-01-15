"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface CommunityStats {
  totalBusinesses: number;
  totalReviews: number;
  totalUsers: number;
  jobsCreated: number;
  economicImpact: number;
  localSpending: number;
  averageBusinessRating: number;
}

interface ImpactStory {
  id: string;
  title: string;
  description: string;
  businessName: string;
  metric: string;
  value: string;
  image?: string;
}

interface CategoryImpact {
  category: string;
  businesses: number;
  revenue: number;
  jobs: number;
  growth: number;
}

// Mock data
const mockStats: CommunityStats = {
  totalBusinesses: 1247,
  totalReviews: 8934,
  totalUsers: 15678,
  jobsCreated: 4500,
  economicImpact: 45000000,
  localSpending: 12000000,
  averageBusinessRating: 4.3,
};

const mockStories: ImpactStory[] = [
  {
    id: "1",
    title: "From Home Kitchen to Restaurant",
    description: "Fatima's Halal Catering grew from a home business to a full restaurant, creating 12 new jobs in the community.",
    businessName: "Fatima's Kitchen",
    metric: "Jobs Created",
    value: "12",
  },
  {
    id: "2",
    title: "Supporting Local Farmers",
    description: "Al-Noor Market partners with 15 local halal farms, keeping $2M annually in the local economy.",
    businessName: "Al-Noor Market",
    metric: "Local Investment",
    value: "$2M",
  },
  {
    id: "3",
    title: "Community Masjid Expansion",
    description: "Community donations through Manakhaah helped fund a new community center adjacent to the masjid.",
    businessName: "Islamic Center LA",
    metric: "Funds Raised",
    value: "$500K",
  },
];

const mockCategoryImpact: CategoryImpact[] = [
  { category: "Restaurants", businesses: 456, revenue: 15000000, jobs: 1800, growth: 12 },
  { category: "Grocery & Halal", businesses: 234, revenue: 12000000, jobs: 900, growth: 8 },
  { category: "Services", businesses: 189, revenue: 8000000, jobs: 600, growth: 15 },
  { category: "Masjids", businesses: 87, revenue: 0, jobs: 200, growth: 5 },
  { category: "Health & Wellness", businesses: 145, revenue: 6000000, jobs: 500, growth: 20 },
  { category: "Education", businesses: 78, revenue: 3000000, jobs: 300, growth: 25 },
];

export default function CommunityImpactPage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("all");

  useEffect(() => {
    loadStats();
  }, [selectedRegion]);

  const loadStats = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setStats(mockStats);
    setLoading(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community impact data...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Economic Impact</h1>
          <p className="text-gray-600 text-lg">
            See how supporting Muslim-owned businesses strengthens our community
          </p>
        </div>

        {/* Region Filter */}
        <div className="flex justify-center gap-2 mb-8">
          {["all", "los-angeles", "orange-county", "san-diego"].map((region) => (
            <Button
              key={region}
              variant={selectedRegion === region ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRegion(region)}
            >
              {region === "all"
                ? "All Regions"
                : region.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </Button>
          ))}
        </div>

        {/* Main Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🏪</div>
              <p className="text-3xl font-bold">{stats.totalBusinesses.toLocaleString()}</p>
              <p className="text-green-100">Muslim-Owned Businesses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">💼</div>
              <p className="text-3xl font-bold">{stats.jobsCreated.toLocaleString()}</p>
              <p className="text-blue-100">Jobs Created</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-3xl font-bold">{formatNumber(stats.economicImpact)}</p>
              <p className="text-purple-100">Economic Impact</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-orange-100">Community Members</p>
            </CardContent>
          </Card>
        </div>

        {/* Impact by Category */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Impact by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-right py-3 px-4">Businesses</th>
                    <th className="text-right py-3 px-4">Est. Revenue</th>
                    <th className="text-right py-3 px-4">Jobs</th>
                    <th className="text-right py-3 px-4">YoY Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCategoryImpact.map((cat) => (
                    <tr key={cat.category} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{cat.category}</td>
                      <td className="py-3 px-4 text-right">{cat.businesses}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(cat.revenue)}</td>
                      <td className="py-3 px-4 text-right">{cat.jobs}</td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          className={
                            cat.growth >= 15
                              ? "bg-green-100 text-green-700"
                              : cat.growth >= 10
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          +{cat.growth}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Impact Stories */}
        <h2 className="text-2xl font-bold mb-4">Impact Stories</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {mockStories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Badge variant="secondary" className="mb-3">
                  {story.metric}: {story.value}
                </Badge>
                <h3 className="font-bold text-lg mb-2">{story.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{story.description}</p>
                <p className="text-sm text-primary font-medium">{story.businessName}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Community Milestones */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Community Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {[
                  { year: "2024", milestone: "Reached 1,000+ businesses on the platform", icon: "🎉" },
                  { year: "2023", milestone: "Facilitated $10M in community spending", icon: "💰" },
                  { year: "2022", milestone: "Launched community referral program", icon: "🤝" },
                  { year: "2021", milestone: "Platform founded to support Muslim businesses", icon: "🚀" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 ml-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center -ml-8 z-10">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{item.year}</p>
                      <p className="font-medium">{item.milestone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Be Part of the Impact</h2>
            <p className="text-green-100 mb-6">
              Every purchase at a Muslim-owned business strengthens our community.
              Join thousands of community members making a difference.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/search">
                <Button variant="secondary">Find Businesses</Button>
              </Link>
              <Link href="/business/register">
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
