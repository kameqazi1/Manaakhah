"use client";

import { useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ScrapeResult {
  success: boolean;
  businessesFound: number;
  businesses: any[];
  errors: string[];
}

export default function ScraperPage() {
  const { data: session } = useMockSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResult | null>(null);
  const [formData, setFormData] = useState({
    searchQuery: "halal restaurants fremont ca",
    city: "Fremont",
    state: "CA",
    zipCode: "94536",
    radius: "10",
    category: "HALAL_MARKET",
    source: "google",
  });

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch("/api/admin/scraper/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setResults({
          success: false,
          businessesFound: 0,
          businesses: [],
          errors: [data.error || "Failed to scrape"],
        });
      }
    } catch (error) {
      setResults({
        success: false,
        businessesFound: 0,
        businesses: [],
        errors: ["Network error occurred"],
      });
    } finally {
      setLoading(false);
    }
  };

  const presetSearches = [
    {
      name: "Halal Restaurants",
      query: "halal restaurants fremont ca",
      category: "RESTAURANT",
    },
    {
      name: "Halal Markets",
      query: "halal grocery store fremont ca",
      category: "HALAL_MARKET",
    },
    {
      name: "Masjids",
      query: "islamic center mosque fremont ca",
      category: "MASJID",
    },
    {
      name: "Halal Food Truck",
      query: "halal food truck bay area",
      category: "RESTAURANT",
    },
    {
      name: "Muslim Tutoring",
      query: "islamic tutoring quran teacher fremont",
      category: "TUTORING",
    },
  ];

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Muslim Business Web Scraper</h1>
            <Link href="/admin">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
          <p className="text-gray-600">
            Automatically discover Muslim-owned businesses from the web
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Scraper Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Scraper Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScrape} className="space-y-4">
                <div>
                  <Label htmlFor="searchQuery">Search Query *</Label>
                  <Input
                    id="searchQuery"
                    value={formData.searchQuery}
                    onChange={(e) =>
                      setFormData({ ...formData, searchQuery: e.target.value })
                    }
                    placeholder="e.g., halal restaurants fremont ca"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include keywords like: halal, muslim-owned, islamic, masjid
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Fremont"
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="CA"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) =>
                        setFormData({ ...formData, zipCode: e.target.value })
                      }
                      placeholder="94536"
                    />
                  </div>

                  <div>
                    <Label htmlFor="radius">Radius (miles)</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={formData.radius}
                      onChange={(e) =>
                        setFormData({ ...formData, radius: e.target.value })
                      }
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Business Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="HALAL_MARKET">Halal Market</option>
                    <option value="MASJID">Masjid</option>
                    <option value="AUTO_REPAIR">Auto Repair</option>
                    <option value="TUTORING">Tutoring</option>
                    <option value="HEALTH_WELLNESS">Health & Wellness</option>
                    <option value="LEGAL">Legal Services</option>
                    <option value="REAL_ESTATE">Real Estate</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="source">Data Source</Label>
                  <select
                    id="source"
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="google">Google Places (Recommended)</option>
                    <option value="yelp">Yelp</option>
                    <option value="zabihah">Zabihah.com</option>
                    <option value="manual">Manual Entry</option>
                  </select>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Scraping..." : "🔍 Start Scraping"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preset Searches */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Presets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {presetSearches.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        searchQuery: preset.query,
                        category: preset.category,
                      })
                    }
                  >
                    {preset.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Scraping Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Scraping Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">✓ Best Practices:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Use specific keywords (halal, muslim-owned)</li>
                    <li>Include location in search query</li>
                    <li>Review results before approving</li>
                    <li>Verify phone numbers and addresses</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">⚠️ Important Notes:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Data may need manual verification</li>
                    <li>Respect website terms of service</li>
                    <li>Some sources may have rate limits</li>
                    <li>Duplicate detection is automatic</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">🎯 Good Search Queries:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>"halal butcher shop fremont"</li>
                    <li>"muslim-owned restaurant bay area"</li>
                    <li>"islamic center near me"</li>
                    <li>"halal catering service"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results */}
        {results && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                {results.success ? "✅ Scraping Results" : "❌ Scraping Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.success ? (
                <div>
                  <p className="mb-4 text-lg">
                    Found <strong>{results.businessesFound}</strong> business(es)
                  </p>

                  {results.businessesFound > 0 && (
                    <div className="space-y-4">
                      {results.businesses.map((business, idx) => (
                        <div
                          key={idx}
                          className="p-4 border rounded-lg bg-gray-50"
                        >
                          <h3 className="font-semibold mb-2">{business.name}</h3>
                          <div className="text-sm space-y-1">
                            <p>📍 {business.address}</p>
                            {business.phone && <p>📞 {business.phone}</p>}
                            {business.website && (
                              <p>
                                🌐{" "}
                                <a
                                  href={business.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {business.website}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 border-t">
                        <Link href="/admin/businesses/review-queue">
                          <Button>
                            Go to Review Queue →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-red-600 mb-2">Errors occurred:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {results.errors.map((error, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
