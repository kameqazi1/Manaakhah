"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { BusinessMap } from "@/components/map/BusinessMap";
import { PrayerTimeWidget } from "@/components/prayer-times/PrayerTimeWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Star, Clock, Users, Sparkles, Filter, Calendar, Heart, Building2 } from "lucide-react";

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

// Featured businesses mock data
const featuredBusinesses = [
  {
    id: "1",
    name: "Al-Noor Halal Kitchen",
    category: "Halal Food",
    image: "/placeholder-food.jpg",
    rating: 4.9,
    reviews: 127,
    location: "Fremont, CA",
    description: "Authentic Middle Eastern cuisine with fresh halal ingredients",
    priceRange: "$$",
  },
  {
    id: "2",
    name: "Bay Area Islamic Center",
    category: "Masjids",
    image: "/placeholder-masjid.jpg",
    rating: 4.8,
    reviews: 89,
    location: "San Jose, CA",
    description: "Community masjid with daily prayers and weekend programs",
    priceRange: "Free",
  },
  {
    id: "3",
    name: "Reliable Auto Care",
    category: "Auto Repair",
    image: "/placeholder-auto.jpg",
    rating: 4.7,
    reviews: 64,
    location: "Fremont, CA",
    description: "Trusted Muslim-owned auto repair shop serving the community",
    priceRange: "$$$",
  },
  {
    id: "4",
    name: "Quran Academy",
    category: "Tutoring",
    image: "/placeholder-tutoring.jpg",
    rating: 4.9,
    reviews: 156,
    location: "Union City, CA",
    description: "Professional Quran and Islamic studies tutoring",
    priceRange: "$$",
  },
  {
    id: "5",
    name: "Halal Wellness Clinic",
    category: "Health & Wellness",
    image: "/placeholder-health.jpg",
    rating: 4.6,
    reviews: 42,
    location: "Newark, CA",
    description: "Female-friendly health services in a comfortable environment",
    priceRange: "$$$",
  },
  {
    id: "6",
    name: "Amanah Legal Services",
    category: "Legal Services",
    image: "/placeholder-legal.jpg",
    rating: 4.8,
    reviews: 91,
    location: "Fremont, CA",
    description: "Immigration, family law, and business legal services",
    priceRange: "$$$",
  },
];

// Community events mock data
const communityEvents = [
  {
    id: "1",
    title: "Community Iftar Gathering",
    date: "March 15, 2026",
    time: "6:00 PM - 9:00 PM",
    location: "Central Park Pavilion",
    attendees: 234,
    maxAttendees: 500,
    organizer: "Bay Area Muslim Alliance",
    isFree: true,
    tags: ["Ramadan", "Community", "Family-Friendly"],
  },
  {
    id: "2",
    title: "Youth Career Fair",
    date: "March 20, 2026",
    time: "10:00 AM - 4:00 PM",
    location: "Islamic Center of Fremont",
    attendees: 87,
    maxAttendees: 150,
    organizer: "Muslim Youth Association",
    isFree: true,
    tags: ["Youth", "Career", "Networking"],
  },
  {
    id: "3",
    title: "Sisters Wellness Workshop",
    date: "March 22, 2026",
    time: "2:00 PM - 5:00 PM",
    location: "Fremont Community Center",
    attendees: 42,
    maxAttendees: 60,
    organizer: "Muslimah Support Group",
    isFree: false,
    tags: ["Sisters", "Wellness", "Workshop"],
  },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredBusinesses = featuredBusinesses.filter(
    (business) => selectedCategory === "All" || business.category === selectedCategory
  );

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
                <h2 className="text-3xl font-bold">Featured Businesses</h2>
              </div>

              {/* Category Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-sm">Filter:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category.name
                          ? "bg-green-600 text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:border-green-300"
                      }`}
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Business Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business) => (
                <Link href={`/business/${business.id}`} key={business.id}>
                  <Card className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-green-100 to-emerald-50">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl">{categories.find(c => c.name === business.category)?.icon || "🏪"}</span>
                      </div>
                      <span className="absolute top-3 left-3 bg-white text-gray-900 px-2 py-1 rounded-full text-xs font-medium">
                        {business.category}
                      </span>
                      <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg leading-tight">
                          {business.name}
                        </h3>
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
                          <span className="text-sm font-medium">{business.rating}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{business.description}</p>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{business.location}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {business.reviews} reviews
                      </span>
                      <span className="text-green-600 font-medium">
                        {business.priceRange}
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center pt-8">
              <Link href="/search">
                <Button size="lg">
                  View All Businesses
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-green-600" />
                <h2 className="text-3xl font-bold">Upcoming Community Events</h2>
              </div>
              <p className="text-gray-600">
                Discover and join local events happening in our community
              </p>
            </div>

            {/* Event Cards */}
            <div className="space-y-6">
              {communityEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    {/* Event Image/Icon */}
                    <div className="md:w-64 bg-gradient-to-br from-green-100 to-emerald-50 p-8 flex items-center justify-center">
                      <div className="text-center">
                        <Calendar className="w-12 h-12 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-700">{event.date}</p>
                      </div>
                    </div>

                    {/* Event Details */}
                    <CardContent className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
                          <p className="text-sm text-gray-500">by {event.organizer}</p>
                        </div>
                        {event.isFree ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            Free
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            Ticketed
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{event.attendees}/{event.maxAttendees} attending</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {event.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Button>Register Now</Button>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center pt-8">
              <Link href="/events">
                <Button size="lg">
                  View All Events
                </Button>
              </Link>
            </div>
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
