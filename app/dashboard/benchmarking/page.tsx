"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface BenchmarkMetric {
  name: string;
  yourValue: number;
  categoryAverage: number;
  topPerformers: number;
  unit: string;
  higherIsBetter: boolean;
}

interface BenchmarkData {
  overallScore: number;
  categoryRank: number;
  totalInCategory: number;
  metrics: BenchmarkMetric[];
  improvements: string[];
  strengths: string[];
}

// Mock data generator
function generateBenchmarkData(): BenchmarkData {
  return {
    overallScore: 78,
    categoryRank: 23,
    totalInCategory: 145,
    metrics: [
      { name: "Average Rating", yourValue: 4.5, categoryAverage: 4.2, topPerformers: 4.8, unit: "stars", higherIsBetter: true },
      { name: "Review Count", yourValue: 45, categoryAverage: 67, topPerformers: 150, unit: "reviews", higherIsBetter: true },
      { name: "Response Rate", yourValue: 92, categoryAverage: 75, topPerformers: 98, unit: "%", higherIsBetter: true },
      { name: "Response Time", yourValue: 2.5, categoryAverage: 8, topPerformers: 1, unit: "hours", higherIsBetter: false },
      { name: "Profile Completeness", yourValue: 85, categoryAverage: 72, topPerformers: 100, unit: "%", higherIsBetter: true },
      { name: "Photo Count", yourValue: 8, categoryAverage: 12, topPerformers: 25, unit: "photos", higherIsBetter: true },
      { name: "Deal Engagement", yourValue: 34, categoryAverage: 28, topPerformers: 65, unit: "%", higherIsBetter: true },
      { name: "Booking Rate", yourValue: 15, categoryAverage: 22, topPerformers: 45, unit: "%", higherIsBetter: true },
    ],
    improvements: [
      "Add more photos to your profile (you have 8, top performers average 25)",
      "Increase your review count by encouraging satisfied customers to leave reviews",
      "Consider adding a booking system to increase conversion",
    ],
    strengths: [
      "Your response time is 3x faster than category average",
      "Your rating is above category average",
      "Strong response rate at 92%",
    ],
  };
}

export default function BenchmarkingPage() {
  const { data: session } = useMockSession();
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"30d" | "90d" | "1y">("90d");

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setData(generateBenchmarkData());
    setLoading(false);
  };

  const getPerformanceColor = (metric: BenchmarkMetric) => {
    const performance = metric.higherIsBetter
      ? metric.yourValue / metric.categoryAverage
      : metric.categoryAverage / metric.yourValue;

    if (performance >= 1.2) return "text-green-600";
    if (performance >= 0.9) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (metric: BenchmarkMetric) => {
    const performance = metric.higherIsBetter
      ? metric.yourValue / metric.categoryAverage
      : metric.categoryAverage / metric.yourValue;

    if (performance >= 1.2) return { text: "Above Average", color: "bg-green-100 text-green-700" };
    if (performance >= 0.9) return { text: "Average", color: "bg-yellow-100 text-yellow-700" };
    return { text: "Below Average", color: "bg-red-100 text-red-700" };
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">Business Owners Only</h2>
            <p className="text-gray-600 mb-4">
              Please sign in with a business owner account to view benchmarking data.
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your business performance...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/dashboard" className="text-primary hover:underline text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Business Benchmarking</h1>
            <p className="text-gray-600 mt-1">
              See how your business compares to others in your category
            </p>
          </div>
          <div className="flex gap-2">
            {(["30d", "90d", "1y"] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period === "30d" ? "30 Days" : period === "90d" ? "90 Days" : "1 Year"}
              </Button>
            ))}
          </div>
        </div>

        {/* Overall Score */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Overall Performance Score</p>
                  <p className="text-5xl font-bold text-green-600">{data.overallScore}</p>
                  <p className="text-sm text-gray-500 mt-1">out of 100</p>
                </div>
                <div className="text-right">
                  <div className="w-32 h-32 relative">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(data.overallScore / 100) * 352} 352`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{data.overallScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Category Ranking</p>
              <p className="text-4xl font-bold text-blue-600">#{data.categoryRank}</p>
              <p className="text-sm text-gray-500">of {data.totalInCategory} businesses</p>
              <p className="text-xs text-green-600 mt-2">Top {Math.round((data.categoryRank / data.totalInCategory) * 100)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Metric</th>
                    <th className="text-right py-3 px-4">Your Value</th>
                    <th className="text-right py-3 px-4">Category Avg</th>
                    <th className="text-right py-3 px-4">Top Performers</th>
                    <th className="text-right py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.metrics.map((metric) => {
                    const badge = getPerformanceBadge(metric);
                    return (
                      <tr key={metric.name} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{metric.name}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${getPerformanceColor(metric)}`}>
                          {metric.yourValue} {metric.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500">
                          {metric.categoryAverage} {metric.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500">
                          {metric.topPerformers} {metric.unit}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge className={badge.color}>{badge.text}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-500">↑</span> Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.improvements.map((improvement, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/dashboard/photos">
                <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                  <div className="text-2xl mb-2">📸</div>
                  <h4 className="font-medium">Add More Photos</h4>
                  <p className="text-sm text-gray-500">Businesses with 20+ photos get 2x more views</p>
                </div>
              </Link>
              <Link href="/dashboard/deals">
                <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                  <div className="text-2xl mb-2">🏷️</div>
                  <h4 className="font-medium">Create a Deal</h4>
                  <p className="text-sm text-gray-500">Deals increase engagement by 45%</p>
                </div>
              </Link>
              <Link href="/dashboard/services">
                <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                  <div className="text-2xl mb-2">📋</div>
                  <h4 className="font-medium">Add Services Menu</h4>
                  <p className="text-sm text-gray-500">Help customers understand your offerings</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
