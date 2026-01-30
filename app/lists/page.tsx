"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface BusinessList {
  id: string;
  name: string;
  description: string;
  authorId: string;
  authorName: string;
  isPublic: boolean;
  businessIds: string[];
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  viewCount: number;
  tags: string[];
}

interface ListBusiness {
  id: string;
  name: string;
  category: string;
  city: string;
  averageRating: number;
}

const STORAGE_KEY = "manakhaah-user-lists";

export default function ListsPage() {
  const { data: session } = useMockSession();
  const [myLists, setMyLists] = useState<BusinessList[]>([]);
  const [publicLists, setPublicLists] = useState<BusinessList[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "discover">(session ? "my" : "discover");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newList, setNewList] = useState({
    name: "",
    description: "",
    isPublic: false,
    tags: "",
  });

  useEffect(() => {
    loadLists();
  }, [session?.user?.id]);

  const loadLists = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allLists: BusinessList[] = JSON.parse(stored);
        if (session?.user?.id) {
          setMyLists(allLists.filter((l) => l.authorId === session.user.id));
        }
        setPublicLists(allLists.filter((l) => l.isPublic && l.authorId !== session?.user?.id));
      } else {
        setPublicLists([]);
      }
    } catch (error) {
      console.error("Error loading lists:", error);
      setPublicLists([]);
    }
  };

  const saveLists = (lists: BusinessList[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allLists: BusinessList[] = stored ? JSON.parse(stored) : [];

      // Update or add user's lists
      const otherLists = allLists.filter((l) => l.authorId !== session?.user?.id);
      const updatedLists = [...otherLists, ...lists];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));
      setMyLists(lists);

      // Update public lists
      setPublicLists(updatedLists.filter((l) => l.isPublic && l.authorId !== session?.user?.id));
    } catch (error) {
      console.error("Error saving lists:", error);
    }
  };

  const handleCreateList = () => {
    if (!newList.name.trim() || !session?.user) return;

    const list: BusinessList = {
      id: Date.now().toString(),
      name: newList.name,
      description: newList.description,
      authorId: session.user.id,
      authorName: session.user.name || "Anonymous",
      isPublic: newList.isPublic,
      businessIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likeCount: 0,
      viewCount: 0,
      tags: newList.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    saveLists([list, ...myLists]);
    setNewList({ name: "", description: "", isPublic: false, tags: "" });
    setShowCreateForm(false);
  };

  const handleDeleteList = (id: string) => {
    if (!confirm("Are you sure you want to delete this list?")) return;
    saveLists(myLists.filter((l) => l.id !== id));
  };

  const handleToggleVisibility = (id: string) => {
    const updated = myLists.map((l) =>
      l.id === id ? { ...l, isPublic: !l.isPublic, updatedAt: new Date().toISOString() } : l
    );
    saveLists(updated);
  };

  const filteredPublicLists = publicLists.filter((list) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Business Lists</h1>
            <p className="text-gray-600 mt-1">
              Create and discover curated lists of businesses
            </p>
          </div>
          {session && !showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)}>
              + Create List
            </Button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">List Name *</label>
                <Input
                  value={newList.name}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  placeholder="e.g., My Favorite Restaurants"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newList.description}
                  onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  placeholder="What's this list about?"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <Input
                  value={newList.tags}
                  onChange={(e) => setNewList({ ...newList, tags: e.target.value })}
                  placeholder="e.g., halal, restaurants, family"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newList.isPublic}
                  onChange={(e) => setNewList({ ...newList, isPublic: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isPublic" className="text-sm">
                  Make this list public (others can discover and follow it)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateList} disabled={!newList.name.trim()}>
                  Create List
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {session && (
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "my"
                  ? "bg-primary text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              My Lists ({myLists.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab("discover")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "discover"
                ? "bg-primary text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Discover Lists
          </button>
        </div>

        {/* My Lists */}
        {activeTab === "my" && session && (
          <div>
            {myLists.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold mb-2">No Lists Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first list to organize your favorite businesses.
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>Create Your First List</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {myLists.map((list) => (
                  <Card key={list.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Link
                          href={`/lists/${list.id}`}
                          className="font-semibold text-lg hover:text-primary"
                        >
                          {list.name}
                        </Link>
                        <Badge variant={list.isPublic ? "default" : "secondary"}>
                          {list.isPublic ? "🌐 Public" : "🔒 Private"}
                        </Badge>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {list.description || "No description"}
                      </p>

                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                        <span>{list.businessIds.length} businesses</span>
                        <span>•</span>
                        <span>Updated {formatTimeAgo(list.updatedAt)}</span>
                      </div>

                      {list.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {list.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link href={`/lists/${list.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleVisibility(list.id)}
                        >
                          {list.isPublic ? "Make Private" : "Make Public"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteList(list.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discover Lists */}
        {activeTab === "discover" && (
          <div>
            <div className="mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lists..."
              />
            </div>

            {filteredPublicLists.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">No Lists Found</h3>
                  <p className="text-gray-600">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Be the first to create a public list!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredPublicLists.map((list) => (
                  <Card key={list.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <Link
                        href={`/lists/${list.id}`}
                        className="font-semibold text-lg hover:text-primary block mb-1"
                      >
                        {list.name}
                      </Link>

                      <p className="text-sm text-gray-500 mb-2">
                        by {list.authorName}
                      </p>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {list.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>{list.businessIds.length} businesses</span>
                        <span>❤️ {list.likeCount}</span>
                        <span>👁️ {list.viewCount}</span>
                      </div>

                      {list.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {list.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Link href={`/lists/${list.id}`}>
                        <Button size="sm" className="w-full">View List</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
