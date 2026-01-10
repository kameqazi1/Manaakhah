"use client";

import { useEffect, useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ScrapedBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  website?: string;
  description?: string;
  sourceUrl: string;
  scrapedAt: Date;
  claimStatus: string;
  reviewedAt?: Date;
  metadata: any;
}

export default function ReviewQueuePage() {
  const { data: session } = useMockSession();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<ScrapedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_REVIEW");

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchScrapedBusinesses();
  }, [session, filter]);

  const fetchScrapedBusinesses = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("claimStatus", filter);
      }

      const response = await fetch(`/api/admin/scraped-businesses?${params}`, {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses);
      }
    } catch (error) {
      console.error("Error fetching scraped businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (businessId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/admin/scraped-businesses/${businessId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify({
          claimStatus: action === "approve" ? "APPROVED" : "REJECTED",
        }),
      });

      if (response.ok) {
        fetchScrapedBusinesses();
      }
    } catch (error) {
      console.error(`Error ${action}ing business:`, error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
      PENDING_REVIEW: { variant: "outline", color: "text-orange-600" },
      APPROVED: { variant: "default", color: "text-green-600" },
      REJECTED: { variant: "destructive", color: "text-red-600" },
      CLAIMED: { variant: "secondary", color: "text-blue-600" },
    };

    const config = variants[status] || variants.PENDING_REVIEW;

    return (
      <Badge variant={config.variant} className={config.color}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Scraped Business Review Queue</h1>
            <Link href="/admin">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
          <p className="text-gray-600">
            Review and approve businesses scraped from the web
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={filter === "PENDING_REVIEW" ? "default" : "outline"}
                onClick={() => setFilter("PENDING_REVIEW")}
              >
                Pending Review
              </Button>
              <Button
                variant={filter === "APPROVED" ? "default" : "outline"}
                onClick={() => setFilter("APPROVED")}
              >
                Approved
              </Button>
              <Button
                variant={filter === "REJECTED" ? "default" : "outline"}
                onClick={() => setFilter("REJECTED")}
              >
                Rejected
              </Button>
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Business List */}
        {loading ? (
          <div className="text-center py-12">Loading businesses...</div>
        ) : businesses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No businesses found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {businesses.map((business) => (
              <Card key={business.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Business Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">
                            {business.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <span className="font-medium">
                              {business.category.replace(/_/g, " ")}
                            </span>
                            {getStatusBadge(business.claimStatus)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-600 min-w-[80px]">📍 Address:</span>
                          <span>
                            {business.address}, {business.city}, {business.state} {business.zipCode}
                          </span>
                        </div>

                        {business.phone && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 min-w-[80px]">📞 Phone:</span>
                            <span>{business.phone}</span>
                          </div>
                        )}

                        {business.website && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 min-w-[80px]">🌐 Website:</span>
                            <a
                              href={business.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {business.website}
                            </a>
                          </div>
                        )}

                        {business.description && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 min-w-[80px]">📝 Description:</span>
                            <span className="line-clamp-2">{business.description}</span>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          <span className="text-gray-600 min-w-[80px]">🔗 Source:</span>
                          <a
                            href={business.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {business.sourceUrl}
                          </a>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="text-gray-600 min-w-[80px]">📅 Scraped:</span>
                          <span>
                            {new Date(business.scrapedAt).toLocaleString()}
                          </span>
                        </div>

                        {business.reviewedAt && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 min-w-[80px]">✅ Reviewed:</span>
                            <span>
                              {new Date(business.reviewedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {business.claimStatus === "PENDING_REVIEW" && (
                      <div className="flex flex-col gap-2 md:min-w-[150px]">
                        <Button
                          onClick={() => handleAction(business.id, "approve")}
                          className="w-full"
                        >
                          ✓ Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleAction(business.id, "reject")}
                          className="w-full"
                        >
                          ✗ Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
