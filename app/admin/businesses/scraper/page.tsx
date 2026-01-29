"use client";

import { useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

// Types
type DataSource =
  | "google_places"
  | "yelp"
  | "zabihah"
  | "halaltrip"
  | "muslimpro"
  | "yellowpages"
  | "bbb"
  // Halal certification directories
  | "hfsaa"
  | "hms"
  | "isna"
  | "ifanca";

type BusinessCategory =
  | "HALAL_FOOD"
  | "RESTAURANT"
  | "GROCERY"
  | "MASJID"
  | "AUTO_REPAIR"
  | "PLUMBING"
  | "ELECTRICAL"
  | "HANDYMAN"
  | "TUTORING"
  | "LEGAL_SERVICES"
  | "ACCOUNTING"
  | "HEALTH_WELLNESS"
  | "BARBER_SALON"
  | "CHILDCARE"
  | "COMMUNITY_AID"
  | "REAL_ESTATE"
  | "INSURANCE"
  | "IT_SERVICES"
  | "CLOTHING"
  | "JEWELRY"
  | "TRAVEL"
  | "CATERING"
  | "FOOD_TRUCK"
  | "BAKERY"
  | "BUTCHER"
  | "PHARMACY"
  | "DENTAL"
  | "OPTOMETRY"
  | "MENTAL_HEALTH"
  | "FITNESS"
  | "MARTIAL_ARTS"
  | "PHOTOGRAPHY"
  | "EVENT_PLANNING"
  | "WEDDING_SERVICES"
  | "FUNERAL_SERVICES"
  | "FINANCIAL_SERVICES"
  | "MORTGAGE"
  | "CLEANING"
  | "LANDSCAPING"
  | "MOVING"
  | "PRINTING"
  | "OTHER";

type BusinessTag =
  | "MUSLIM_OWNED"
  | "HALAL_VERIFIED"
  | "ZABIHA_CERTIFIED"
  | "SISTERS_FRIENDLY"
  | "BROTHERS_ONLY"
  | "KID_FRIENDLY"
  | "WHEELCHAIR_ACCESSIBLE"
  | "PRAYER_SPACE"
  | "WUDU_FACILITIES"
  | "FAMILY_OWNED"
  | "SHARIA_COMPLIANT"
  | "INTEREST_FREE"
  | "DELIVERY"
  | "RAMADAN_HOURS";

type VerificationLevel =
  | "UNVERIFIED"
  | "SELF_REPORTED"
  | "COMMUNITY_VERIFIED"
  | "OFFICIALLY_CERTIFIED"
  | "ADMIN_VERIFIED";

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<ScraperFormData>;
}

interface ScraperFormData {
  searchQuery: string;
  keywords: string;
  excludeKeywords: string;
  city: string;
  state: string;
  zipCode: string;
  radius: string;
  categories: BusinessCategory[];
  tags: BusinessTag[];
  sources: DataSource[];
  minConfidence: string;
  maxResultsPerSource: string;
  verificationLevel: VerificationLevel[];
  onlyWithPhotos: boolean;
  onlyWithReviews: boolean;
  onlyWithWebsite: boolean;
  onlyWithPhone: boolean;
  deduplicateByName: boolean;
  deduplicateByAddress: boolean;
  deduplicateByPhone: boolean;
}

interface ScrapeResult {
  success: boolean;
  businesses: any[];
  errors: { source: string; message: string }[];
  stats: {
    totalFound: number;
    totalSaved?: number;
    totalImported?: number;
    duplicatesSkipped?: number;
    totalSkipped?: number;
    lowConfidenceSkipped?: number;
    averageConfidence?: number;
    processingTime?: number;
    duration?: number;
    bySource: Record<string, number>;
    byCategory?: Record<string, number>;
  };
}

// Filter presets
const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "halal_restaurants",
    name: "Halal Restaurants",
    description: "Find halal-certified restaurants and eateries",
    icon: "🍽️",
    config: {
      searchQuery: "halal restaurant",
      keywords: "halal, zabiha, halal certified",
      categories: ["RESTAURANT", "FOOD_TRUCK", "CATERING"],
      tags: ["HALAL_VERIFIED", "ZABIHA_CERTIFIED"],
      minConfidence: "60",
    },
  },
  {
    id: "halal_markets",
    name: "Halal Markets",
    description: "Halal meat markets and grocery stores",
    icon: "🥩",
    config: {
      searchQuery: "halal meat market grocery",
      keywords: "halal meat, zabiha, halal grocery, butcher",
      categories: ["HALAL_FOOD", "GROCERY", "BUTCHER"],
      tags: ["HALAL_VERIFIED", "ZABIHA_CERTIFIED"],
      minConfidence: "70",
    },
  },
  {
    id: "masjids",
    name: "Masjids",
    description: "Mosques and Islamic community centers",
    icon: "🕌",
    config: {
      searchQuery: "masjid mosque islamic center",
      keywords: "masjid, mosque, islamic center, musalla",
      categories: ["MASJID"],
      minConfidence: "80",
    },
  },
  {
    id: "muslim_services",
    name: "Muslim Services",
    description: "Various Muslim-owned service businesses",
    icon: "🔧",
    config: {
      searchQuery: "muslim owned business",
      keywords: "muslim owned, halal, islamic",
      categories: ["AUTO_REPAIR", "PLUMBING", "ELECTRICAL", "HANDYMAN", "CLEANING"],
      tags: ["MUSLIM_OWNED"],
      minConfidence: "50",
    },
  },
  {
    id: "islamic_education",
    name: "Islamic Education",
    description: "Quran schools and Islamic tutoring",
    icon: "📚",
    config: {
      searchQuery: "quran school islamic tutoring arabic",
      keywords: "quran, islamic school, arabic, hifz, tutoring",
      categories: ["TUTORING"],
      minConfidence: "60",
    },
  },
  {
    id: "halal_finance",
    name: "Halal Finance",
    description: "Sharia-compliant financial services",
    icon: "💰",
    config: {
      searchQuery: "islamic finance halal mortgage sharia compliant",
      keywords: "sharia compliant, islamic finance, halal mortgage, takaful",
      categories: ["FINANCIAL_SERVICES", "INSURANCE", "MORTGAGE", "REAL_ESTATE"],
      tags: ["SHARIA_COMPLIANT", "INTEREST_FREE"],
      minConfidence: "70",
    },
  },
  {
    id: "sisters_services",
    name: "Sisters Services",
    description: "Services catering to Muslim women",
    icon: "👩",
    config: {
      searchQuery: "sisters salon women only hijab modest",
      keywords: "sisters, women only, hijab, modest",
      categories: ["BARBER_SALON", "FITNESS", "HEALTH_WELLNESS"],
      tags: ["SISTERS_FRIENDLY"],
      minConfidence: "50",
    },
  },
  {
    id: "family_friendly",
    name: "Family Friendly",
    description: "Kid and family-friendly establishments",
    icon: "👨‍👩‍👧‍👦",
    config: {
      searchQuery: "family friendly halal",
      keywords: "family, kid friendly, children",
      tags: ["KID_FRIENDLY", "FAMILY_OWNED"],
      minConfidence: "40",
    },
  },
];

// All available sources
const ALL_SOURCES: { id: DataSource; name: string; description: string }[] = [
  { id: "google_places", name: "Google Places", description: "Google Maps business listings" },
  { id: "yelp", name: "Yelp", description: "Yelp business reviews" },
  { id: "zabihah", name: "Zabihah", description: "Halal restaurant directory" },
  { id: "halaltrip", name: "HalalTrip", description: "Halal travel & dining" },
  { id: "muslimpro", name: "Muslim Pro", description: "Halal finder app" },
  { id: "yellowpages", name: "Yellow Pages", description: "Business directory" },
  { id: "bbb", name: "BBB", description: "Better Business Bureau" },
  // Halal certification directories
  { id: "hfsaa", name: "HFSAA", description: "Halal Food Standards Alliance (certified)" },
  { id: "hms", name: "HMS", description: "Halal Monitoring Services (CLI only)" },
  { id: "isna", name: "ISNA", description: "ISNA Halal Certification (coming soon)" },
  { id: "ifanca", name: "IFANCA", description: "IFANCA Certification (coming soon)" },
];

// All categories
const ALL_CATEGORIES: { id: BusinessCategory; name: string; group: string }[] = [
  // Food & Dining
  { id: "RESTAURANT", name: "Restaurant", group: "Food & Dining" },
  { id: "HALAL_FOOD", name: "Halal Food", group: "Food & Dining" },
  { id: "GROCERY", name: "Grocery", group: "Food & Dining" },
  { id: "BUTCHER", name: "Butcher", group: "Food & Dining" },
  { id: "BAKERY", name: "Bakery", group: "Food & Dining" },
  { id: "FOOD_TRUCK", name: "Food Truck", group: "Food & Dining" },
  { id: "CATERING", name: "Catering", group: "Food & Dining" },
  // Religious
  { id: "MASJID", name: "Masjid", group: "Religious" },
  // Services
  { id: "AUTO_REPAIR", name: "Auto Repair", group: "Services" },
  { id: "PLUMBING", name: "Plumbing", group: "Services" },
  { id: "ELECTRICAL", name: "Electrical", group: "Services" },
  { id: "HANDYMAN", name: "Handyman", group: "Services" },
  { id: "CLEANING", name: "Cleaning", group: "Services" },
  { id: "LANDSCAPING", name: "Landscaping", group: "Services" },
  { id: "MOVING", name: "Moving", group: "Services" },
  // Professional
  { id: "LEGAL_SERVICES", name: "Legal Services", group: "Professional" },
  { id: "ACCOUNTING", name: "Accounting", group: "Professional" },
  { id: "REAL_ESTATE", name: "Real Estate", group: "Professional" },
  { id: "INSURANCE", name: "Insurance", group: "Professional" },
  { id: "FINANCIAL_SERVICES", name: "Financial Services", group: "Professional" },
  { id: "MORTGAGE", name: "Mortgage", group: "Professional" },
  { id: "IT_SERVICES", name: "IT Services", group: "Professional" },
  // Health & Beauty
  { id: "HEALTH_WELLNESS", name: "Health & Wellness", group: "Health & Beauty" },
  { id: "BARBER_SALON", name: "Barber/Salon", group: "Health & Beauty" },
  { id: "DENTAL", name: "Dental", group: "Health & Beauty" },
  { id: "OPTOMETRY", name: "Optometry", group: "Health & Beauty" },
  { id: "PHARMACY", name: "Pharmacy", group: "Health & Beauty" },
  { id: "MENTAL_HEALTH", name: "Mental Health", group: "Health & Beauty" },
  { id: "FITNESS", name: "Fitness", group: "Health & Beauty" },
  // Education & Events
  { id: "TUTORING", name: "Tutoring", group: "Education & Events" },
  { id: "CHILDCARE", name: "Childcare", group: "Education & Events" },
  { id: "EVENT_PLANNING", name: "Event Planning", group: "Education & Events" },
  { id: "WEDDING_SERVICES", name: "Wedding Services", group: "Education & Events" },
  { id: "PHOTOGRAPHY", name: "Photography", group: "Education & Events" },
  // Retail
  { id: "CLOTHING", name: "Clothing", group: "Retail" },
  { id: "JEWELRY", name: "Jewelry", group: "Retail" },
  // Other
  { id: "TRAVEL", name: "Travel", group: "Other" },
  { id: "COMMUNITY_AID", name: "Community Aid", group: "Other" },
  { id: "FUNERAL_SERVICES", name: "Funeral Services", group: "Other" },
  { id: "MARTIAL_ARTS", name: "Martial Arts", group: "Other" },
  { id: "PRINTING", name: "Printing", group: "Other" },
  { id: "OTHER", name: "Other", group: "Other" },
];

// All tags
const ALL_TAGS: { id: BusinessTag; name: string; description: string }[] = [
  { id: "MUSLIM_OWNED", name: "Muslim Owned", description: "Verified Muslim-owned business" },
  { id: "HALAL_VERIFIED", name: "Halal Verified", description: "Halal certification verified" },
  { id: "ZABIHA_CERTIFIED", name: "Zabiha Certified", description: "Hand-slaughtered meat" },
  { id: "SISTERS_FRIENDLY", name: "Sisters Friendly", description: "Accommodates Muslim women" },
  { id: "BROTHERS_ONLY", name: "Brothers Only", description: "Men-only establishment" },
  { id: "KID_FRIENDLY", name: "Kid Friendly", description: "Welcomes children" },
  { id: "WHEELCHAIR_ACCESSIBLE", name: "Wheelchair Accessible", description: "ADA compliant" },
  { id: "PRAYER_SPACE", name: "Prayer Space", description: "Has prayer area" },
  { id: "WUDU_FACILITIES", name: "Wudu Facilities", description: "Has wudu/ablution area" },
  { id: "FAMILY_OWNED", name: "Family Owned", description: "Family-owned business" },
  { id: "SHARIA_COMPLIANT", name: "Sharia Compliant", description: "Islamic finance compliant" },
  { id: "INTEREST_FREE", name: "Interest Free", description: "No riba/interest" },
  { id: "DELIVERY", name: "Delivery", description: "Offers delivery" },
  { id: "RAMADAN_HOURS", name: "Ramadan Hours", description: "Special Ramadan hours" },
];

export default function EnhancedScraperPage() {
  const { data: session } = useMockSession();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResult | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "filters" | "sources" | "options">("search");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState<ScraperFormData>({
    searchQuery: "halal restaurants",
    keywords: "",
    excludeKeywords: "",
    city: "Fremont",
    state: "CA",
    zipCode: "94536",
    radius: "10",
    categories: [],
    tags: [],
    sources: ["google_places", "yelp", "zabihah"],
    minConfidence: "50",
    maxResultsPerSource: "20",
    verificationLevel: [],
    onlyWithPhotos: false,
    onlyWithReviews: false,
    onlyWithWebsite: false,
    onlyWithPhone: false,
    deduplicateByName: true,
    deduplicateByAddress: true,
    deduplicateByPhone: true,
  });

  const applyPreset = (preset: FilterPreset) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.config,
      keywords: preset.config.keywords || "",
    }));
  };

  const toggleCategory = (category: BusinessCategory) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleTag = (tag: BusinessTag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const toggleSource = (source: DataSource) => {
    setFormData((prev) => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source],
    }));
  };

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
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(",").map((k) => k.trim()).filter(Boolean),
          excludeKeywords: formData.excludeKeywords.split(",").map((k) => k.trim()).filter(Boolean),
          radius: parseInt(formData.radius) || 10,
          minConfidence: parseInt(formData.minConfidence) || 50,
          maxResultsPerSource: parseInt(formData.maxResultsPerSource) || 20,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setResults({
          success: false,
          businesses: [],
          errors: [{ source: "api", message: data.error || "Failed to scrape" }],
          stats: {
            totalFound: 0,
            totalSaved: 0,
            duplicatesSkipped: 0,
            lowConfidenceSkipped: 0,
            averageConfidence: 0,
            processingTime: 0,
            bySource: {},
            byCategory: {},
          },
        });
      }
    } catch (error) {
      setResults({
        success: false,
        businesses: [],
        errors: [{ source: "network", message: "Network error occurred" }],
        stats: {
          totalFound: 0,
          totalSaved: 0,
          duplicatesSkipped: 0,
          lowConfidenceSkipped: 0,
          averageConfidence: 0,
          processingTime: 0,
          bySource: {},
          byCategory: {},
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Enhanced Business Scraper</h1>
            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
          <p className="text-gray-600">
            Discover Muslim-owned businesses from multiple sources with advanced filtering
          </p>
        </div>

        {/* Quick Presets */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {FILTER_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="flex items-center gap-2"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Scraper Configuration</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? "Hide Advanced" : "Show Advanced"}
                  </Button>
                </div>
                {/* Tabs */}
                <div className="flex gap-1 mt-4 border-b">
                  {(["search", "filters", "sources", "options"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === tab
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScrape} className="space-y-6">
                  {/* Search Tab */}
                  {activeTab === "search" && (
                    <div className="space-y-4">
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
                          Main search terms to find businesses
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="keywords">Additional Keywords</Label>
                        <Input
                          id="keywords"
                          value={formData.keywords}
                          onChange={(e) =>
                            setFormData({ ...formData, keywords: e.target.value })
                          }
                          placeholder="halal, zabiha, muslim-owned (comma-separated)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Extra keywords to boost relevance
                        </p>
                      </div>

                      {showAdvanced && (
                        <div>
                          <Label htmlFor="excludeKeywords">Exclude Keywords</Label>
                          <Input
                            id="excludeKeywords"
                            value={formData.excludeKeywords}
                            onChange={(e) =>
                              setFormData({ ...formData, excludeKeywords: e.target.value })
                            }
                            placeholder="non-halal, pork (comma-separated)"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Businesses with these keywords will be excluded
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
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

                      <div className="grid grid-cols-2 gap-4">
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
                    </div>
                  )}

                  {/* Filters Tab */}
                  {activeTab === "filters" && (
                    <div className="space-y-6">
                      {/* Categories */}
                      <div>
                        <Label className="text-base font-semibold">Categories</Label>
                        <p className="text-xs text-gray-500 mb-3">
                          Select business categories to include (leave empty for all)
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {ALL_CATEGORIES.map((cat) => (
                            <label
                              key={cat.id}
                              className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50 ${
                                formData.categories.includes(cat.id)
                                  ? "border-primary bg-primary/5"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.categories.includes(cat.id)}
                                onChange={() => toggleCategory(cat.id)}
                                className="rounded"
                              />
                              <span className="text-sm">{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <Label className="text-base font-semibold">Required Tags</Label>
                        <p className="text-xs text-gray-500 mb-3">
                          Only show businesses with these tags
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {ALL_TAGS.map((tag) => (
                            <label
                              key={tag.id}
                              className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50 ${
                                formData.tags.includes(tag.id)
                                  ? "border-primary bg-primary/5"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.tags.includes(tag.id)}
                                onChange={() => toggleTag(tag.id)}
                                className="rounded"
                              />
                              <div>
                                <span className="text-sm font-medium">{tag.name}</span>
                                <p className="text-xs text-gray-500">{tag.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Confidence */}
                      <div>
                        <Label htmlFor="minConfidence">
                          Minimum Confidence Score: {formData.minConfidence}%
                        </Label>
                        <input
                          type="range"
                          id="minConfidence"
                          min="0"
                          max="100"
                          step="5"
                          value={formData.minConfidence}
                          onChange={(e) =>
                            setFormData({ ...formData, minConfidence: e.target.value })
                          }
                          className="w-full mt-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0% (All results)</span>
                          <span>50% (Moderate)</span>
                          <span>100% (Very confident)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sources Tab */}
                  {activeTab === "sources" && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">Data Sources</Label>
                        <p className="text-xs text-gray-500 mb-3">
                          Select which sources to scrape from
                        </p>
                        <div className="grid gap-2">
                          {ALL_SOURCES.map((source) => (
                            <label
                              key={source.id}
                              className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                                formData.sources.includes(source.id)
                                  ? "border-primary bg-primary/5"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.sources.includes(source.id)}
                                onChange={() => toggleSource(source.id)}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <span className="font-medium">{source.name}</span>
                                <p className="text-xs text-gray-500">{source.description}</p>
                              </div>
                              {source.id === "zabihah" || source.id === "halaltrip" || source.id === "muslimpro" ? (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  Halal-focused
                                </span>
                              ) : null}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="maxResultsPerSource">Max Results Per Source</Label>
                        <Input
                          id="maxResultsPerSource"
                          type="number"
                          value={formData.maxResultsPerSource}
                          onChange={(e) =>
                            setFormData({ ...formData, maxResultsPerSource: e.target.value })
                          }
                          placeholder="20"
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>
                  )}

                  {/* Options Tab */}
                  {activeTab === "options" && (
                    <div className="space-y-6">
                      {/* Quality Filters */}
                      <div>
                        <Label className="text-base font-semibold">Quality Filters</Label>
                        <p className="text-xs text-gray-500 mb-3">
                          Filter results based on data quality
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.onlyWithPhotos}
                              onChange={(e) =>
                                setFormData({ ...formData, onlyWithPhotos: e.target.checked })
                              }
                              className="rounded"
                            />
                            <span className="text-sm">Only with photos</span>
                          </label>
                          <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.onlyWithReviews}
                              onChange={(e) =>
                                setFormData({ ...formData, onlyWithReviews: e.target.checked })
                              }
                              className="rounded"
                            />
                            <span className="text-sm">Only with reviews</span>
                          </label>
                          <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.onlyWithWebsite}
                              onChange={(e) =>
                                setFormData({ ...formData, onlyWithWebsite: e.target.checked })
                              }
                              className="rounded"
                            />
                            <span className="text-sm">Only with website</span>
                          </label>
                          <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.onlyWithPhone}
                              onChange={(e) =>
                                setFormData({ ...formData, onlyWithPhone: e.target.checked })
                              }
                              className="rounded"
                            />
                            <span className="text-sm">Only with phone</span>
                          </label>
                        </div>
                      </div>

                      {/* Deduplication */}
                      <div>
                        <Label className="text-base font-semibold">Deduplication</Label>
                        <p className="text-xs text-gray-500 mb-3">
                          Prevent duplicate entries from being added
                        </p>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.deduplicateByName}
                              onChange={(e) =>
                                setFormData({ ...formData, deduplicateByName: e.target.checked })
                              }
                              className="rounded"
                            />
                            <div>
                              <span className="text-sm font-medium">By Name</span>
                              <p className="text-xs text-gray-500">
                                Skip businesses with similar names
                              </p>
                            </div>
                          </label>
                          <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.deduplicateByAddress}
                              onChange={(e) =>
                                setFormData({ ...formData, deduplicateByAddress: e.target.checked })
                              }
                              className="rounded"
                            />
                            <div>
                              <span className="text-sm font-medium">By Address</span>
                              <p className="text-xs text-gray-500">
                                Skip businesses at the same address
                              </p>
                            </div>
                          </label>
                          <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.deduplicateByPhone}
                              onChange={(e) =>
                                setFormData({ ...formData, deduplicateByPhone: e.target.checked })
                              }
                              className="rounded"
                            />
                            <div>
                              <span className="text-sm font-medium">By Phone</span>
                              <p className="text-xs text-gray-500">
                                Skip businesses with the same phone number
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4 border-t">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || formData.sources.length === 0}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Scraping {formData.sources.length} source(s)...
                        </span>
                      ) : (
                        `Start Scraping (${formData.sources.length} sources)`
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Config Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Query:</span>{" "}
                  <span className="text-gray-600">{formData.searchQuery || "Not set"}</span>
                </div>
                <div>
                  <span className="font-medium">Location:</span>{" "}
                  <span className="text-gray-600">
                    {formData.city}, {formData.state} {formData.zipCode}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Radius:</span>{" "}
                  <span className="text-gray-600">{formData.radius} miles</span>
                </div>
                <div>
                  <span className="font-medium">Sources:</span>{" "}
                  <span className="text-gray-600">{formData.sources.length} selected</span>
                </div>
                <div>
                  <span className="font-medium">Categories:</span>{" "}
                  <span className="text-gray-600">
                    {formData.categories.length || "All"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Min Confidence:</span>{" "}
                  <span className="text-gray-600">{formData.minConfidence}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Best Practices</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Use specific keywords (halal, muslim-owned)</li>
                    <li>Enable halal-focused sources for better results</li>
                    <li>Set confidence threshold based on data quality needs</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Source Priority</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Zabihah - Best for halal restaurants</li>
                    <li>Muslim Pro - Good for masjids</li>
                    <li>Google/Yelp - Broader coverage</li>
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
                {results.success ? "Scraping Results" : "Scraping Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.success ? (
                <div>
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        {results.stats.totalSaved ?? results.stats.totalImported ?? 0}
                      </div>
                      <div className="text-sm text-green-600">Businesses Found</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">
                        {(results.stats.averageConfidence ?? 0).toFixed(0)}%
                      </div>
                      <div className="text-sm text-blue-600">Avg Confidence</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-700">
                        {results.stats.duplicatesSkipped ?? results.stats.totalSkipped ?? 0}
                      </div>
                      <div className="text-sm text-yellow-600">Duplicates Skipped</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-700">
                        {((results.stats.processingTime ?? results.stats.duration ?? 0) / 1000).toFixed(1)}s
                      </div>
                      <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                  </div>

                  {/* Results by source */}
                  {Object.keys(results.stats.bySource).length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Results by Source</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(results.stats.bySource).map(([source, count]) => (
                          <span
                            key={source}
                            className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                          >
                            {source}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Business List */}
                  {results.businesses.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Found Businesses</h4>
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {results.businesses.map((business, idx) => (
                          <div
                            key={idx}
                            className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{business.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {business.address}, {business.city}, {business.state}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`text-sm font-medium px-2 py-1 rounded ${
                                    business.confidence >= 70
                                      ? "bg-green-100 text-green-800"
                                      : business.confidence >= 50
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {business.confidence}% confidence
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                {business.category}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                {business.source}
                              </span>
                              {business.tags?.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {business.phone && (
                              <p className="text-sm text-gray-500 mt-1">{business.phone}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t flex gap-4">
                        <Link href="/admin/businesses/review-queue">
                          <Button>Go to Review Queue</Button>
                        </Link>
                        <Link href="/admin/import">
                          <Button variant="outline">Bulk Import</Button>
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
                        <span className="font-medium">{error.source}:</span> {error.message}
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
