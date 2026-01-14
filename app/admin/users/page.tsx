"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
  businessCount: number;
  reviewCount: number;
}

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "CONSUMER", label: "Consumer" },
  { value: "BUSINESS_OWNER", label: "Business Owner" },
  { value: "ADMIN", label: "Admin" },
];

export default function AdminUsersPage() {
  const { data: session } = useMockSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [session, page, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleEditSave = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setEditingUser(null);
        setEditForm({});
        fetchUsers();
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700",
      BUSINESS_OWNER: "bg-blue-100 text-blue-700",
      CONSUMER: "bg-gray-100 text-gray-700",
    };
    return styles[role] || "bg-gray-100 text-gray-700";
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage all users on the platform</p>
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
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Businesses</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reviews</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Verified</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                          {user.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{user.businessCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{user.reviewCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        {user.emailVerified ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setEditForm({
                                name: user.name,
                                email: user.email,
                                role: user.role,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          {user.role !== "ADMIN" && (
                            <>
                              {user.role === "CONSUMER" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => handleUpdateRole(user.id, "BUSINESS_OWNER")}
                                >
                                  Make Owner
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(user.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
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
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
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
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editForm.role || ""}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={editingUser.role === "ADMIN"}
                >
                  {ROLE_OPTIONS.filter(o => o.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {editingUser.role === "ADMIN" && (
                  <p className="text-xs text-gray-500 mt-1">Admin role cannot be changed</p>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditSave} className="flex-1">Save Changes</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingUser(null);
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
