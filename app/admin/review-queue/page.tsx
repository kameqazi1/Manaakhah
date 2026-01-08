"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

interface ScrapedBusiness {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string;
  category: string;
  services: string[];
  suggestedTags: string[];
  confidence: number;
  signals: string[];
  source: string;
  sourceUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  reviewNote: string | null;
  scrapedAt: string;
}

export default function ReviewQueuePage() {
  const {  data: session } = useMockSession();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<ScrapedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<ScrapedBusiness | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ScrapedBusiness>>({});

  useEffect(() => {
    if (!USE_MOCK_DATA && session?.user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchScrapedBusinesses();
  }, [session, router]);

  const fetchScrapedBusinesses = async () => {
    setLoading(true);
    try {
      // In mock mode, get from localStorage
      if (USE_MOCK_DATA) {
        const stored = localStorage.getItem("manakhaah-mock-data");
        if (stored) {
          const data = JSON.parse(stored);
          setBusinesses(data.scrapedBusinesses || []);
        }
      } else {
        const response = await fetch("/api/scraped");
        if (response.ok) {
          const data = await response.json();
          setBusinesses(data);
        }
      }
    } catch (error) {
      console.error("Error fetching scraped businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "flag",
    note?: string
  ) => {
    if (USE_MOCK_DATA) {
      const stored = localStorage.getItem("manakhaah-mock-data");
      if (stored) {
        const data = JSON.parse(stored);
        const business = data.scrapedBusinesses.find((b: any) => b.id === id);

        if (action === "approve") {
          // Convert to real business
          const newBusiness = {
            id: `biz-${Date.now()}`,
            ownerId: session?.user.id || "admin",
            name: business.name,
            slug: business.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description: business.description,
            category: business.category,
            address: business.address,
            city: business.city,
            state: business.state,
            zipCode: business.zipCode,
            latitude: business.latitude,
            longitude: business.longitude,
            phone: business.phone,
            email: business.email,
            website: business.website,
            hours: null,
            services: business.services,
            status: "PUBLISHED",
            prayerTimes: null,
            jummahTime: null,
            aidServices: [],
            externalUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: business.suggestedTags,
            photos: [],
          };

          data.businesses.push(newBusiness);

          // Remove from scraped
          data.scrapedBusinesses = data.scrapedBusinesses.filter(
            (b: any) => b.id !== id
          );
        } else {
          // Update status
          const index = data.scrapedBusinesses.findIndex((b: any) => b.id === id);
          if (index !== -1) {
            data.scrapedBusinesses[index].status =
              action === "reject" ? "REJECTED" : "FLAGGED";
            data.scrapedBusinesses[index].reviewNote = note || null;
            data.scrapedBusinesses[index].reviewedAt = new Date();
            data.scrapedBusinesses[index].reviewedBy = session?.user.id;
          }
        }

        localStorage.setItem("manakhaah-mock-data", JSON.stringify(data));
        fetchScrapedBusinesses();
        setSelectedBusiness(null);
      }
    } else {
      // API call for real mode
      const response = await fetch(`/api/scraped/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });

      if (response.ok) {
        fetchScrapedBusinesses();
        setSelectedBusiness(null);
      }
    }
  };

  const handleSaveEdits = () => {
    if (selectedBusiness && editedData) {
      const updated = { ...selectedBusiness, ...editedData };

      if (USE_MOCK_DATA) {
        const stored = localStorage.getItem("manakhaah-mock-data");
        if (stored) {
          const data = JSON.parse(stored);
          const index = data.scrapedBusinesses.findIndex(
            (b: any) => b.id === selectedBusiness.id
          );
          if (index !== -1) {
            data.scrapedBusinesses[index] = updated;
            localStorage.setItem("manakhaah-mock-data", JSON.stringify(data));
            setBusinesses(data.scrapedBusinesses);
            setSelectedBusiness(updated);
            setEditMode(false);
          }
        }
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "FLAGGED":
        return "outline";
      default:
        return "outline";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (!USE_MOCK_DATA && session?.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied. Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const pendingBusinesses = businesses.filter((b) => b.status === "PENDING");
  const flaggedBusinesses = businesses.filter((b) => b.status === "FLAGGED");

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Scraped Business Review Queue</h1>
          <p className="text-gray-600 mt-1">
            Review and approve businesses discovered from web scraping
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold">{pendingBusinesses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-yellow-600">
                {flaggedBusinesses.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Total Scraped</p>
              <p className="text-2xl font-bold">{businesses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">High Confidence</p>
              <p className="text-2xl font-bold text-green-600">
                {businesses.filter((b) => b.confidence >= 80).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* List View */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingBusinesses.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No pending businesses
                  </p>
                ) : (
                  pendingBusinesses.map((business) => (
                    <button
                      key={business.id}
                      onClick={() => {
                        setSelectedBusiness(business);
                        setEditMode(false);
                        setEditedData({});
                      }}
                      className={`w-full text-left p-3 rounded border ${
                        selectedBusiness?.id === business.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-sm">{business.name}</p>
                        <span
                          className={`text-xs font-bold ${getConfidenceColor(
                            business.confidence
                          )}`}
                        >
                          {business.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {business.city}, {business.state}
                      </p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {business.source}
                        </Badge>
                        {business.signals.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {business.signals.length} signals
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {flaggedBusinesses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600">
                    Flagged ({flaggedBusinesses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {flaggedBusinesses.map((business) => (
                    <button
                      key={business.id}
                      onClick={() => setSelectedBusiness(business)}
                      className="w-full text-left p-3 rounded border border-yellow-200 hover:border-yellow-400"
                    >
                      <p className="font-semibold text-sm">{business.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {business.reviewNote || "No note"}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detail View */}
          <div className="md:col-span-2">
            {!selectedBusiness ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-600">
                    Select a business to review
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editMode ? (
                        <Input
                          value={editedData.name || selectedBusiness.name}
                          onChange={(e) =>
                            setEditedData({ ...editedData, name: e.target.value })
                          }
                          className="text-2xl font-bold"
                        />
                      ) : (
                        <CardTitle>{selectedBusiness.name}</CardTitle>
                      )}
                      <CardDescription className="mt-2">
                        <Badge variant={getStatusColor(selectedBusiness.status) as any}>
                          {selectedBusiness.status}
                        </Badge>
                        <span className="ml-2 text-sm">
                          Source: {selectedBusiness.source}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p
                        className={`text-3xl font-bold ${getConfidenceColor(
                          selectedBusiness.confidence
                        )}`}
                      >
                        {selectedBusiness.confidence}%
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {editMode ? (
                    <>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={
                            editedData.description || selectedBusiness.description
                          }
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Category</Label>
                        <Select
                          value={editedData.category || selectedBusiness.category}
                          onChange={(e) =>
                            setEditedData({ ...editedData, category: e.target.value })
                          }
                        >
                          <option value="HALAL_FOOD">Halal Food</option>
                          <option value="RESTAURANT">Restaurant</option>
                          <option value="MASJID">Masjid</option>
                          <option value="AUTO_REPAIR">Auto Repair</option>
                          <option value="BARBER_SALON">Barber/Salon</option>
                          <option value="OTHER">Other</option>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={editedData.phone || selectedBusiness.phone || ""}
                            onChange={(e) =>
                              setEditedData({ ...editedData, phone: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Website</Label>
                          <Input
                            value={
                              editedData.website || selectedBusiness.website || ""
                            }
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                website: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdits}>Save Changes</Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditMode(false);
                            setEditedData({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          Description
                        </p>
                        <p className="text-sm mt-1">{selectedBusiness.description}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-600">
                            Address
                          </p>
                          <p className="text-sm mt-1">
                            {selectedBusiness.address}
                            <br />
                            {selectedBusiness.city}, {selectedBusiness.state}{" "}
                            {selectedBusiness.zipCode}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600">
                            Contact
                          </p>
                          <p className="text-sm mt-1">
                            {selectedBusiness.phone || "No phone"}
                            <br />
                            {selectedBusiness.website && (
                              <a
                                href={selectedBusiness.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Website
                              </a>
                            )}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-2">
                          Muslim Signals Found ({selectedBusiness.signals.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedBusiness.signals.map((signal, i) => (
                            <Badge key={i} variant="secondary">
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {selectedBusiness.services.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">
                            Services
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedBusiness.services.map((service, i) => (
                              <Badge key={i} variant="outline">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedBusiness.suggestedTags.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">
                            Suggested Tags
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedBusiness.suggestedTags.map((tag, i) => (
                              <Badge key={i}>{tag.replace("_", " ")}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-semibold text-gray-600">Source</p>
                        <a
                          href={selectedBusiness.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedBusiness.source} →
                        </a>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t space-y-3">
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              handleAction(selectedBusiness.id, "approve")
                            }
                            className="flex-1"
                          >
                            ✓ Approve & Publish
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditMode(true)}
                          >
                            Edit
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleAction(
                                selectedBusiness.id,
                                "flag",
                                "Needs verification"
                              )
                            }
                            className="flex-1"
                          >
                            ⚑ Flag for Review
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleAction(selectedBusiness.id, "reject")
                            }
                            className="flex-1"
                          >
                            ✕ Reject
                          </Button>
                        </div>
                      </div>
                    </>
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
