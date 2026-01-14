"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  status: string;
  verificationStatus: string;
  reviewCount: number;
  averageRating: number;
  createdAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "SUSPENDED", label: "Suspended" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "HALAL_FOOD", label: "Halal Food" },
  { value: "MASJID", label: "Masjid" },
  { value: "AUTO_REPAIR", label: "Auto Repair" },
  { value: "TUTORING", label: "Tutoring" },
  { value: "HEALTH_WELLNESS", label: "Health & Wellness" },
  { value: "LEGAL_SERVICES", label: "Legal Services" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "FINANCIAL_SERVICES", label: "Financial Services" },
  { value: "BEAUTY_SALON", label: "Beauty Salon" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "OTHER", label: "Other" },
];

export default function AdminBusinessesPage() {
  const { data: session } = useMockSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editForm, setEditForm] = useState<Partial<Business>>({});

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/admin/businesses?${params}`, {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchBusinesses();
    }
  }, [session, page, statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBusinesses();
  };

  const handleUpdateStatus = async (businessId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchBusinesses();
      }
    } catch (error) {
      console.error("Error updating business:", error);
    }
  };

  const handleDelete = async (businessId: string) => {
    if (!confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        fetchBusinesses();
      }
    } catch (error) {
      console.error("Error deleting business:", error);
    }
  };

  const handleEditSave = async () => {
    if (!editingBusiness) return;

    try {
      const response = await fetch(`/api/admin/businesses/${editingBusiness.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setEditingBusiness(null);
        setEditForm({});
        fetchBusinesses();
      }
    } catch (error) {
      console.error("Error saving business:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PUBLISHED: "bg-green-100 text-green-700",
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
      SUSPENDED: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const getVerificationBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      UNVERIFIED: "bg-gray-100 text-gray-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
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
          <h1 className="text-3xl font-bold">All Businesses</h1>
          <p className="text-gray-600">Manage all businesses on the platform</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <Input
              placeholder="Search by name, address, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading businesses...</div>
          ) : businesses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No businesses found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Business</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Verification</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rating</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Owner</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{business.name}</p>
                          <p className="text-sm text-gray-500">
                            {business.address}, {business.city}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{business.category.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(business.status)}`}>
                          {business.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationBadge(business.verificationStatus)}`}>
                          {business.verificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {business.averageRating > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm">{business.averageRating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({business.reviewCount})</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No reviews</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{business.owner?.name || "System"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/business/${business.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingBusiness(business);
                              setEditForm({
                                name: business.name,
                                status: business.status,
                                verificationStatus: business.verificationStatus,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          {business.status === "PUBLISHED" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-yellow-600 hover:text-yellow-700"
                              onClick={() => handleUpdateStatus(business.id, "SUSPENDED")}
                            >
                              Suspend
                            </Button>
                          ) : business.status === "SUSPENDED" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleUpdateStatus(business.id, "PUBLISHED")}
                            >
                              Restore
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(business.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
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
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editForm.status || ""}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {STATUS_OPTIONS.filter(o => o.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Verification Status</label>
                <select
                  value={editForm.verificationStatus || ""}
                  onChange={(e) => setEditForm({ ...editForm, verificationStatus: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="UNVERIFIED">Unverified</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditSave} className="flex-1">Save Changes</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingBusiness(null);
                    setEditForm({});
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
