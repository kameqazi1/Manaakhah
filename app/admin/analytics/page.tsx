"use client";

import { useEffect, useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

        {loading ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : stats ? (
          <div className="space-y-6">
            {/* User Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.usersByRole?.CONSUMER || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Consumers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.usersByRole?.BUSINESS_OWNER || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Business Owners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.usersByRole?.ADMIN || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Admins</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Business Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.businessesByStatus?.PUBLISHED || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Published</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {stats.businessesByStatus?.DRAFT || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Draft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.businessesByStatus?.PENDING_APPROVAL || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.businessesByStatus?.SUSPENDED || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Suspended</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Review Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.reviewsByStatus?.PUBLISHED || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Published</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.reviewsByStatus?.PENDING || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.reviewsByStatus?.FLAGGED || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Flagged</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {stats.reviewsByStatus?.REMOVED || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Removed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.bookingsByStatus?.PENDING || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.bookingsByStatus?.CONFIRMED || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Confirmed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.bookingsByStatus?.COMPLETED || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {stats.bookingsByStatus?.CANCELLED || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Cancelled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.bookingsByStatus?.REJECTED || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Rejected</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.totalMessages || 0}</div>
                  <p className="text-sm text-gray-600 mt-2">
                    Total messages exchanged on the platform
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.communityPosts || 0}</div>
                  <p className="text-sm text-gray-600 mt-2">
                    Total community posts created
                  </p>
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
