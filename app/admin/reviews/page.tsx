"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  text: string;
  status: string;
  reportCount: number;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  business?: {
    id: string;
    name: string;
  };
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "PENDING", label: "Pending" },
  { value: "FLAGGED", label: "Flagged" },
  { value: "REMOVED", label: "Removed" },
];

export default function AdminReviewsPage() {
  const { data: session } = useMockSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/admin/reviews?${params}`, {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchReviews();
    }
  }, [session, page, statusFilter]);

  const handleUpdateStatus = async (reviewId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchReviews();
        setSelectedReview(null);
      }
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        fetchReviews();
        setSelectedReview(null);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PUBLISHED: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      FLAGGED: "bg-red-100 text-red-700",
      REMOVED: "bg-gray-100 text-gray-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Review Moderation</h1>
          <p className="text-gray-600">Manage and moderate user reviews</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={statusFilter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(opt.value);
              setPage(1);
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="p-8 text-center">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No reviews found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id} className={review.status === "FLAGGED" ? "border-red-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-yellow-500 text-lg">{renderStars(review.rating)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(review.status)}`}>
                        {review.status}
                      </span>
                      {review.reportCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {review.reportCount} reports
                        </span>
                      )}
                    </div>

                    {review.title && (
                      <h3 className="font-semibold mb-1">{review.title}</h3>
                    )}

                    <p className="text-gray-700 mb-3">
                      {review.content || review.text}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        By: <strong>{review.user?.name || "Unknown"}</strong>
                      </span>
                      <span>|</span>
                      <span>
                        For:{" "}
                        <Link href={`/business/${review.business?.id}`} className="text-blue-600 hover:underline">
                          {review.business?.name || "Unknown"}
                        </Link>
                      </span>
                      <span>|</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {review.status === "FLAGGED" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateStatus(review.id, "PUBLISHED")}
                      >
                        Approve
                      </Button>
                    )}
                    {review.status === "PUBLISHED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 hover:text-yellow-700"
                        onClick={() => handleUpdateStatus(review.id, "FLAGGED")}
                      >
                        Flag
                      </Button>
                    )}
                    {review.status !== "REMOVED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600 hover:text-gray-700"
                        onClick={() => handleUpdateStatus(review.id, "REMOVED")}
                      >
                        Remove
                      </Button>
                    )}
                    {review.status === "REMOVED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleUpdateStatus(review.id, "PUBLISHED")}
                      >
                        Restore
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(review.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
