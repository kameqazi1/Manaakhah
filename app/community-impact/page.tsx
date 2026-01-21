"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Building2, TrendingUp, Users, DollarSign } from "lucide-react";

export default function CommunityImpactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Economic Impact</h1>
          <p className="text-gray-600 text-lg">
            See how supporting Muslim-owned businesses strengthens our community
          </p>
        </div>

        {/* Empty State */}
        <Card className="text-center p-12 bg-gradient-to-br from-green-50 to-emerald-50 border-dashed border-2 border-green-200 mb-8">
          <div className="max-w-lg mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Impact Data Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              As our community grows, we'll track and display the economic impact of supporting Muslim-owned businesses.
              Be part of building this data by listing your business or supporting local businesses.
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
                  Find Businesses
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* What We'll Track */}
        <h2 className="text-2xl font-bold mb-4 text-center">What We'll Track</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Businesses Listed</h3>
              <p className="text-sm text-gray-600">Total Muslim-owned businesses in our directory</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Community Members</h3>
              <p className="text-sm text-gray-600">Users supporting local businesses</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1">Economic Impact</h3>
              <p className="text-sm text-gray-600">Money kept within our community</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-1">Growth Trends</h3>
              <p className="text-sm text-gray-600">How our community is expanding</p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Be Part of the Impact</h2>
            <p className="text-green-100 mb-6">
              Every purchase at a Muslim-owned business strengthens our community.
              Join us in building a thriving local economy.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/search">
                <Button variant="secondary">Find Businesses</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="text-white border-white hover:bg-white/10">
                  List Your Business
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
