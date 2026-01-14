"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface BusinessStats {
  totalBusinesses: number;
  businessesByStatus: Record<string, number>;
  businessesByCategory: Record<string, number>;
  topRatedBusinesses: Array<{
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
  }>;
  recentBusinesses: Array<{
    id: string;
    name: string;
    createdAt: string;
    status: string;
  }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function BusinessAnalyticsPage() {
  const { data: session } = useMockSession();
  const [stats, setStats] = useState<BusinessStats | null>(null);
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
          totalBusinesses: data.stats.totalBusinesses || 0,
          businessesByStatus: data.stats.businessesByStatus || {},
          businessesByCategory: data.stats.businessesByCategory || {},
          topRatedBusinesses: data.stats.topRatedBusinesses || [],
          recentBusinesses: data.stats.recentBusinesses || [],
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

  const statusData = stats
    ? Object.entries(stats.businessesByStatus).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
      }))
    : [];

  const categoryData = stats
    ? Object.entries(stats.businessesByCategory)
        .map(([name, value]) => ({ name, count: value }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Business Analytics</h1>
          <p className="text-gray-600">Detailed insights into business performance</p>
        </div>
        <Link href="/admin/analytics">
          <Button variant="outline">Back to Analytics</Button>
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center">Loading analytics...</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600">
                  {stats?.totalBusinesses || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Businesses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-600">
                  {stats?.businessesByStatus?.PUBLISHED || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Published</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-yellow-600">
                  {stats?.businessesByStatus?.PENDING_APPROVAL || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Pending Approval</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-gray-600">
                  {stats?.businessesByStatus?.DRAFT || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Drafts</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Business Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Businesses" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Rated & Recent Businesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Rated Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.topRatedBusinesses && stats.topRatedBusinesses.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topRatedBusinesses.map((business, index) => (
                      <div
                        key={business.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <div>
                            <Link
                              href={`/business/${business.id}`}
                              className="font-medium hover:text-blue-600"
                            >
                              {business.name}
                            </Link>
                            <div className="text-sm text-gray-500">
                              {business.reviewCount} reviews
                            </div>
                          </div>
                        </div>
                        <div className="text-yellow-500 font-bold">
                          {"★".repeat(Math.round(business.rating))} {business.rating.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No rated businesses yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recently Added Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recentBusinesses && stats.recentBusinesses.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentBusinesses.map((business) => (
                      <div
                        key={business.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <Link
                            href={`/business/${business.id}`}
                            className="font-medium hover:text-blue-600"
                          >
                            {business.name}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {new Date(business.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            business.status === "PUBLISHED"
                              ? "bg-green-100 text-green-700"
                              : business.status === "PENDING_APPROVAL"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {business.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No businesses yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
