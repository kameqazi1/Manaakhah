"use client";

import { useEffect, useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalBusinesses: number;
  pendingBusinesses: number;
  totalUsers: number;
  totalReviews: number;
  flaggedReviews: number;
  totalBookings: number;
  totalMessages: number;
  communityPosts: number;
  flaggedPosts: number;
}

export default function AdminDashboard() {
  const { data: session } = useMockSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    pendingBusinesses: 0,
    totalUsers: 0,
    totalReviews: 0,
    flaggedReviews: 0,
    totalBookings: 0,
    totalMessages: 0,
    communityPosts: 0,
    flaggedPosts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchStats();
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
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You need admin privileges to access this page.
            </p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage businesses, moderate content, and view analytics
          </p>
        </div>

        {/* Quick Stats */}
        {loading ? (
          <div className="text-center py-12">Loading statistics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Businesses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalBusinesses}</div>
                  {stats.pendingBusinesses > 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      {stats.pendingBusinesses} pending review
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalReviews}</div>
                  {stats.flaggedReviews > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      {stats.flaggedReviews} flagged
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Community Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.communityPosts}</div>
                  {stats.flaggedPosts > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      {stats.flaggedPosts} flagged
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Admin Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Business Management */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🏪</span>
                    Business Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/businesses/review-queue">
                    <Button variant="outline" className="w-full justify-start">
                      📋 Review Scraped Businesses
                      {stats.pendingBusinesses > 0 && (
                        <span className="ml-auto bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs">
                          {stats.pendingBusinesses}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link href="/admin/businesses">
                    <Button variant="outline" className="w-full justify-start">
                      🏢 All Businesses
                    </Button>
                  </Link>
                  <Link href="/admin/businesses/scraper">
                    <Button variant="outline" className="w-full justify-start">
                      🔍 Web Scraper
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Content Moderation */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🛡️</span>
                    Content Moderation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/reviews">
                    <Button variant="outline" className="w-full justify-start">
                      ⭐ All Reviews
                      {stats.flaggedReviews > 0 && (
                        <span className="ml-auto bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                          {stats.flaggedReviews} flagged
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link href="/admin/posts">
                    <Button variant="outline" className="w-full justify-start">
                      📝 All Posts
                      {stats.flaggedPosts > 0 && (
                        <span className="ml-auto bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                          {stats.flaggedPosts} flagged
                        </span>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* User Management */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/users">
                    <Button variant="outline" className="w-full justify-start">
                      👤 All Users
                    </Button>
                  </Link>
                  <Link href="/admin/users?role=BUSINESS_OWNER">
                    <Button variant="outline" className="w-full justify-start">
                      💼 Business Owners
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Analytics */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/analytics">
                    <Button variant="outline" className="w-full justify-start">
                      📊 Platform Analytics
                    </Button>
                  </Link>
                  <Link href="/admin/analytics/businesses">
                    <Button variant="outline" className="w-full justify-start">
                      🏪 Business Analytics
                    </Button>
                  </Link>
                  <Link href="/admin/analytics/engagement">
                    <Button variant="outline" className="w-full justify-start">
                      💬 User Engagement
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/settings">
                    <Button variant="outline" className="w-full justify-start">
                      🔧 General Settings
                    </Button>
                  </Link>
                  <Link href="/admin/categories">
                    <Button variant="outline" className="w-full justify-start">
                      🏷️ Categories & Tags
                    </Button>
                  </Link>
                  <Link href="/admin/notifications">
                    <Button variant="outline" className="w-full justify-start">
                      🔔 Notification Templates
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">💾</span>
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/export">
                    <Button variant="outline" className="w-full justify-start">
                      📥 Export Data
                    </Button>
                  </Link>
                  <Link href="/admin/import">
                    <Button variant="outline" className="w-full justify-start">
                      📤 Import Data
                    </Button>
                  </Link>
                  <Link href="/admin/backup">
                    <Button variant="outline" className="w-full justify-start">
                      💿 Backup & Restore
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
