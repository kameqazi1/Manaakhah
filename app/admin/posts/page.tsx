"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  reportCount?: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "FLAGGED", label: "Flagged" },
  { value: "REMOVED", label: "Removed" },
];

export default function AdminPostsPage() {
  const { data: session } = useMockSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/admin/posts?${params}`, {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchPosts();
    }
  }, [session, page, statusFilter]);

  const handleUpdateStatus = async (postId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PUBLISHED: "bg-green-100 text-green-700",
      DRAFT: "bg-gray-100 text-gray-700",
      FLAGGED: "bg-red-100 text-red-700",
      REMOVED: "bg-gray-100 text-gray-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      DISCUSSION: "bg-blue-100 text-blue-700",
      QUESTION: "bg-purple-100 text-purple-700",
      RECOMMENDATION: "bg-green-100 text-green-700",
      EVENT: "bg-yellow-100 text-yellow-700",
      NEWS: "bg-orange-100 text-orange-700",
    };
    return styles[category] || "bg-gray-100 text-gray-700";
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
          <h1 className="text-3xl font-bold">Post Moderation</h1>
          <p className="text-gray-600">Manage and moderate community posts</p>
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

      {/* Posts Grid */}
      {loading ? (
        <div className="p-8 text-center">Loading posts...</div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No posts found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className={post.status === "FLAGGED" ? "border-red-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge(post.category)}`}>
                        {post.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(post.status)}`}>
                        {post.status}
                      </span>
                      {(post.reportCount || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {post.reportCount} reports
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold mb-2">{post.title}</h3>

                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        By: <strong>{post.author?.name || "Unknown"}</strong>
                      </span>
                      <span>|</span>
                      <span>{post.likeCount} likes</span>
                      <span>|</span>
                      <span>{post.commentCount} comments</span>
                      <span>|</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link href={`/community/${post.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                    {post.status === "FLAGGED" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateStatus(post.id, "PUBLISHED")}
                      >
                        Approve
                      </Button>
                    )}
                    {post.status === "PUBLISHED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 hover:text-yellow-700"
                        onClick={() => handleUpdateStatus(post.id, "FLAGGED")}
                      >
                        Flag
                      </Button>
                    )}
                    {post.status !== "REMOVED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600 hover:text-gray-700"
                        onClick={() => handleUpdateStatus(post.id, "REMOVED")}
                      >
                        Remove
                      </Button>
                    )}
                    {post.status === "REMOVED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleUpdateStatus(post.id, "PUBLISHED")}
                      >
                        Restore
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(post.id)}
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
