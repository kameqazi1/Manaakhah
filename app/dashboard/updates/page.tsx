"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface Update {
  id: string;
  businessId: string;
  title: string;
  content: string;
  type: "announcement" | "update" | "promotion" | "news";
  isPinned: boolean;
  publishedAt: string;
  expiresAt?: string;
  viewCount: number;
}

const UPDATE_TYPES = [
  { value: "announcement", label: "Announcement", icon: "📢" },
  { value: "update", label: "Business Update", icon: "🔄" },
  { value: "promotion", label: "Promotion", icon: "🎉" },
  { value: "news", label: "News", icon: "📰" },
];

export default function BusinessUpdatesPage() {
  const { data: session } = useMockSession();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "announcement" as Update["type"],
    isPinned: false,
    expiresAt: "",
  });

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = () => {
    const savedUpdates = localStorage.getItem("businessUpdates");
    if (savedUpdates) {
      try {
        const allUpdates = JSON.parse(savedUpdates);
        const userUpdates = allUpdates.filter((u: Update) => u.businessId === session?.user?.id);
        setUpdates(userUpdates.sort((a: Update, b: Update) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        }));
      } catch {
        setUpdates([]);
      }
    }
    setLoading(false);
  };

  const saveUpdates = (updatedList: Update[]) => {
    const savedUpdates = localStorage.getItem("businessUpdates");
    let allUpdates = savedUpdates ? JSON.parse(savedUpdates) : [];
    allUpdates = allUpdates.filter((u: Update) => u.businessId !== session?.user?.id);
    allUpdates = [...allUpdates, ...updatedList];
    localStorage.setItem("businessUpdates", JSON.stringify(allUpdates));
    setUpdates(updatedList.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newUpdate: Update = {
      id: editingUpdate?.id || Date.now().toString(),
      businessId: session?.user?.id || "",
      title: formData.title,
      content: formData.content,
      type: formData.type,
      isPinned: formData.isPinned,
      publishedAt: editingUpdate?.publishedAt || new Date().toISOString(),
      expiresAt: formData.expiresAt || undefined,
      viewCount: editingUpdate?.viewCount || 0,
    };

    let updatedList;
    if (editingUpdate) {
      updatedList = updates.map((u) => (u.id === editingUpdate.id ? newUpdate : u));
    } else {
      updatedList = [newUpdate, ...updates];
    }

    saveUpdates(updatedList);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "announcement",
      isPinned: false,
      expiresAt: "",
    });
    setShowCreateModal(false);
    setEditingUpdate(null);
  };

  const handleEdit = (update: Update) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      content: update.content,
      type: update.type,
      isPinned: update.isPinned,
      expiresAt: update.expiresAt || "",
    });
    setShowCreateModal(true);
  };

  const handleTogglePin = (updateId: string) => {
    const updatedList = updates.map((u) =>
      u.id === updateId ? { ...u, isPinned: !u.isPinned } : u
    );
    saveUpdates(updatedList);
  };

  const handleDelete = (updateId: string) => {
    if (!confirm("Are you sure you want to delete this update?")) return;
    const updatedList = updates.filter((u) => u.id !== updateId);
    saveUpdates(updatedList);
  };

  const getTypeInfo = (type: string) => {
    return UPDATE_TYPES.find((t) => t.value === type);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Please log in to manage updates.</p>
            <Link href="/auth/signin">
              <Button className="mt-4">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Business Updates</h1>
          <p className="text-gray-600">Share news and announcements with your customers</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Button onClick={() => setShowCreateModal(true)}>
            + Post Update
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{updates.length}</div>
            <div className="text-sm text-gray-600">Total Updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {updates.filter((u) => !isExpired(u.expiresAt)).length}
            </div>
            <div className="text-sm text-gray-600">Active Updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {updates.filter((u) => u.isPinned).length}
            </div>
            <div className="text-sm text-gray-600">Pinned Updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {updates.reduce((acc, u) => acc + u.viewCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Views</div>
          </CardContent>
        </Card>
      </div>

      {/* Updates List */}
      {loading ? (
        <div className="text-center py-8">Loading updates...</div>
      ) : updates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <span className="text-4xl block mb-4">📢</span>
            <h3 className="font-semibold text-lg mb-2">No updates yet</h3>
            <p className="text-gray-600 mb-4">Share your first update with your customers!</p>
            <Button onClick={() => setShowCreateModal(true)}>Post Your First Update</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => {
            const typeInfo = getTypeInfo(update.type);
            const expired = isExpired(update.expiresAt);

            return (
              <Card key={update.id} className={`${update.isPinned ? "border-blue-300 bg-blue-50/50" : ""} ${expired ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{typeInfo?.icon}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          update.type === "announcement" ? "bg-blue-100 text-blue-700" :
                          update.type === "promotion" ? "bg-green-100 text-green-700" :
                          update.type === "news" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {typeInfo?.label}
                        </span>
                        {update.isPinned && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            📌 Pinned
                          </span>
                        )}
                        {expired && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Expired
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg mb-1">{update.title}</h3>
                      <p className="text-gray-600 mb-3 whitespace-pre-wrap">{update.content}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Posted: {new Date(update.publishedAt).toLocaleDateString()}
                        </span>
                        {update.expiresAt && (
                          <span>
                            Expires: {new Date(update.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                        <span>{update.viewCount} views</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(update)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePin(update.id)}
                        className={update.isPinned ? "text-blue-600" : ""}
                      >
                        {update.isPinned ? "Unpin" : "Pin"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(update.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingUpdate ? "Edit Update" : "Post New Update"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Update Type</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Update["type"] })}
                  >
                    {UPDATE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    required
                    placeholder="e.g., New Hours Starting Monday"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <Textarea
                    required
                    placeholder="Share your update with customers..."
                    rows={5}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Expires On (Optional)</label>
                  <Input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty if the update doesn't expire
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPinned" className="text-sm">
                    Pin this update (appears at top)
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingUpdate ? "Save Changes" : "Post Update"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
