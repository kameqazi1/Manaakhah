"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface AnalyticsData {
  views: { date: string; count: number }[];
  searches: { date: string; count: number }[];
  calls: { date: string; count: number }[];
  directions: { date: string; count: number }[];
  websiteClicks: { date: string; count: number }[];
  reviews: { date: string; count: number; avgRating: number }[];
  topSearchTerms: { term: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  demographics: {
    newVsReturning: { new: number; returning: number };
    deviceTypes: { mobile: number; desktop: number; tablet: number };
  };
}

// Generate mock analytics data
const generateMockData = (): AnalyticsData => {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split("T")[0];
  });

  return {
    views: last30Days.map((date) => ({
      date,
      count: Math.floor(Math.random() * 50) + 10,
    })),
    searches: last30Days.map((date) => ({
      date,
      count: Math.floor(Math.random() * 30) + 5,
    })),
    calls: last30Days.map((date) => ({
      date,
      count: Math.floor(Math.random() * 10) + 1,
    })),
    directions: last30Days.map((date) => ({
      date,
      count: Math.floor(Math.random() * 15) + 2,
    })),
    websiteClicks: last30Days.map((date) => ({
      date,
      count: Math.floor(Math.random() * 20) + 3,
    })),
    reviews: last30Days.map((date) => ({
      date,
      count: Math.floor(Math.random() * 3),
      avgRating: 4 + Math.random(),
    })),
    topSearchTerms: [
      { term: "halal restaurant", count: 145 },
      { term: "halal food fremont", count: 98 },
      { term: "muslim owned business", count: 67 },
      { term: "halal meat", count: 54 },
      { term: "islamic center", count: 43 },
    ],
    peakHours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hour >= 11 && hour <= 21 ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 10) + 1,
    })),
    demographics: {
      newVsReturning: { new: 65, returning: 35 },
      deviceTypes: { mobile: 58, desktop: 32, tablet: 10 },
    },
  };
};

export default function BusinessAnalyticsPage() {
  const { data: session } = useMockSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAnalytics(generateMockData());
      setLoading(false);
    }, 500);
  };

  const getTotalViews = () => {
    if (!analytics) return 0;
    return analytics.views.reduce((acc, v) => acc + v.count, 0);
  };

  const getTotalCalls = () => {
    if (!analytics) return 0;
    return analytics.calls.reduce((acc, c) => acc + c.count, 0);
  };

  const getTotalDirections = () => {
    if (!analytics) return 0;
    return analytics.directions.reduce((acc, d) => acc + d.count, 0);
  };

  const getTotalWebsiteClicks = () => {
    if (!analytics) return 0;
    return analytics.websiteClicks.reduce((acc, w) => acc + w.count, 0);
  };

  const getAvgRating = () => {
    if (!analytics) return 0;
    const reviewsWithRating = analytics.reviews.filter((r) => r.count > 0);
    if (reviewsWithRating.length === 0) return 0;
    return reviewsWithRating.reduce((acc, r) => acc + r.avgRating, 0) / reviewsWithRating.length;
  };

  const getTotalReviews = () => {
    if (!analytics) return 0;
    return analytics.reviews.reduce((acc, r) => acc + r.count, 0);
  };

  const getGrowthPercentage = (data: { count: number }[]) => {
    if (!data || data.length < 2) return 0;
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint).reduce((acc, d) => acc + d.count, 0);
    const secondHalf = data.slice(midpoint).reduce((acc, d) => acc + d.count, 0);
    if (firstHalf === 0) return 100;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  };

  const renderMiniChart = (data: { count: number }[]) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map((d) => d.count));
    const min = Math.min(...data.map((d) => d.count));
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-0.5 h-12">
        {data.slice(-14).map((d, i) => (
          <div
            key={i}
            className="flex-1 bg-green-500 rounded-t"
            style={{
              height: `${((d.count - min) / range) * 100}%`,
              minHeight: "4px",
            }}
          />
        ))}
      </div>
    );
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Please log in to view analytics.</p>
            <Link href="/auth/signin">
              <Button className="mt-4">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Business Analytics</h1>
          <p className="text-gray-600">Track your business performance and customer engagement</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading analytics...</div>
      ) : !analytics ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No analytics data available
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">👁️</span>
                  <span className={`text-sm ${getGrowthPercentage(analytics.views) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {getGrowthPercentage(analytics.views) >= 0 ? "+" : ""}{getGrowthPercentage(analytics.views)}%
                  </span>
                </div>
                <div className="text-3xl font-bold">{getTotalViews().toLocaleString()}</div>
                <div className="text-sm text-gray-600">Profile Views</div>
                {renderMiniChart(analytics.views)}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📞</span>
                  <span className={`text-sm ${getGrowthPercentage(analytics.calls) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {getGrowthPercentage(analytics.calls) >= 0 ? "+" : ""}{getGrowthPercentage(analytics.calls)}%
                  </span>
                </div>
                <div className="text-3xl font-bold">{getTotalCalls().toLocaleString()}</div>
                <div className="text-sm text-gray-600">Phone Calls</div>
                {renderMiniChart(analytics.calls)}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🗺️</span>
                  <span className={`text-sm ${getGrowthPercentage(analytics.directions) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {getGrowthPercentage(analytics.directions) >= 0 ? "+" : ""}{getGrowthPercentage(analytics.directions)}%
                  </span>
                </div>
                <div className="text-3xl font-bold">{getTotalDirections().toLocaleString()}</div>
                <div className="text-sm text-gray-600">Direction Requests</div>
                {renderMiniChart(analytics.directions)}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🌐</span>
                  <span className={`text-sm ${getGrowthPercentage(analytics.websiteClicks) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {getGrowthPercentage(analytics.websiteClicks) >= 0 ? "+" : ""}{getGrowthPercentage(analytics.websiteClicks)}%
                  </span>
                </div>
                <div className="text-3xl font-bold">{getTotalWebsiteClicks().toLocaleString()}</div>
                <div className="text-sm text-gray-600">Website Clicks</div>
                {renderMiniChart(analytics.websiteClicks)}
              </CardContent>
            </Card>
          </div>

          {/* Reviews & Rating */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reviews Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">
                      {getAvgRating().toFixed(1)} ★
                    </div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {getTotalReviews()}
                    </div>
                    <div className="text-sm text-gray-600">New Reviews</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Rating Distribution</h4>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const percentage = Math.floor(Math.random() * 30) + (rating === 5 ? 40 : rating === 4 ? 20 : 5);
                    return (
                      <div key={rating} className="flex items-center gap-2 mb-1">
                        <span className="text-sm w-12">{rating} stars</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-10">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Search Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  How customers found your business
                </p>
                <div className="space-y-3">
                  {analytics.topSearchTerms.map((term, index) => (
                    <div key={term.term} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400 w-6">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{term.term}</span>
                          <span className="text-sm text-gray-500">{term.count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{
                              width: `${(term.count / analytics.topSearchTerms[0].count) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours & Demographics */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peak Activity Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  When customers are most active
                </p>
                <div className="flex items-end gap-1 h-40">
                  {analytics.peakHours.map((hour) => {
                    const max = Math.max(...analytics.peakHours.map((h) => h.count));
                    return (
                      <div
                        key={hour.hour}
                        className="flex-1 flex flex-col items-center"
                        title={`${hour.hour}:00 - ${hour.count} views`}
                      >
                        <div
                          className="w-full bg-green-500 rounded-t hover:bg-green-600 cursor-pointer transition-colors"
                          style={{
                            height: `${(hour.count / max) * 100}%`,
                            minHeight: "4px",
                          }}
                        />
                        {hour.hour % 4 === 0 && (
                          <span className="text-xs text-gray-500 mt-1">
                            {hour.hour}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visitor Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">New vs Returning</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">New Visitors</span>
                        <span className="font-semibold">{analytics.demographics.newVsReturning.new}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${analytics.demographics.newVsReturning.new}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Returning</span>
                        <span className="font-semibold">{analytics.demographics.newVsReturning.returning}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${analytics.demographics.newVsReturning.returning}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Device Types</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.demographics.deviceTypes).map(([device, percentage]) => (
                        <div key={device}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{device}</span>
                            <span className="font-semibold">{percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                device === "mobile" ? "bg-purple-500" : device === "desktop" ? "bg-orange-500" : "bg-pink-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📈</span>
                    <span className="font-semibold text-green-700">Growing Traffic</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your profile views have increased by {getGrowthPercentage(analytics.views)}% compared to the previous period. Keep up the good work!
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">⭐</span>
                    <span className="font-semibold text-blue-700">Review Tip</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Responding to reviews can increase customer engagement by up to 35%. Consider responding to recent reviews.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📱</span>
                    <span className="font-semibold text-purple-700">Mobile First</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {analytics.demographics.deviceTypes.mobile}% of your visitors use mobile devices. Ensure your contact info is easy to tap!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
