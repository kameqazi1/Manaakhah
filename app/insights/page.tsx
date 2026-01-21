"use client";

import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { BarChart3, Building2, TrendingUp, DollarSign } from "lucide-react";

export default function InsightsPage() {
  const { data: session } = useMockSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">
              Please sign in to view your spending insights.
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Spending Insights</h1>
          <p className="text-gray-600 mt-1">
            Track your spending with Muslim-owned businesses
          </p>
        </div>

        {/* Empty State */}
        <Card className="text-center p-12 bg-gradient-to-br from-green-50 to-emerald-50 border-dashed border-2 border-green-200 mb-8">
          <div className="max-w-lg mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No Spending Data Yet</h3>
            <p className="text-gray-600 mb-6">
              As you visit and support Muslim-owned businesses, your spending insights will appear here.
              Start by exploring businesses in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search">
                <Button size="lg">
                  <Building2 className="w-4 h-4 mr-2" />
                  Find Businesses
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* What We'll Track */}
        <h2 className="text-2xl font-bold mb-4 text-center">What You'll See</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Spending Summary</h3>
              <p className="text-sm text-gray-600">Track how much you've spent supporting local businesses</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Category Breakdown</h3>
              <p className="text-sm text-gray-600">See spending by category like restaurants, groceries, services</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1">Community Impact</h3>
              <p className="text-sm text-gray-600">Understand your impact on the local Muslim economy</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
