"use client";

import { useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUSINESS_CATEGORIES, BUSINESS_TAGS } from "@/lib/constants";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export default function NewListingPage() {
  const { data: session } = useMockSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "HALAL_FOOD",
    address: "",
    city: "Fremont",
    state: "CA",
    zipCode: "",
    latitude: 37.5485,
    longitude: -121.9886,
    phone: "",
    email: "",
    website: "",
    services: "",
    tags: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // In mock mode, send user info in headers
      if (USE_MOCK_DATA && session?.user) {
        headers["x-user-id"] = session.user.id;
        headers["x-user-role"] = session.user.role;
      }

      const response = await fetch("/api/businesses", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...formData,
          services: formData.services
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create listing");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  // Simple geocoding simulation (in production, use Mapbox Geocoding API)
  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Listing</CardTitle>
            <CardDescription>
              Add your business to Manakhaah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Tell customers about your business..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="business@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleAddressChange("address", e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    maxLength={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    placeholder="94536"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="services">
                  Services Offered (comma-separated)
                </Label>
                <Input
                  id="services"
                  value={formData.services}
                  onChange={(e) =>
                    setFormData({ ...formData, services: e.target.value })
                  }
                  placeholder="Oil change, Brake repair, Tire rotation"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => handleTagToggle(tag.value)}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        formData.tags.includes(tag.value)
                          ? "bg-primary text-white border-primary"
                          : "bg-white border-gray-300 hover:border-primary"
                      }`}
                    >
                      {tag.icon} {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Listing"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
