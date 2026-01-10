"use client";

import { useState } from "react";
import { mockLogin } from "@/lib/mock-auth";
import { useMockSession } from "@/components/mock-session-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export default function LoginPage() {
  const router = useRouter();
  const { update } = useMockSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (USE_MOCK_DATA) {
        // Mock mode: direct login
        const user = mockLogin(formData.email, formData.password);

        if (!user) {
          setError("Invalid email or password");
          setLoading(false);
          return;
        }

        // Update session
        update();

        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        // Real mode: API call
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          setError("Invalid email or password");
          setLoading(false);
          return;
        }

        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            {USE_MOCK_DATA && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-2">Demo Accounts:</p>
                <div className="space-y-2 text-xs text-blue-800">
                  <div className="flex items-center justify-between">
                    <span>Consumer:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => setFormData({ email: "consumer@test.com", password: "password123" })}
                    >
                      consumer@test.com
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Business Owner:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => setFormData({ email: "owner@test.com", password: "password123" })}
                    >
                      owner@test.com
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Admin:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => setFormData({ email: "admin@test.com", password: "password123" })}
                    >
                      admin@test.com
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Password: password123</p>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
