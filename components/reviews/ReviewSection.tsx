"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMockSession } from "@/lib/mock-session";
import { WriteReviewModal } from "./WriteReviewModal";

interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  photos: string[];
  isVerified: boolean;
  helpfulCount: number;
  ownerResponse?: string;
  respondedAt?: Date;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verifiedPercentage: number;
}

interface ReviewSectionProps {
  businessId: string;
  businessOwnerId?: string;
}

export function ReviewSection({ businessId, businessOwnerId }: ReviewSectionProps) {
  const { data: session } = useMockSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchReviews();
  }, [businessId, filter, sortBy]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({ businessId, sortBy });
      if (filter !== "all") {
        params.append("rating", filter);
      }

      const response = await fetch(`/api/reviews?${params}`, {
        headers: session?.user?.id
          ? {
              "x-user-id": session.user.id,
              "x-user-role": session.user.role,
            }
          : {},
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    setIsWriteModalOpen(false);
    fetchReviews();
  };

  const handleHelpful = async (reviewId: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
          "x-user-role": session.user.role,
        },
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error("Error marking review as helpful:", error);
    }
  };

  if (loading) {
    return <div>Loading reviews...</div>;
  }

  const isOwner = session?.user?.id === businessOwnerId;
  const canWriteReview = session?.user?.id && !isOwner;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reviews</CardTitle>
          {canWriteReview && (
            <Button onClick={() => setIsWriteModalOpen(true)}>
              Write a Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="mb-6">
            {/* Overall Rating */}
            <div className="flex items-center gap-8 mb-6 pb-6 border-b">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex mb-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < Math.round(stats.averageRating)
                          ? "text-yellow-500 text-xl"
                          : "text-gray-300 text-xl"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  {stats.totalReviews} reviews
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.breakdown[rating as keyof typeof stats.breakdown];
                  const percentage = stats.totalReviews > 0
                    ? Math.round((count / stats.totalReviews) * 100)
                    : 0;

                  return (
                    <button
                      key={rating}
                      onClick={() => setFilter(count > 0 ? String(rating) as any : "all")}
                      className="flex items-center gap-2 w-full hover:bg-gray-50 p-1 rounded"
                    >
                      <span className="text-sm w-12">{rating} star</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm w-12 text-right">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filter:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">All stars</option>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                  <option value="helpful">Most helpful</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {filter === "all"
              ? "No reviews yet. Be the first to review!"
              : "No reviews found with this filter."}
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-6 last:border-0">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {review.user.image ? (
                        <img
                          src={review.user.image}
                          alt={review.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-lg">
                          {review.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{review.user.name}</span>
                        {review.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Verified Customer
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < review.rating
                                  ? "text-yellow-500"
                                  : "text-gray-300"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                {review.title && (
                  <h4 className="font-semibold mb-2">{review.title}</h4>
                )}
                <p className="text-gray-700 mb-3">{review.content}</p>

                {/* Photos */}
                {review.photos.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {review.photos.slice(0, 4).map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt="Review photo"
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                {/* Owner Response */}
                {review.ownerResponse && (
                  <div className="mt-4 ml-8 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold">
                        Response from the owner
                      </span>
                      {review.respondedAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(review.respondedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{review.ownerResponse}</p>
                  </div>
                )}

                {/* Helpful Button */}
                <div className="mt-3 flex items-center gap-4">
                  <button
                    onClick={() => handleHelpful(review.id)}
                    disabled={!session?.user?.id}
                    className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    👍 Helpful ({review.helpfulCount})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {isWriteModalOpen && (
        <WriteReviewModal
          businessId={businessId}
          onClose={() => setIsWriteModalOpen(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </Card>
  );
}
