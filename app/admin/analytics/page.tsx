"use client";

import { useEffect, useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function AnalyticsPage() {
  const { data: session } = useMockSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchAnalytics();
  }, [session]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="text-center py-12">Loading analytics...</div>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const userRoleData = [
    { name: "Consumers", value: stats.usersByRole?.CONSUMER || 0, color: "#3b82f6" },
    { name: "Business Owners", value: stats.usersByRole?.BUSINESS_OWNER || 0, color: "#10b981" },
    { name: "Admins", value: stats.usersByRole?.ADMIN || 0, color: "#8b5cf6" },
  ];

  const businessStatusData = [
    { name: "Published", count: stats.businessesByStatus?.PUBLISHED || 0 },
    { name: "Draft", count: stats.businessesByStatus?.DRAFT || 0 },
    { name: "Pending", count: stats.businessesByStatus?.PENDING_APPROVAL || 0 },
    { name: "Suspended", count: stats.businessesByStatus?.SUSPENDED || 0 },
  ];

  const reviewStatusData = [
    { name: "Published", value: stats.reviewsByStatus?.PUBLISHED || 0, color: "#10b981" },
    { name: "Pending", value: stats.reviewsByStatus?.PENDING || 0, color: "#f59e0b" },
    { name: "Flagged", value: stats.reviewsByStatus?.FLAGGED || 0, color: "#ef4444" },
    { name: "Removed", value: stats.reviewsByStatus?.REMOVED || 0, color: "#6b7280" },
  ];

  const bookingStatusData = [
    { name: "Pending", count: stats.bookingsByStatus?.PENDING || 0, color: "#f59e0b" },
    { name: "Confirmed", count: stats.bookingsByStatus?.CONFIRMED || 0, color: "#3b82f6" },
    { name: "Completed", count: stats.bookingsByStatus?.COMPLETED || 0, color: "#10b981" },
    { name: "Cancelled", count: stats.bookingsByStatus?.CANCELLED || 0, color: "#6b7280" },
    { name: "Rejected", count: stats.bookingsByStatus?.REJECTED || 0, color: "#ef4444" },
  ];

  // Mock time series data for engagement trends
  const engagementTrendData = [
    { month: "Jan", users: 45, businesses: 12, reviews: 34 },
    { month: "Feb", users: 52, businesses: 15, reviews: 45 },
    { month: "Mar", users: 61, businesses: 18, reviews: 58 },
    { month: "Apr", users: 70, businesses: 22, reviews: 72 },
    { month: "May", users: 85, businesses: 28, reviews: 91 },
    { month: "Jun", users: 95, businesses: 32, reviews: 108 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Platform Analytics</h1>
            <Link href="/admin">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
          <p className="text-gray-600">
            Monitor platform usage and engagement metrics
          </p>
        </div>

        {stats ? (
          <div className="space-y-6">
            {/* Key Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalUsers || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Users</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalBusinesses || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Businesses</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalReviews || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Reviews</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.totalBookings || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Bookings</div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={engagementTrendData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBusinesses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" name="Users" />
                    <Area type="monotone" dataKey="businesses" stroke="#10b981" fillOpacity={1} fill="url(#colorBusinesses)" name="Businesses" />
                    <Area type="monotone" dataKey="reviews" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorReviews)" name="Reviews" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Distribution & Business Status */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* User Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {userRoleData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Business Status Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={businessStatusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" name="Businesses">
                        {businessStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Review & Booking Analytics */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Review Status Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reviewStatusData.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reviewStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Booking Status Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bookingStatusData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" name="Bookings">
                        {bookingStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Community Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.totalMessages || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Messages</div>
                      </div>
                      <div className="text-4xl">💬</div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {stats.communityPosts || 0}
                        </div>
                        <div className="text-sm text-gray-600">Community Posts</div>
                      </div>
                      <div className="text-4xl">📝</div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {stats.flaggedPosts || 0}
                        </div>
                        <div className="text-sm text-gray-600">Flagged Posts</div>
                      </div>
                      <div className="text-4xl">🚩</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Active Businesses */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Active Businesses</span>
                        <span className="text-sm font-semibold">
                          {stats.totalBusinesses > 0
                            ? Math.round((stats.businessesByStatus?.PUBLISHED || 0) / stats.totalBusinesses * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${stats.totalBusinesses > 0
                              ? Math.round((stats.businessesByStatus?.PUBLISHED || 0) / stats.totalBusinesses * 100)
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Review Quality */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Review Quality</span>
                        <span className="text-sm font-semibold">
                          {stats.totalReviews > 0
                            ? Math.round((stats.reviewsByStatus?.PUBLISHED || 0) / stats.totalReviews * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${stats.totalReviews > 0
                              ? Math.round((stats.reviewsByStatus?.PUBLISHED || 0) / stats.totalReviews * 100)
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Booking Success Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Booking Success Rate</span>
                        <span className="text-sm font-semibold">
                          {stats.totalBookings > 0
                            ? Math.round(
                                ((stats.bookingsByStatus?.CONFIRMED || 0) +
                                 (stats.bookingsByStatus?.COMPLETED || 0)) /
                                stats.totalBookings * 100
                              )
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${stats.totalBookings > 0
                              ? Math.round(
                                  ((stats.bookingsByStatus?.CONFIRMED || 0) +
                                   (stats.bookingsByStatus?.COMPLETED || 0)) /
                                  stats.totalBookings * 100
                                )
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No analytics data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
