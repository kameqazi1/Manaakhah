"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessMap } from "@/components/map/BusinessMap";
import { PrayerTimeWidget } from "@/components/prayer-times/PrayerTimeWidget";

const categories = [
  { name: "Halal Food", icon: "🍽️", count: "0" },
  { name: "Masjids", icon: "🕌", count: "0" },
  { name: "Auto Repair", icon: "🔧", count: "0" },
  { name: "Tutoring", icon: "📚", count: "0" },
  { name: "Health & Wellness", icon: "⚕️", count: "0" },
  { name: "Legal Services", icon: "⚖️", count: "0" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Keep Muslim Money in the Muslim Community
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover Muslim-owned businesses, halal services, masjids, and community aid resources in the Bay Area
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" className="w-full sm:w-auto">
                Find Services
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                List Your Business
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Prayer Times Sidebar */}
            <div className="lg:col-span-1">
              <PrayerTimeWidget />
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <h2 className="text-3xl font-bold mb-4">
                Businesses Near You
              </h2>
              <p className="text-gray-600 mb-6">
                Explore Muslim-owned businesses in Fremont and surrounding areas
              </p>
              <BusinessMap />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link href={`/search?category=${category.name}`} key={category.name}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-2">{category.icon}</div>
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{category.count} listings</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Manakhaah?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Trusted Community</CardTitle>
                <CardDescription>
                  All businesses are verified and reviewed by community members
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Halal Verified</CardTitle>
                <CardDescription>
                  Transparent halal status with verification badges
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Support Local</CardTitle>
                <CardDescription>
                  Keep your money circulating within the Muslim community
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">
            Join hundreds of Muslims connecting with trusted businesses in the Bay Area
          </p>
          <Link href="/register">
            <Button size="lg">Create Free Account</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
