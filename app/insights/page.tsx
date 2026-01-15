"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface SpendingCategory {
  category: string;
  amount: number;
  transactions: number;
  change: number; // percentage change from last period
}

interface MonthlySpending {
  month: string;
  total: number;
  categories: SpendingCategory[];
}

interface ConsumerInsights {
  totalSpent: number;
  totalTransactions: number;
  averagePerTransaction: number;
  topCategories: SpendingCategory[];
  monthlyTrend: MonthlySpending[];
  savingsFromDeals: number;
  carbonOffset: number; // Community impact metric
  localBusinessesSupported: number;
}

// Mock data generator
function generateMockInsights(): ConsumerInsights {
  const categories: SpendingCategory[] = [
    { category: "Restaurants", amount: 450, transactions: 12, change: 15 },
    { category: "Grocery", amount: 380, transactions: 8, change: -5 },
    { category: "Services", amount: 250, transactions: 4, change: 20 },
    { category: "Halal Meat", amount: 180, transactions: 6, change: 10 },
    { category: "Bakery", amount: 95, transactions: 5, change: -10 },
  ];

  const months = ["Sep", "Oct", "Nov", "Dec", "Jan"];
  const monthlyTrend: MonthlySpending[] = months.map((month, i) => ({
    month,
    total: 1000 + Math.random() * 500 + i * 100,
    categories: categories.map((c) => ({
      ...c,
      amount: c.amount * (0.8 + Math.random() * 0.4),
    })),
  }));

  return {
    totalSpent: 2847,
    totalTransactions: 35,
    averagePerTransaction: 81.34,
    topCategories: categories,
    monthlyTrend,
    savingsFromDeals: 156,
    carbonOffset: 12.5,
    localBusinessesSupported: 18,
  };
}

export default function InsightsPage() {
  const { data: session } = useMockSession();
  const [insights, setInsights] = useState<ConsumerInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "1y">("90d");

  useEffect(() => {
    loadInsights();
  }, [timeRange]);

  const loadInsights = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setInsights(generateMockInsights());
    setLoading(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your insights...</p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const maxCategoryAmount = Math.max(...insights.topCategories.map((c) => c.amount));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Spending Insights</h1>
            <p className="text-gray-600 mt-1">
              Track your spending with Muslim-owned businesses
            </p>
          </div>
          <div className="flex gap-2">
            {(["30d", "90d", "1y"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-green-600">
                ${insights.totalSpent.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">
                {timeRange === "30d" ? "Last 30 days" : timeRange === "90d" ? "Last 90 days" : "Last year"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold">{insights.totalTransactions}</p>
              <p className="text-xs text-gray-400">
                Avg ${insights.averagePerTransaction.toFixed(2)} each
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Savings from Deals</p>
              <p className="text-2xl font-bold text-blue-600">
                ${insights.savingsFromDeals}
              </p>
              <p className="text-xs text-gray-400">From special offers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Businesses Supported</p>
              <p className="text-2xl font-bold text-purple-600">
                {insights.localBusinessesSupported}
              </p>
              <p className="text-xs text-gray-400">Local Muslim-owned</p>
            </CardContent>
          </Card>
        </div>

        {/* Spending by Category */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.topCategories.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {category.transactions} transactions
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">${category.amount}</span>
                      <span
                        className={`text-xs ${
                          category.change >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {category.change >= 0 ? "↑" : "↓"} {Math.abs(category.change)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(category.amount / maxCategoryAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-around gap-2">
              {insights.monthlyTrend.map((month, i) => {
                const maxTotal = Math.max(...insights.monthlyTrend.map((m) => m.total));
                const height = (month.total / maxTotal) * 100;
                return (
                  <div key={month.month} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        i === insights.monthlyTrend.length - 1
                          ? "bg-green-500"
                          : "bg-green-200"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <p className="text-xs text-gray-500 mt-2">{month.month}</p>
                    <p className="text-xs font-medium">${Math.round(month.total)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Community Impact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Community Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🏪</div>
                <p className="text-2xl font-bold text-green-600">
                  {insights.localBusinessesSupported}
                </p>
                <p className="text-sm text-gray-500">Local businesses supported</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">💚</div>
                <p className="text-2xl font-bold text-green-600">
                  ${Math.round(insights.totalSpent * 0.15)}
                </p>
                <p className="text-sm text-gray-500">Estimated local economic impact</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🌱</div>
                <p className="text-2xl font-bold text-green-600">
                  {insights.carbonOffset} kg
                </p>
                <p className="text-sm text-gray-500">CO2 offset by shopping local</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Personalized Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-xl">💡</span>
                <div>
                  <p className="font-medium">Restaurant spending is up 15%</p>
                  <p className="text-sm text-gray-600">
                    Consider trying new halal restaurants to diversify your dining experiences.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-xl">🎉</span>
                <div>
                  <p className="font-medium">You've saved ${insights.savingsFromDeals} with deals!</p>
                  <p className="text-sm text-gray-600">
                    <Link href="/deals" className="text-primary hover:underline">
                      Check out more deals
                    </Link>{" "}
                    from your favorite businesses.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="font-medium">Top supporter badge unlocked!</p>
                  <p className="text-sm text-gray-600">
                    You're in the top 10% of community supporters this month.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
