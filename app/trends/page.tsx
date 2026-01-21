"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { TrendingUp, Building2, BarChart3, Search } from "lucide-react";

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Trend Reports</h1>
          <p className="text-gray-600 text-lg">
            Insights and trends from the Muslim business community
          </p>
        </div>

        {/* Empty State */}
        <Card className="text-center p-12 bg-gradient-to-br from-green-50 to-emerald-50 border-dashed border-2 border-green-200 mb-8">
          <div className="max-w-lg mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Trend Data Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              As our community grows, we'll analyze and share trends about Muslim-owned businesses,
              consumer preferences, and growth opportunities. Be part of building this data.
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
                  Find Businesses
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* What We'll Track */}
        <h2 className="text-2xl font-bold mb-4 text-center">Coming Soon</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Industry Trends</h3>
              <p className="text-sm text-gray-600">Growth patterns across business categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Popular Searches</h3>
              <p className="text-sm text-gray-600">What the community is looking for</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1">Market Reports</h3>
              <p className="text-sm text-gray-600">In-depth analysis and insights</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscribe CTA */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
            <p className="text-blue-100 mb-6">
              Subscribe to receive monthly trend reports and industry insights when they become available
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg text-gray-900"
              />
              <Button variant="secondary">Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
