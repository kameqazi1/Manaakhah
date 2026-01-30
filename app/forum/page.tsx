"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
  color: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  replyCount: number;
  likeCount: number;
  isPinned: boolean;
  tags: string[];
  lastReplyAt?: string;
  lastReplyBy?: string;
}

const STORAGE_KEY = "manakhaah-forum-posts";

const forumCategories: ForumCategory[] = [
  { id: "general", name: "General Discussion", description: "Open discussions about anything related to the Muslim community", icon: "💬", postCount: 0, color: "bg-blue-100" },
  { id: "business-tips", name: "Business Tips", description: "Share and learn business strategies and advice", icon: "💼", postCount: 0, color: "bg-green-100" },
  { id: "recommendations", name: "Recommendations", description: "Ask for and share business recommendations", icon: "⭐", postCount: 0, color: "bg-yellow-100" },
  { id: "events", name: "Events & Meetups", description: "Community events, gatherings, and meetups", icon: "📅", postCount: 0, color: "bg-purple-100" },
  { id: "halal-living", name: "Halal Living", description: "Discussions about halal lifestyle, food, and products", icon: "🌙", postCount: 0, color: "bg-emerald-100" },
  { id: "support", name: "Help & Support", description: "Get help with the platform or ask questions", icon: "🤝", postCount: 0, color: "bg-orange-100" },
];

export default function ForumPage() {
  const { data: session } = useMockSession();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    categoryId: "",
    tags: "",
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPosts(JSON.parse(stored));
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Error loading forum posts:", error);
      setPosts([]);
    }
  };

  const savePosts = (newPosts: ForumPost[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosts));
      setPosts(newPosts);
    } catch (error) {
      console.error("Error saving forum posts:", error);
    }
  };

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.categoryId) {
      alert("Please fill in all required fields");
      return;
    }

    const post: ForumPost = {
      id: Date.now().toString(),
      title: newPost.title,
      content: newPost.content,
      categoryId: newPost.categoryId,
      authorId: session?.user?.id || "anonymous",
      authorName: session?.user?.name || "Anonymous",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0,
      replyCount: 0,
      likeCount: 0,
      isPinned: false,
      tags: newPost.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    savePosts([post, ...posts]);
    setNewPost({ title: "", content: "", categoryId: "", tags: "" });
    setShowNewPostForm(false);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = !selectedCategory || post.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const pinnedPosts = filteredPosts.filter((p) => p.isPinned);
  const regularPosts = filteredPosts.filter((p) => !p.isPinned);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryInfo = (categoryId: string) => {
    return forumCategories.find((c) => c.id === categoryId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Community Forum</h1>
            <p className="text-gray-600 mt-1">
              Connect, discuss, and share with the Muslim community
            </p>
          </div>
          {session && (
            <Button onClick={() => setShowNewPostForm(!showNewPostForm)}>
              {showNewPostForm ? "Cancel" : "+ New Post"}
            </Button>
          )}
        </div>

        {/* New Post Form */}
        {showNewPostForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="What's on your mind?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={newPost.categoryId}
                  onChange={(e) => setNewPost({ ...newPost, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {forumCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share your thoughts, questions, or ideas..."
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <Input
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  placeholder="e.g., halal, business, tips"
                />
              </div>

              <Button onClick={handleCreatePost}>Post</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    !selectedCategory ? "bg-primary text-white" : "hover:bg-gray-100"
                  }`}
                >
                  All Categories
                </button>
                {forumCategories.map((category) => {
                  const postCount = posts.filter((p) => p.categoryId === category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? "bg-primary text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {category.icon} {category.name}
                        </span>
                        <span className="text-xs opacity-70">{postCount}</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Community Guidelines</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Be respectful and kind</li>
                  <li>• No spam or self-promotion</li>
                  <li>• Stay on topic</li>
                  <li>• Help others when you can</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Posts */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="w-full"
              />
            </div>

            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  📌 Pinned Posts
                </h3>
                <div className="space-y-3">
                  {pinnedPosts.map((post) => (
                    <PostCard key={post.id} post={post} getCategoryInfo={getCategoryInfo} formatTimeAgo={formatTimeAgo} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            {regularPosts.length > 0 ? (
              <div className="space-y-3">
                {regularPosts.map((post) => (
                  <PostCard key={post.id} post={post} getCategoryInfo={getCategoryInfo} formatTimeAgo={formatTimeAgo} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold mb-2">No Posts Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Be the first to start a discussion!"}
                  </p>
                  {session && !showNewPostForm && (
                    <Button onClick={() => setShowNewPostForm(true)}>Create First Post</Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  getCategoryInfo,
  formatTimeAgo,
}: {
  post: ForumPost;
  getCategoryInfo: (id: string) => ForumCategory | undefined;
  formatTimeAgo: (date: string) => string;
}) {
  const category = getCategoryInfo(post.categoryId);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium flex-shrink-0">
            {post.authorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {post.isPinned && <span className="text-sm">📌</span>}
              <Link
                href={`/forum/${post.id}`}
                className="font-semibold hover:text-primary line-clamp-1"
              >
                {post.title}
              </Link>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>

            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span>{post.authorName}</span>
              <span>•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
              {category && (
                <>
                  <span>•</span>
                  <Badge variant="secondary" className={`text-xs ${category.color}`}>
                    {category.icon} {category.name}
                  </Badge>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                👁️ {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                💬 {post.replyCount}
              </span>
              <span className="flex items-center gap-1">
                ❤️ {post.likeCount}
              </span>
            </div>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
