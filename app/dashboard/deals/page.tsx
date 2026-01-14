"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";
import { DEAL_TYPES } from "@/lib/constants";

interface Deal {
  id: string;
  businessId: string;
  title: string;
  description: string;
  dealType: string;
  discountValue: number;
  code?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
}

export default function DealsManagementPage() {
  const { data: session } = useMockSession();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dealType: "PERCENTAGE_OFF",
    discountValue: 10,
    code: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    maxUsage: "",
  });

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = () => {
    // Load from localStorage for mock mode
    const savedDeals = localStorage.getItem("businessDeals");
    if (savedDeals) {
      try {
        const allDeals = JSON.parse(savedDeals);
        // Filter for current user's business
        const userDeals = allDeals.filter((d: Deal) => d.businessId === session?.user?.id);
        setDeals(userDeals);
      } catch {
        setDeals([]);
      }
    }
    setLoading(false);
  };

  const saveDeals = (updatedDeals: Deal[]) => {
    // Get all deals and update current user's
    const savedDeals = localStorage.getItem("businessDeals");
    let allDeals = savedDeals ? JSON.parse(savedDeals) : [];

    // Remove current user's deals
    allDeals = allDeals.filter((d: Deal) => d.businessId !== session?.user?.id);

    // Add updated deals
    allDeals = [...allDeals, ...updatedDeals];

    localStorage.setItem("businessDeals", JSON.stringify(allDeals));
    setDeals(updatedDeals);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newDeal: Deal = {
      id: editingDeal?.id || Date.now().toString(),
      businessId: session?.user?.id || "",
      title: formData.title,
      description: formData.description,
      dealType: formData.dealType,
      discountValue: formData.discountValue,
      code: formData.code || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: true,
      usageCount: editingDeal?.usageCount || 0,
      maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
      createdAt: editingDeal?.createdAt || new Date().toISOString(),
    };

    let updatedDeals;
    if (editingDeal) {
      updatedDeals = deals.map((d) => (d.id === editingDeal.id ? newDeal : d));
    } else {
      updatedDeals = [newDeal, ...deals];
    }

    saveDeals(updatedDeals);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dealType: "PERCENTAGE_OFF",
      discountValue: 10,
      code: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      maxUsage: "",
    });
    setShowCreateModal(false);
    setEditingDeal(null);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description,
      dealType: deal.dealType,
      discountValue: deal.discountValue,
      code: deal.code || "",
      startDate: deal.startDate,
      endDate: deal.endDate,
      maxUsage: deal.maxUsage?.toString() || "",
    });
    setShowCreateModal(true);
  };

  const handleToggleActive = (dealId: string) => {
    const updatedDeals = deals.map((d) =>
      d.id === dealId ? { ...d, isActive: !d.isActive } : d
    );
    saveDeals(updatedDeals);
  };

  const handleDelete = (dealId: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    const updatedDeals = deals.filter((d) => d.id !== dealId);
    saveDeals(updatedDeals);
  };

  const getDealTypeInfo = (type: string) => {
    return DEAL_TYPES.find((d) => d.value === type);
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Please log in to manage deals.</p>
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
          <h1 className="text-3xl font-bold">Deals & Offers</h1>
          <p className="text-gray-600">Create and manage special offers for your customers</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Button onClick={() => setShowCreateModal(true)}>
            + Create New Deal
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{deals.filter((d) => d.isActive).length}</div>
            <div className="text-sm text-gray-600">Active Deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{deals.reduce((acc, d) => acc + d.usageCount, 0)}</div>
            <div className="text-sm text-gray-600">Total Redemptions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{deals.filter((d) => isExpired(d.endDate)).length}</div>
            <div className="text-sm text-gray-600">Expired Deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{deals.length}</div>
            <div className="text-sm text-gray-600">Total Deals Created</div>
          </CardContent>
        </Card>
      </div>

      {/* Deals List */}
      {loading ? (
        <div className="text-center py-8">Loading deals...</div>
      ) : deals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <span className="text-4xl block mb-4">🏷️</span>
            <h3 className="font-semibold text-lg mb-2">No deals yet</h3>
            <p className="text-gray-600 mb-4">Create your first deal to attract more customers!</p>
            <Button onClick={() => setShowCreateModal(true)}>Create Your First Deal</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deals.map((deal) => {
            const dealType = getDealTypeInfo(deal.dealType);
            const expired = isExpired(deal.endDate);

            return (
              <Card key={deal.id} className={expired ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{dealType?.icon}</span>
                        <div>
                          <h3 className="font-semibold text-lg">{deal.title}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              deal.isActive && !expired
                                ? "bg-green-100 text-green-700"
                                : expired
                                ? "bg-gray-100 text-gray-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {expired ? "Expired" : deal.isActive ? "Active" : "Paused"}
                            </span>
                            <span className="text-gray-500">
                              {deal.dealType === "PERCENTAGE_OFF" && `${deal.discountValue}% Off`}
                              {deal.dealType === "FIXED_AMOUNT_OFF" && `$${deal.discountValue} Off`}
                              {deal.dealType === "BUY_ONE_GET_ONE" && "Buy One Get One"}
                              {deal.dealType === "SPECIAL_PRICE" && `Special: $${deal.discountValue}`}
                              {deal.dealType === "FREE_ITEM" && "Free Item"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-3">{deal.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {deal.code && (
                          <span className="bg-gray-100 px-2 py-1 rounded font-mono">
                            Code: {deal.code}
                          </span>
                        )}
                        <span>
                          Valid: {new Date(deal.startDate).toLocaleDateString()} - {new Date(deal.endDate).toLocaleDateString()}
                        </span>
                        <span>{deal.usageCount} redemptions</span>
                        {deal.maxUsage && (
                          <span>Max: {deal.maxUsage}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(deal)}
                      >
                        Edit
                      </Button>
                      {!expired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(deal.id)}
                          className={deal.isActive ? "text-yellow-600" : "text-green-600"}
                        >
                          {deal.isActive ? "Pause" : "Activate"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(deal.id)}
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
              <CardTitle>{editingDeal ? "Edit Deal" : "Create New Deal"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Deal Title</label>
                  <Input
                    required
                    placeholder="e.g., Weekend Special"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    required
                    placeholder="Describe your deal..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Deal Type</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.dealType}
                      onChange={(e) => setFormData({ ...formData, dealType: e.target.value })}
                    >
                      {DEAL_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {formData.dealType === "PERCENTAGE_OFF" ? "Discount %" : "Value ($)"}
                    </label>
                    <Input
                      type="number"
                      required
                      min="1"
                      max={formData.dealType === "PERCENTAGE_OFF" ? "100" : undefined}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Promo Code (Optional)</label>
                  <Input
                    placeholder="e.g., WEEKEND20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <Input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Redemptions (Optional)</label>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    min="1"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingDeal ? "Save Changes" : "Create Deal"}
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
