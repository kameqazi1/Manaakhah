"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/lib/mock-session";

interface WriteReviewModalProps {
  businessId: string;
  bookingId?: string;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export function WriteReviewModal({
  businessId,
  bookingId,
  onClose,
  onReviewSubmitted,
}: WriteReviewModalProps) {
  const { data: session } = useMockSession();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!session?.user?.id) {
      setError("You must be logged in to write a review");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (content.length < 20) {
      setError("Review content must be at least 20 characters");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
          "x-user-role": session.user.role,
        },
        body: JSON.stringify({
          businessId,
          bookingId,
          rating,
          title: title || null,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit review");
        return;
      }

      onReviewSubmitted();
    } catch (err) {
      setError("An error occurred while submitting your review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Write a Review</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Rating *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-4xl focus:outline-none transition-colors"
                  >
                    <span
                      className={
                        star <= (hoveredRating || rating)
                          ? "text-yellow-500"
                          : "text-gray-300"
                      }
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Review Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sum up your experience"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                Your Review * (minimum 20 characters)
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share details of your experience..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[150px]"
                maxLength={2000}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {content.length} / 2000 characters
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
