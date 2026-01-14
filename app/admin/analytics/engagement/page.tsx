"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface EngagementStats {
  totalUsers: number;
  totalReviews: number;
  totalMessages: number;
  communityPosts: number;
  totalBookings: number;
  reviewsByStatus: Record<string, number>;
  bookingsByStatus: Record<string, number>;
}

export default function EngagementAnalyticsPage() {
  const { data: session } = useMockSession();
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.stats.totalUsers || 0,
          totalReviews: data.stats.totalReviews || 0,
          totalMessages: data.stats.totalMessages || 0,
          communityPosts: data.stats.communityPosts || 0,
          totalBookings: data.stats.totalBookings || 0,
          reviewsByStatus: data.stats.reviewsByStatus || {},
          bookingsByStatus: data.stats.bookingsByStatus || {},
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock engagement trend data
  const engagementTrendData = [
    { month: "Jan", reviews: 12, messages: 45, posts: 8, bookings: 15 },
    { month: "Feb", reviews: 18, messages: 52, posts: 12, bookings: 22 },
    { month: "Mar", reviews: 25, messages: 61, posts: 15, bookings: 30 },
    { month: "Apr", reviews: 32, messages: 78, posts: 20, bookings: 38 },
    { month: "May", reviews: 40, messages: 92, posts: 28, bookings: 45 },
    { month: "Jun", reviews: 48, messages: 108, posts: 35, bookings: 52 },
  ];

  const dailyActivityData = [
    { day: "Mon", activity: 120 },
    { day: "Tue", activity: 145 },
    { day: "Wed", activity: 132 },
    { day: "Thu", activity: 158 },
    { day: "Fri", activity: 175 },
    { day: "Sat", activity: 95 },
    { day: "Sun", activity: 85 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Engagement Analytics</h1>
          <p className="text-gray-600">Track user activity and engagement metrics</p>
        </div>
        <Link href="/admin/analytics">
          <Button variant="outline">Back to Analytics</Button>
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center">Loading analytics...</div>
      ) : (
        <div className="space-y-6">
          {/* Engagement Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600">
                  {stats?.totalUsers || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-yellow-600">
                  {stats?.totalReviews || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Reviews</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-600">
                  {stats?.totalMessages || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Messages</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-purple-600">
                  {stats?.communityPosts || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Community Posts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-pink-600">
                  {stats?.totalBookings || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Bookings</div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={engagementTrendData}>
                  <defs>
                    <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="reviews"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorReviews)"
                    name="Reviews"
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorMessages)"
                    name="Messages"
                  />
                  <Area
                    type="monotone"
                    dataKey="posts"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorPosts)"
                    name="Posts"
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#ec4899"
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                    name="Bookings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Activity & Metrics */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="activity"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                      name="User Activity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Reviews per User */}
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Avg. Reviews per User</div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {stats && stats.totalUsers > 0
                            ? (stats.totalReviews / stats.totalUsers).toFixed(2)
                            : "0.00"}
                        </div>
                      </div>
                      <div className="text-4xl">⭐</div>
                    </div>
                  </div>

                  {/* Messages per User */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Avg. Messages per User</div>
                        <div className="text-2xl font-bold text-green-600">
                          {stats && stats.totalUsers > 0
                            ? (stats.totalMessages / stats.totalUsers).toFixed(2)
                            : "0.00"}
                        </div>
                      </div>
                      <div className="text-4xl">💬</div>
                    </div>
                  </div>

                  {/* Booking Rate */}
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Booking Completion Rate</div>
                        <div className="text-2xl font-bold text-pink-600">
                          {stats && stats.totalBookings > 0
                            ? Math.round(
                                ((stats.bookingsByStatus?.COMPLETED || 0) /
                                  stats.totalBookings) *
                                  100
                              )
                            : 0}
                          %
                        </div>
                      </div>
                      <div className="text-4xl">📅</div>
                    </div>
                  </div>

                  {/* Review Approval Rate */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Review Approval Rate</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {stats && stats.totalReviews > 0
                            ? Math.round(
                                ((stats.reviewsByStatus?.PUBLISHED || 0) /
                                  stats.totalReviews) *
                                  100
                              )
                            : 0}
                          %
                        </div>
                      </div>
                      <div className="text-4xl">✅</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
