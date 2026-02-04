"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { BarChart3, Building2, TrendingUp, DollarSign, Plus, Trash2, Calendar } from "lucide-react";

interface SpendingEntry {
  id: string;
  businessId: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  business: {
    id: string;
    name: string;
    slug: string;
    category: string;
    coverImage: string | null;
  };
}

interface SpendingSummary {
  totalSpent: number;
  totalEntries: number;
  byCategory: { category: string; total: number; count: number }[];
  byBusiness: { business: any; total: number; count: number }[];
  byMonth: { month: string; total: number; count: number }[];
}

export default function InsightsPage() {
  const { data: session } = useMockSession();
  const [entries, setEntries] = useState<SpendingEntry[]>([]);
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);

  // Add form state
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (session) {
      loadSpendingData();
      loadBusinesses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadSpendingData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/spending");
      if (!response.ok) throw new Error("Failed to fetch spending data");

      const data = await response.json();
      setEntries(data.entries || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error("Error loading spending data:", error);
      setEntries([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      const response = await fetch("/api/businesses?status=PUBLISHED&limit=100");
      if (!response.ok) throw new Error("Failed to fetch businesses");

      const data = await response.json();
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error("Error loading businesses:", error);
      setBusinesses([]);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/spending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          amount: parseFloat(amount),
          description,
          date,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add entry");
      }

      // Reset form
      setSelectedBusinessId("");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split('T')[0]);
      setShowAddForm(false);

      // Reload data
      await loadSpendingData();
      alert("Spending entry added successfully!");
    } catch (error) {
      console.error("Error adding entry:", error);
      alert(error instanceof Error ? error.message : "Failed to add spending entry");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await fetch(`/api/spending/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      await loadSpendingData();
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete spending entry");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">
              Please sign in to view your spending insights.
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading spending insights...</p>
      </div>
    );
  }

  const hasData = entries.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Spending Insights</h1>
            <p className="text-gray-600 mt-1">
              Track your spending with Muslim-owned businesses
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Spending
          </Button>
        </div>

        {/* Add Spending Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Spending Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business</label>
                  <select
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a business</option>
                    {businesses.map((biz) => (
                      <option key={biz.id} value={biz.id}>
                        {biz.name} - {biz.category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you purchase?"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Entry</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!hasData ? (
          /* Empty State */
          <Card className="text-center p-12 bg-gradient-to-br from-green-50 to-emerald-50 border-dashed border-2 border-green-200">
            <div className="max-w-lg mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No Spending Data Yet</h3>
              <p className="text-gray-600 mb-6">
                Start tracking your spending at Muslim-owned businesses to see your impact on the community.
                Click "Add Spending" above to record your first purchase.
              </p>
              <Link href="/search">
                <Button size="lg" variant="outline">
                  <Building2 className="w-4 h-4 mr-2" />
                  Find Businesses
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold mb-1">
                    ${summary?.totalSpent.toFixed(2)}
                  </h3>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary?.totalEntries} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold mb-1">
                    {summary?.byBusiness.length || 0}
                  </h3>
                  <p className="text-sm text-gray-600">Businesses Supported</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold mb-1">
                    {summary?.byCategory.length || 0}
                  </h3>
                  <p className="text-sm text-gray-600">Categories</p>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            {summary?.byCategory && summary.byCategory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.byCategory
                      .sort((a, b) => b.total - a.total)
                      .map((cat) => (
                        <div key={cat.category} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium capitalize">
                                {cat.category.toLowerCase().replace(/_/g, " ")}
                              </span>
                              <span className="text-gray-600">
                                ${cat.total.toFixed(2)} ({cat.count} transactions)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${(cat.total / (summary.totalSpent || 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Businesses */}
            {summary?.byBusiness && summary.byBusiness.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Businesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.byBusiness
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 5)
                      .map((biz) => (
                        <div key={biz.business.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Link href={`/business/${biz.business.slug}`}>
                              <span className="font-medium hover:text-green-600">
                                {biz.business.name}
                              </span>
                            </Link>
                            <p className="text-sm text-gray-500">{biz.count} visits</p>
                          </div>
                          <span className="text-lg font-semibold text-green-600">
                            ${biz.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entries.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/business/${entry.business.slug}`}>
                            <span className="font-medium hover:text-green-600">
                              {entry.business.name}
                            </span>
                          </Link>
                          <span className="text-sm text-gray-500">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-green-600">
                          ${entry.amount.toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
