"use client";

import { useEffect, useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  postType: string;
  isPinned: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  tags: string[];
  publishedAt: Date;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  business?: {
    id: string;
    name: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  replies: Comment[];
}

export default function CommunityPage() {
  const { data: session } = useMockSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [filter, sortBy]);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams({ sortBy });
      if (filter !== "all") {
        params.append("postType", filter.toUpperCase());
      }

      const response = await fetch(`/api/community/posts?${params}`, {
        headers: session?.user?.id
          ? {
              "x-user-id": session.user.id,
              "x-user-role": session.user.role,
            }
          : {},
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        headers: {
          "x-user-id": session.user.id,
          "x-user-role": session.user.role,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => ({ ...prev, [postId]: data.comments }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
          "x-user-role": session.user.role,
        },
        body: JSON.stringify({ isLiked: !currentlyLiked }),
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!session?.user?.id || !newComment.trim()) return;

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
          "x-user-role": session.user.role,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments(postId);
        fetchPosts();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const toggleComments = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
  };

  const getPostTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      ANNOUNCEMENT: "📢",
      EVENT: "📅",
      RESOURCE: "📚",
      QUESTION: "❓",
      DISCUSSION: "💬",
      PROMOTION: "🎉",
    };
    return icons[type] || "📝";
  };

  const getPostTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      ANNOUNCEMENT: "bg-blue-100 text-blue-800",
      EVENT: "bg-green-100 text-green-800",
      RESOURCE: "bg-purple-100 text-purple-800",
      QUESTION: "bg-yellow-100 text-yellow-800",
      DISCUSSION: "bg-gray-100 text-gray-800",
      PROMOTION: "bg-pink-100 text-pink-800",
    };
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {getPostTypeIcon(type)} {type}
      </Badge>
    );
  };

  const renderComments = (commentList: Comment[], level: number = 0) => {
    if (level >= 3) return null; // Max 3 levels

    return (
      <div className={level > 0 ? "ml-8 mt-2" : ""}>
        {commentList.map((comment) => (
          <div key={comment.id} className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                {comment.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                <button
                  onClick={() => handleLike(comment.id, false)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  👍 {comment.likeCount}
                </button>
              </div>
            </div>
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {renderComments(comment.replies, level + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Community</h1>
          <p className="text-gray-600">
            Connect with your local Muslim community
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Type:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Posts</option>
                  <option value="announcement">Announcements</option>
                  <option value="event">Events</option>
                  <option value="resource">Resources</option>
                  <option value="question">Questions</option>
                  <option value="discussion">Discussions</option>
                  <option value="promotion">Promotions</option>
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
                  <option value="popular">Most Popular</option>
                  <option value="discussed">Most Discussed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No posts found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className={post.isPinned ? "border-2 border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.isPinned && (
                          <Badge variant="default">📌 Pinned</Badge>
                        )}
                        {getPostTypeBadge(post.postType)}
                      </div>

                      <CardTitle className="mb-2">{post.title}</CardTitle>

                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                            {post.author.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{post.author.name}</span>
                        </div>

                        {post.business && (
                          <>
                            <span>•</span>
                            <Link
                              href={`/business/${post.business.id}`}
                              className="text-primary hover:underline"
                            >
                              {post.business.name}
                            </Link>
                          </>
                        )}

                        <span>•</span>
                        <span>
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Engagement Buttons */}
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <button
                      onClick={() => handleLike(post.id, false)}
                      disabled={!session?.user?.id}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      👍 {post.likeCount}
                    </button>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      💬 {post.commentCount}
                    </button>

                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      👁️ {post.viewCount}
                    </span>
                  </div>

                  {/* Comments Section */}
                  {expandedPost === post.id && (
                    <div className="mt-4 pt-4 border-t">
                      {session?.user?.id && (
                        <div className="mb-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Write a comment..."
                              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              maxLength={1000}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleComment(post.id)}
                              disabled={!newComment.trim()}
                            >
                              Post
                            </Button>
                          </div>
                        </div>
                      )}

                      {comments[post.id] && comments[post.id].length > 0 ? (
                        renderComments(comments[post.id])
                      ) : (
                        <p className="text-sm text-gray-600 text-center py-4">
                          No comments yet. Be the first to comment!
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
