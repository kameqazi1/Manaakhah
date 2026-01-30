"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validateBusinessEntry, ValidationResult } from "@/lib/scraper/validation";

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
  email?: string;
  description?: string;
  sourceUrl: string;
  scrapedAt: Date;
  claimStatus: string;
  reviewedAt?: Date;
  metadata: any;
  latitude?: number;
  longitude?: number;
}

interface ActionError {
  businessId: string;
  message: string;
  type: "duplicate" | "transaction" | "general";
  details?: any;
}

interface ActionSuccess {
  businessId: string;
  message: string;
  missingCoordinates?: boolean;
}

// Extended type with pre-computed validation
interface BusinessWithValidation extends ScrapedBusiness {
  validation: ValidationResult;
}

export default function ReviewQueuePage() {
  const { data: session } = useMockSession();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<ScrapedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_REVIEW");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<ActionError[]>([]);
  const [actionSuccesses, setActionSuccesses] = useState<ActionSuccess[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Memoize validation results - computed once when businesses change, not on every render
  const businessesWithValidation = useMemo<BusinessWithValidation[]>(() => {
    return businesses.map((business) => ({
      ...business,
      validation: validateBusinessEntry(business as any),
    }));
  }, [businesses]);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (actionErrors.length > 0 || actionSuccesses.length > 0) {
      const timer = setTimeout(() => {
        setActionErrors([]);
        setActionSuccesses([]);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [actionErrors, actionSuccesses]);

  const fetchScrapedBusinesses = useCallback(async () => {
    try {
      setFetchError(null);
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("claimStatus", filter);
      }

      // Auth is handled server-side via session cookies - no spoofable headers needed
      const response = await fetch(`/api/admin/scraped-businesses?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setFetchError(errorData.error || `Failed to load businesses (${response.status})`);
      }
    } catch (error) {
      console.error("Error fetching scraped businesses:", error);
      setFetchError("Network error - unable to load businesses");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchScrapedBusinesses();
  }, [session, filter, fetchScrapedBusinesses, router]);

  const handleAction = async (businessId: string, action: "approve" | "reject") => {
    // Add to processing set
    setProcessingIds((prev) => new Set(prev).add(businessId));

    // Clear previous errors for this business
    setActionErrors((prev) => prev.filter((e) => e.businessId !== businessId));
    setActionSuccesses((prev) => prev.filter((s) => s.businessId !== businessId));

    try {
      // Auth is handled server-side via session cookies - no spoofable headers needed
      const response = await fetch(`/api/admin/scraped-businesses/${businessId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          claimStatus: action === "approve" ? "APPROVED" : "REJECTED",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        const business = businesses.find((b) => b.id === businessId);
        setActionSuccesses((prev) => [
          ...prev,
          {
            businessId,
            message: `"${business?.name}" ${action === "approve" ? "approved" : "rejected"} successfully`,
            missingCoordinates: data.missingCoordinates,
          },
        ]);
        fetchScrapedBusinesses();
      } else if (response.status === 409) {
        // Duplicate detected
        setActionErrors((prev) => [
          ...prev,
          {
            businessId,
            message: data.message || "Duplicate business detected",
            type: "duplicate",
            details: data.duplicate,
          },
        ]);
      } else if (response.status === 500 && data.failedStep) {
        // Transaction failure
        setActionErrors((prev) => [
          ...prev,
          {
            businessId,
            message: `${data.error}: ${data.failedStep}`,
            type: "transaction",
            details: data.details,
          },
        ]);
      } else {
        // General error
        setActionErrors((prev) => [
          ...prev,
          {
            businessId,
            message: data.error || `Failed to ${action} business`,
            type: "general",
          },
        ]);
      }
    } catch (error) {
      console.error(`Error ${action}ing business:`, error);
      setActionErrors((prev) => [
        ...prev,
        {
          businessId,
          message: `Network error while trying to ${action}`,
          type: "general",
        },
      ]);
    } finally {
      // Remove from processing set
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(businessId);
        return next;
      });
    }
  };

  const dismissError = (businessId: string) => {
    setActionErrors((prev) => prev.filter((e) => e.businessId !== businessId));
  };

  const dismissSuccess = (businessId: string) => {
    setActionSuccesses((prev) => prev.filter((s) => s.businessId !== businessId));
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

        {/* Global Error/Success Notifications */}
        {(actionErrors.length > 0 || actionSuccesses.length > 0) && (
          <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
            {actionSuccesses.map((success) => (
              <div
                key={success.businessId}
                className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <div>
                      <p className="text-green-800 font-medium">{success.message}</p>
                      {success.missingCoordinates && (
                        <p className="text-yellow-700 text-sm mt-1">
                          ⚠️ Missing coordinates - map display may be affected
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissSuccess(success.businessId)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {actionErrors.map((error) => (
              <div
                key={error.businessId}
                className={`border rounded-lg p-4 shadow-lg ${
                  error.type === "duplicate"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className={error.type === "duplicate" ? "text-yellow-600" : "text-red-600"}>
                      {error.type === "duplicate" ? "⚠️" : "✗"}
                    </span>
                    <div>
                      <p className={`font-medium ${error.type === "duplicate" ? "text-yellow-800" : "text-red-800"}`}>
                        {error.message}
                      </p>
                      {error.type === "duplicate" && error.details && (
                        <p className="text-yellow-700 text-sm mt-1">
                          Existing: {error.details.name} at {error.details.address}
                        </p>
                      )}
                      {error.type === "transaction" && error.details && (
                        <p className="text-red-700 text-sm mt-1 font-mono">
                          {error.details.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissError(error.businessId)}
                    className={error.type === "duplicate" ? "text-yellow-600 hover:text-yellow-800" : "text-red-600 hover:text-red-800"}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fetch Error Banner */}
        {fetchError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-800">
                  <span>✗</span>
                  <span>{fetchError}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchScrapedBusinesses()}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
            {businessesWithValidation.map((business) => (
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
                          {/* Validation Score and Flags - uses memoized validation */}
                          <div className="mt-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Confidence Score Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  business.validation.confidence >= 70
                                    ? "bg-green-100 text-green-800"
                                    : business.validation.confidence >= 50
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {business.validation.confidence}% confidence
                              </span>
                              {/* Low Quality Badge */}
                              {!business.validation.isLikelyBusiness && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Low Quality
                                </span>
                              )}
                            </div>
                            {/* Validation Flags */}
                            {business.validation.flags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {business.validation.flags.map((flag, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800"
                                  >
                                    {flag.replace(/_/g, " ")}
                                  </span>
                                ))}
                              </div>
                            )}
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
                        {/* Missing coordinates warning */}
                        {!business.latitude && !business.longitude && (
                          <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded mb-1">
                            ⚠️ No coordinates - will need geocoding
                          </div>
                        )}
                        <Button
                          onClick={() => handleAction(business.id, "approve")}
                          className="w-full"
                          disabled={processingIds.has(business.id)}
                        >
                          {processingIds.has(business.id) ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin">⟳</span> Processing...
                            </span>
                          ) : (
                            "✓ Approve"
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleAction(business.id, "reject")}
                          className="w-full"
                          disabled={processingIds.has(business.id)}
                        >
                          {processingIds.has(business.id) ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin">⟳</span> Processing...
                            </span>
                          ) : (
                            "✗ Reject"
                          )}
                        </Button>
                        {/* Inline error for this business */}
                        {actionErrors.find((e) => e.businessId === business.id) && (
                          <div className="text-xs text-red-700 bg-red-50 p-2 rounded mt-1">
                            {actionErrors.find((e) => e.businessId === business.id)?.message}
                          </div>
                        )}
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
