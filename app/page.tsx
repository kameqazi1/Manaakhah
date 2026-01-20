"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessMap } from "@/components/map/BusinessMap";
import { PrayerTimeWidget } from "@/components/prayer-times/PrayerTimeWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Users, Sparkles, Calendar, Heart, Building2, Star } from "lucide-react";

// Categories for filtering
const categories = [
  { name: "All", icon: "✨" },
  { name: "Halal Food", icon: "🍽️" },
  { name: "Masjids", icon: "🕌" },
  { name: "Auto Repair", icon: "🔧" },
  { name: "Tutoring", icon: "📚" },
  { name: "Health & Wellness", icon: "⚕️" },
  { name: "Legal Services", icon: "⚖️" },
];


export default function Home() {

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Keep Muslim Money in the Muslim Community
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Discover Muslim-owned businesses, halal services, masjids, and community resources in the Bay Area
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/search">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Search className="w-5 h-5 mr-2" />
                  Find Businesses
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-green-700"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  List Your Business
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Map & Prayer Times Section */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Prayer Times Sidebar */}
            <div className="lg:col-span-1">
              <PrayerTimeWidget />
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold">Businesses Near You</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Explore Muslim-owned businesses in Fremont and surrounding areas
              </p>
              <BusinessMap />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content with Tabs */}
      <main className="container mx-auto px-4 py-12">
        <Tabs defaultValue="businesses" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="businesses" className="data-[state=active]:bg-white">
                <Building2 className="w-4 h-4 mr-2" />
                Businesses
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-white">
                <Calendar className="w-4 h-4 mr-2" />
                Community Events
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Businesses Tab */}
          <TabsContent value="businesses" className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-green-600" />
                <h2 className="text-3xl font-bold">Discover Businesses</h2>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.slice(1).map((category) => (
                  <Link
                    key={category.name}
                    href={`/search?category=${encodeURIComponent(category.name)}`}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Empty State / Call to Action */}
            <Card className="text-center p-12 bg-gradient-to-br from-green-50 to-emerald-50 border-dashed border-2 border-green-200">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Be the First to List Your Business</h3>
                <p className="text-gray-600 mb-6">
                  Help build the Muslim business directory in your area. List your business and connect with the community.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/register">
                    <Button size="lg">
                      <Building2 className="w-4 h-4 mr-2" />
                      List Your Business
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button size="lg" variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Directory
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-green-600" />
                <h2 className="text-3xl font-bold">Community Events</h2>
              </div>
              <p className="text-gray-600">
                Discover and join local events happening in our community
              </p>
            </div>

            {/* Empty State */}
            <Card className="text-center p-12 bg-gradient-to-br from-green-50 to-emerald-50 border-dashed border-2 border-green-200">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">No Events Yet</h3>
                <p className="text-gray-600 mb-6">
                  Community events will appear here. Check back soon for upcoming gatherings, workshops, and celebrations.
                </p>
                <Link href="/events">
                  <Button size="lg" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Browse Events
                  </Button>
                </Link>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Manakhaah?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Trusted Community</h3>
              <p className="text-gray-600">
                All businesses are verified and reviewed by community members
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Halal Verified</h3>
              <p className="text-gray-600">
                Transparent halal status with verification badges
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Support Local</h3>
              <p className="text-gray-600">
                Keep your money circulating within the Muslim community
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-green-100 mb-8 text-lg">
            Join hundreds of Muslims connecting with trusted businesses in the Bay Area
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Create Free Account
              </Button>
            </Link>
            <Link href="/business/register">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-green-700"
              >
                List Your Business
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">Manakhaah</h3>
              <p className="text-gray-400">
                Discover Muslim-owned businesses and connect with your community.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/search" className="hover:text-white">Find Businesses</Link></li>
                <li><Link href="/events" className="hover:text-white">Community Events</Link></li>
                <li><Link href="/business/register" className="hover:text-white">List Your Business</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/prayer-times" className="hover:text-white">Prayer Times</Link></li>
                <li><Link href="/community-impact" className="hover:text-white">Economic Impact</Link></li>
                <li><Link href="/forum" className="hover:text-white">Forum</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms & Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Manakhaah. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
