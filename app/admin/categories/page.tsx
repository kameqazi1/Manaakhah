"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  businessCount: number;
  isActive: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Restaurants", slug: "restaurants", description: "Halal restaurants and food establishments", businessCount: 45, isActive: true },
  { id: "2", name: "Grocery Stores", slug: "grocery-stores", description: "Halal grocery and supermarkets", businessCount: 28, isActive: true },
  { id: "3", name: "Services", slug: "services", description: "Professional services", businessCount: 32, isActive: true },
  { id: "4", name: "Retail", slug: "retail", description: "Retail shops and stores", businessCount: 18, isActive: true },
  { id: "5", name: "Healthcare", slug: "healthcare", description: "Medical and healthcare services", businessCount: 12, isActive: true },
  { id: "6", name: "Education", slug: "education", description: "Educational institutions and tutoring", businessCount: 8, isActive: true },
  { id: "7", name: "Beauty & Wellness", slug: "beauty-wellness", description: "Salons, spas, and wellness centers", businessCount: 22, isActive: true },
  { id: "8", name: "Automotive", slug: "automotive", description: "Auto repair and services", businessCount: 15, isActive: true },
];

export default function CategoriesPage() {
  const { data: session } = useMockSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Load categories from localStorage or use defaults
    const savedCategories = localStorage.getItem("admin-categories");
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch {
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
    setLoading(false);
  }, []);

  const saveCategories = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    localStorage.setItem("admin-categories", JSON.stringify(updatedCategories));
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;

    const slug = newCategory.name.toLowerCase().replace(/\s+/g, "-");
    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      slug,
      description: newCategory.description,
      businessCount: 0,
      isActive: true,
    };

    saveCategories([...categories, category]);
    setNewCategory({ name: "", description: "" });
    setShowAddForm(false);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    const updatedCategories = categories.map((cat) =>
      cat.id === editingCategory.id ? editingCategory : cat
    );
    saveCategories(updatedCategories);
    setEditingCategory(null);
  };

  const handleToggleActive = (categoryId: string) => {
    const updatedCategories = categories.map((cat) =>
      cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
    );
    saveCategories(updatedCategories);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const updatedCategories = categories.filter((cat) => cat.id !== categoryId);
    saveCategories(updatedCategories);
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
          <h1 className="text-3xl font-bold">Categories & Tags</h1>
          <p className="text-gray-600">Manage business categories</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddForm(true)}>+ Add Category</Button>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Home Services"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Brief description of the category"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddCategory}>Add Category</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category Name</label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={editingCategory.description}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleUpdateCategory}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditingCategory(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="p-8 text-center">Loading categories...</div>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className={!category.isActive ? "opacity-60" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          category.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Slug: {category.slug}</span>
                      <span>|</span>
                      <span>{category.businessCount} businesses</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCategory(category)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(category.id)}
                    >
                      {category.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteCategory(category.id)}
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
    </div>
  );
}
