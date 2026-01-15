"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface TrendItem {
  id: string;
  title: string;
  description: string;
  category: string;
  growth: number;
  timeframe: string;
  relatedBusinesses: number;
}

interface TrendReport {
  id: string;
  title: string;
  date: string;
  summary: string;
  keyFindings: string[];
  downloadUrl?: string;
}

interface SearchTrend {
  term: string;
  searches: number;
  change: number;
}

// Mock data
const mockTrends: TrendItem[] = [
  {
    id: "1",
    title: "Rise of Halal Fast Casual",
    description: "Fast casual halal restaurants are seeing unprecedented growth as consumers seek quick, quality halal options.",
    category: "Restaurants",
    growth: 45,
    timeframe: "Last 6 months",
    relatedBusinesses: 89,
  },
  {
    id: "2",
    title: "Halal Beauty Products Boom",
    description: "Demand for halal-certified beauty and skincare products has surged, especially among younger consumers.",
    category: "Health & Beauty",
    growth: 62,
    timeframe: "Last year",
    relatedBusinesses: 34,
  },
  {
    id: "3",
    title: "Islamic Finance Services",
    description: "Growing interest in halal investment and Islamic banking options in the community.",
    category: "Financial Services",
    growth: 38,
    timeframe: "Last year",
    relatedBusinesses: 23,
  },
  {
    id: "4",
    title: "Online Halal Grocery",
    description: "Online ordering and delivery of halal groceries has become mainstream.",
    category: "Grocery",
    growth: 85,
    timeframe: "Last 2 years",
    relatedBusinesses: 56,
  },
];

const mockReports: TrendReport[] = [
  {
    id: "1",
    title: "Q4 2024 Muslim Business Trends Report",
    date: "January 2025",
    summary: "Comprehensive analysis of Muslim-owned business growth, consumer behavior, and emerging opportunities.",
    keyFindings: [
      "Restaurant sector grew 23% YoY",
      "Online bookings increased 156%",
      "Average customer spend up 12%",
    ],
  },
  {
    id: "2",
    title: "Ramadan Consumer Behavior 2024",
    date: "May 2024",
    summary: "Analysis of consumer spending patterns and business performance during Ramadan.",
    keyFindings: [
      "Peak ordering times shifted to 10-11 PM",
      "Catering services saw 340% increase",
      "Grocery spending doubled during month",
    ],
  },
  {
    id: "3",
    title: "Muslim Consumer Preferences Survey",
    date: "March 2024",
    summary: "Survey of 5,000+ community members on business preferences and priorities.",
    keyFindings: [
      "78% prioritize halal certification",
      "65% prefer Muslim-owned businesses",
      "82% rely on online reviews",
    ],
  },
];

const mockSearchTrends: SearchTrend[] = [
  { term: "halal chicken near me", searches: 12500, change: 25 },
  { term: "halal catering", searches: 8900, change: 45 },
  { term: "muslim dentist", searches: 5600, change: 18 },
  { term: "halal mortgage", searches: 4200, change: 67 },
  { term: "islamic school", searches: 3800, change: 12 },
  { term: "halal meat delivery", searches: 3500, change: 89 },
  { term: "muslim real estate agent", searches: 2900, change: 34 },
  { term: "halal bakery", searches: 2400, change: 15 },
];

export default function TrendsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const filteredTrends = selectedCategory
    ? mockTrends.filter((t) => t.category === selectedCategory)
    : mockTrends;

  const categories = [...new Set(mockTrends.map((t) => t.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trend data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Trend Reports</h1>
          <p className="text-gray-600 text-lg">
            Insights and trends from the Muslim business community
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Current Trends */}
        <h2 className="text-2xl font-bold mb-4">Current Trends</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {filteredTrends.map((trend) => (
            <Card key={trend.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary">{trend.category}</Badge>
                  <Badge className="bg-green-100 text-green-700">
                    +{trend.growth}% growth
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-2">{trend.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{trend.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{trend.timeframe}</span>
                  <span>{trend.relatedBusinesses} businesses</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Trends */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Popular Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {mockSearchTrends.map((trend, i) => (
                <div
                  key={trend.term}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-medium">{i + 1}</span>
                    <span className="font-medium">{trend.term}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {(trend.searches / 1000).toFixed(1)}K
                    </span>
                    <Badge
                      className={
                        trend.change >= 50
                          ? "bg-green-100 text-green-700"
                          : trend.change >= 20
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      +{trend.change}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Reports */}
        <h2 className="text-2xl font-bold mb-4">Published Reports</h2>
        <div className="space-y-4 mb-8">
          {mockReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{report.date}</Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{report.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{report.summary}</p>

                    <div className="flex flex-wrap gap-2">
                      {report.keyFindings.map((finding, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {finding}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscribe CTA */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
            <p className="text-blue-100 mb-6">
              Subscribe to receive monthly trend reports and industry insights
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg text-gray-900"
              />
              <Button variant="secondary">Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
