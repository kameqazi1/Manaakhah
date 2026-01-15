"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
  replyCount: number;
  likeCount: number;
  isPinned: boolean;
  tags: string[];
}

interface Reply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  likeCount: number;
  isAccepted?: boolean;
}

const POSTS_KEY = "manakhaah-forum-posts";
const REPLIES_KEY = "manakhaah-forum-replies";

const categoryInfo: Record<string, { name: string; icon: string }> = {
  general: { name: "General Discussion", icon: "💬" },
  "business-tips": { name: "Business Tips", icon: "💼" },
  recommendations: { name: "Recommendations", icon: "⭐" },
  events: { name: "Events & Meetups", icon: "📅" },
  "halal-living": { name: "Halal Living", icon: "🌙" },
  support: { name: "Help & Support", icon: "🤝" },
};

export default function ForumPostPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useMockSession();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    loadPost();
    loadReplies();
  }, [params.id]);

  const loadPost = () => {
    try {
      const stored = localStorage.getItem(POSTS_KEY);
      if (stored) {
        const posts: ForumPost[] = JSON.parse(stored);
        const foundPost = posts.find((p) => p.id === params.id);
        if (foundPost) {
          // Increment view count
          foundPost.viewCount++;
          localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
          setPost(foundPost);
        }
      }
    } catch (error) {
      console.error("Error loading post:", error);
    }
    setLoading(false);
  };

  const loadReplies = () => {
    try {
      const stored = localStorage.getItem(REPLIES_KEY);
      if (stored) {
        const allReplies: Reply[] = JSON.parse(stored);
        setReplies(allReplies.filter((r) => r.postId === params.id));
      }
    } catch (error) {
      console.error("Error loading replies:", error);
    }
  };

  const handleSubmitReply = () => {
    if (!newReply.trim() || !session?.user) return;

    const reply: Reply = {
      id: Date.now().toString(),
      postId: params.id as string,
      content: newReply,
      authorId: session.user.id,
      authorName: session.user.name || "Anonymous",
      createdAt: new Date().toISOString(),
      likeCount: 0,
    };

    try {
      const stored = localStorage.getItem(REPLIES_KEY);
      const allReplies: Reply[] = stored ? JSON.parse(stored) : [];
      allReplies.push(reply);
      localStorage.setItem(REPLIES_KEY, JSON.stringify(allReplies));

      // Update post reply count
      if (post) {
        const postsStored = localStorage.getItem(POSTS_KEY);
        if (postsStored) {
          const posts: ForumPost[] = JSON.parse(postsStored);
          const postIndex = posts.findIndex((p) => p.id === params.id);
          if (postIndex >= 0) {
            posts[postIndex].replyCount++;
            localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
            setPost({ ...post, replyCount: post.replyCount + 1 });
          }
        }
      }

      setReplies([...replies, reply]);
      setNewReply("");
    } catch (error) {
      console.error("Error saving reply:", error);
    }
  };

  const handleLikePost = () => {
    if (!post || liked) return;

    try {
      const stored = localStorage.getItem(POSTS_KEY);
      if (stored) {
        const posts: ForumPost[] = JSON.parse(stored);
        const postIndex = posts.findIndex((p) => p.id === params.id);
        if (postIndex >= 0) {
          posts[postIndex].likeCount++;
          localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
          setPost({ ...post, likeCount: post.likeCount + 1 });
          setLiked(true);
        }
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleLikeReply = (replyId: string) => {
    try {
      const stored = localStorage.getItem(REPLIES_KEY);
      if (stored) {
        const allReplies: Reply[] = JSON.parse(stored);
        const replyIndex = allReplies.findIndex((r) => r.id === replyId);
        if (replyIndex >= 0) {
          allReplies[replyIndex].likeCount++;
          localStorage.setItem(REPLIES_KEY, JSON.stringify(allReplies));
          setReplies(
            replies.map((r) =>
              r.id === replyId ? { ...r, likeCount: r.likeCount + 1 } : r
            )
          );
        }
      }
    } catch (error) {
      console.error("Error liking reply:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-gray-600 mb-4">
            The post you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/forum">
            <Button>Back to Forum</Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = categoryInfo[post.categoryId];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/forum" className="text-primary hover:underline text-sm">
            &larr; Back to Forum
          </Link>
        </div>

        {/* Post */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-lg flex-shrink-0">
                {post.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {post.isPinned && (
                    <Badge className="bg-yellow-100 text-yellow-700">📌 Pinned</Badge>
                  )}
                  {category && (
                    <Badge variant="secondary">
                      {category.icon} {category.name}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2">{post.title}</h1>

                <div className="text-sm text-gray-500 mb-4">
                  Posted by <strong>{post.authorName}</strong> on {formatDate(post.createdAt)}
                </div>

                <div className="prose max-w-none mb-4">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                </div>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLikePost}
                    disabled={liked}
                    className={liked ? "text-red-500" : ""}
                  >
                    {liked ? "❤️" : "🤍"} {post.likeCount}
                  </Button>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    👁️ {post.viewCount} views
                  </span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    💬 {post.replyCount} replies
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <h2 className="text-xl font-semibold mb-4">
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">No replies yet. Be the first to respond!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-6">
            {replies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium flex-shrink-0">
                      {reply.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{reply.authorName}</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(reply.createdAt)}
                        </span>
                        {reply.isAccepted && (
                          <Badge className="bg-green-100 text-green-700">✓ Accepted</Badge>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap mb-2">{reply.content}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeReply(reply.id)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        ❤️ {reply.likeCount}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Form */}
        {session ? (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Write a Reply</h3>
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-3"
              />
              <Button onClick={handleSubmitReply} disabled={!newReply.trim()}>
                Post Reply
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-gray-600 mb-3">Sign in to reply to this post</p>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
