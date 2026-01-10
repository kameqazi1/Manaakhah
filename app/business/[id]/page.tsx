"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_TAGS } from "@/lib/constants";
import { ReviewSection } from "@/components/reviews/ReviewSection";

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  website?: string;
  hours?: any;
  services: string[];
  averageRating: number;
  reviewCount: number;
  tags: { tag: string }[];
  photos: { url: string }[];
  owner: {
    id: string;
    name: string;
    phone: string;
  };
  reviews: any[];
  events: any[];
}

export default function BusinessDetailPage() {
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchBusiness();
    }
  }, [params.id]);

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/businesses/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setBusiness(data);
      }
    } catch (error) {
      console.error("Error fetching business:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Business not found</h1>
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="h-64 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
        <span className="text-6xl">
          {business.category === "MASJID" ? "🕌" : "🏪"}
        </span>
      </div>

      <div className="container mx-auto max-w-6xl px-4 -mt-8">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{business.name}</h1>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {business.averageRating > 0 && (
                    <div className="flex items-center">
                      <span className="text-yellow-500 text-xl">★</span>
                      <span className="ml-1 font-semibold">
                        {business.averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({business.reviewCount} reviews)
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag) => {
                      const tagInfo = BUSINESS_TAGS.find((t) => t.value === tag.tag);
                      return (
                        <Badge key={tag.tag} variant="secondary">
                          {tagInfo?.icon} {tagInfo?.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{business.description}</p>
              </div>

              <div className="flex flex-col gap-2 md:min-w-[200px]">
                <a href={`tel:${business.phone}`}>
                  <Button className="w-full">Call Now</Button>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    business.address + ", " + business.city
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    Get Directions
                  </Button>
                </a>
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      Visit Website
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Services */}
            {business.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-2 gap-2">
                    {business.services.map((service, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <span className="mr-2 text-green-600">✓</span>
                        {service}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <ReviewSection
              businessId={business.id}
              businessOwnerId={business.owner.id}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold mb-1">Address</p>
                  <p className="text-gray-600">
                    {business.address}
                    <br />
                    {business.city}, {business.state} {business.zipCode}
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Phone</p>
                  <a
                    href={`tel:${business.phone}`}
                    className="text-primary hover:underline"
                  >
                    {business.phone}
                  </a>
                </div>

                {business.email && (
                  <div>
                    <p className="font-semibold mb-1">Email</p>
                    <a
                      href={`mailto:${business.email}`}
                      className="text-primary hover:underline"
                    >
                      {business.email}
                    </a>
                  </div>
                )}

                {business.website && (
                  <div>
                    <p className="font-semibold mb-1">Website</p>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hours */}
            {business.hours && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Hours</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-gray-600">Hours information coming soon</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
