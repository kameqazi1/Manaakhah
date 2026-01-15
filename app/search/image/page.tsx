"use client";

import { useState, useRef } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BUSINESS_CATEGORIES } from "@/lib/constants";

interface SearchResult {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  averageRating: number;
  reviewCount: number;
  matchScore: number;
  matchedFeatures: string[];
}

// Mock image analysis that "detects" features from uploaded images
function analyzeImage(file: File): Promise<{ features: string[]; category: string }> {
  return new Promise((resolve) => {
    // Simulate AI processing time
    setTimeout(() => {
      // Mock analysis based on file name or random features
      const possibleFeatures = [
        "halal sign", "arabic text", "prayer room", "food display",
        "restaurant interior", "shop front", "menu board", "product shelves",
        "counter service", "dining area", "outdoor seating", "takeout window"
      ];

      const possibleCategories = [
        "HALAL_FOOD", "RESTAURANT", "GROCERY", "MASJID", "BARBER_SALON"
      ];

      // Randomly select 2-4 features
      const numFeatures = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...possibleFeatures].sort(() => 0.5 - Math.random());
      const features = shuffled.slice(0, numFeatures);

      // Select a category
      const category = possibleCategories[Math.floor(Math.random() * possibleCategories.length)];

      resolve({ features, category });
    }, 1500);
  });
}

// Mock search based on analyzed features
function searchByFeatures(features: string[], category: string): Promise<SearchResult[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate mock results
      const mockResults: SearchResult[] = [
        {
          id: "img-1",
          name: "Al-Noor Halal Market",
          category: "GROCERY",
          description: "Full-service halal grocery store with fresh meat, produce, and international foods.",
          address: "1234 Main St",
          city: "Los Angeles",
          averageRating: 4.7,
          reviewCount: 156,
          matchScore: 95,
          matchedFeatures: ["halal sign", "product shelves"],
        },
        {
          id: "img-2",
          name: "Bismillah Kitchen",
          category: "RESTAURANT",
          description: "Authentic Middle Eastern cuisine with a modern twist. Family-friendly atmosphere.",
          address: "567 Oak Ave",
          city: "Los Angeles",
          averageRating: 4.5,
          reviewCount: 89,
          matchScore: 88,
          matchedFeatures: ["food display", "dining area"],
        },
        {
          id: "img-3",
          name: "Medina Restaurant",
          category: "HALAL_FOOD",
          description: "Traditional Moroccan and Mediterranean dishes in an elegant setting.",
          address: "890 Palm Blvd",
          city: "Los Angeles",
          averageRating: 4.8,
          reviewCount: 234,
          matchScore: 82,
          matchedFeatures: ["restaurant interior", "arabic text"],
        },
        {
          id: "img-4",
          name: "Salam Grocers",
          category: "GROCERY",
          description: "Your neighborhood halal grocery with imported goods from around the world.",
          address: "321 Olive St",
          city: "Los Angeles",
          averageRating: 4.3,
          reviewCount: 67,
          matchScore: 75,
          matchedFeatures: ["halal sign"],
        },
      ];

      // Filter to match category if detected
      const filtered = mockResults.filter(
        (r) => r.category === category || Math.random() > 0.3
      );

      resolve(filtered.slice(0, 4));
    }, 1000);
  });
}

export default function ImageSearchPage() {
  const { data: session } = useMockSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ features: string[]; category: string } | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset previous results
    setAnalysisResult(null);
    setSearchResults([]);

    // Analyze image
    setAnalyzing(true);
    try {
      const result = await analyzeImage(file);
      setAnalysisResult(result);

      // Search based on analysis
      setSearching(true);
      const results = await searchByFeatures(result.features, result.category);
      setSearchResults(results);
    } catch (error) {
      console.error("Error analyzing image:", error);
    } finally {
      setAnalyzing(false);
      setSearching(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const clearSearch = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setSearchResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/search" className="text-primary hover:underline text-sm">
            &larr; Back to Text Search
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Image Search</h1>
        <p className="text-gray-600 mb-6">
          Upload a photo to find similar businesses. Our AI will analyze the image and find matching businesses.
        </p>

        {/* Upload Area */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {!selectedImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary"
                }`}
              >
                <div className="text-5xl mb-4">📷</div>
                <h3 className="text-lg font-semibold mb-2">
                  Drop an image here or click to upload
                </h3>
                <p className="text-gray-500 mb-4">
                  Supported formats: JPG, PNG, WebP (max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button asChild>
                    <span>Select Image</span>
                  </Button>
                </label>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={selectedImage}
                      alt="Uploaded"
                      className="w-48 h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    {analyzing ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span>Analyzing image...</span>
                      </div>
                    ) : analysisResult ? (
                      <div>
                        <h4 className="font-semibold mb-2">Detected Features:</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {analysisResult.features.map((feature, i) => (
                            <Badge key={i} variant="secondary">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          Suggested Category:{" "}
                          <strong>
                            {BUSINESS_CATEGORIES.find((c) => c.value === analysisResult.category)?.label || analysisResult.category}
                          </strong>
                        </p>
                      </div>
                    ) : null}

                    <Button variant="outline" onClick={clearSearch} className="mt-4">
                      Upload Different Image
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        {searching ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for matching businesses...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Found {searchResults.length} Similar Businesses
            </h2>
            <div className="space-y-4">
              {searchResults.map((business) => (
                <Card key={business.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/business/${business.id}`}
                            className="font-semibold text-lg hover:text-primary"
                          >
                            {business.name}
                          </Link>
                          <Badge
                            className={`text-xs ${
                              business.matchScore >= 90
                                ? "bg-green-100 text-green-700"
                                : business.matchScore >= 75
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {business.matchScore}% match
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-2">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{business.averageRating}</span>
                          <span className="text-gray-400">({business.reviewCount} reviews)</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            {BUSINESS_CATEGORIES.find((c) => c.value === business.category)?.label}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-2">{business.description}</p>

                        <p className="text-gray-500 text-sm">
                          {business.address}, {business.city}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {business.matchedFeatures.map((feature, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              Matched: {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Link href={`/business/${business.id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : selectedImage && !analyzing ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No Matches Found</h3>
              <p className="text-gray-600">
                We couldn&apos;t find businesses matching your image. Try uploading a different photo.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Tips for Better Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span>📸</span>
                <span>Upload clear, well-lit photos for best results</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🏪</span>
                <span>Photos of storefronts, signage, or interiors work best</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🍽️</span>
                <span>Food photos can help find similar restaurants</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🔍</span>
                <span>Include any visible halal certification or Arabic text</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
