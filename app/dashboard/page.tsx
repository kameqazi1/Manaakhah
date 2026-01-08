"use client";

import { useMockSession } from "@/components/mock-session-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

interface Business {
  id: string;
  name: string;
  category: string;
  status: string;
  address: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useMockSession();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchBusinesses();
    }
  }, [session]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/businesses");
      if (response.ok) {
        const data = await response.json();
        // Filter businesses owned by current user
        const myBusinesses = data.filter(
          (b: any) => b.owner.id === session?.user.id
        );
        setBusinesses(myBusinesses);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "PENDING_REVIEW":
        return "secondary";
      case "DRAFT":
        return "outline";
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {session.user.name}
            </p>
          </div>
          {session.user.role !== "CONSUMER" && (
            <Link href="/dashboard/new-listing">
              <Button>Create New Listing</Button>
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{businesses.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {businesses.filter((b) => b.status === "PUBLISHED").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {businesses.filter((b) => b.status === "PENDING_REVIEW").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Listings</CardTitle>
            <CardDescription>Manage your business listings</CardDescription>
          </CardHeader>
          <CardContent>
            {businesses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  You haven't created any listings yet
                </p>
                {session.user.role !== "CONSUMER" && (
                  <Link href="/dashboard/new-listing">
                    <Button>Create Your First Listing</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{business.name}</h3>
                        <Badge variant={getStatusColor(business.status) as any}>
                          {business.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{business.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {new Date(business.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/business/${business.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/edit/${business.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
