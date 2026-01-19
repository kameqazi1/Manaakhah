"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { mockRegister, mockLogin } from "@/lib/mock-auth";
import { useMockSession } from "@/components/mock-session-provider";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export default function RegisterPage() {
  const router = useRouter();
  const { update } = useMockSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "CONSUMER" as "CONSUMER" | "BUSINESS_OWNER",
  });

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast({ ...toast, visible: false });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (USE_MOCK_DATA) {
        // Mock mode: register client-side to use same storage as login
        try {
          const user = mockRegister({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            phone: formData.phone || undefined,
            role: formData.role,
          });

          // Auto-login after registration
          const loginResult = mockLogin(formData.email, formData.password);

          if ('user' in loginResult) {
            // Update session provider
            update();

            // Show welcome toast and redirect
            setToast({
              message: `Welcome, ${user.name}!`,
              visible: true,
            });

            // Redirect to home after a brief delay to show toast
            setTimeout(() => {
              router.push("/");
            }, 500);
          }
        } catch (err) {
          if (err instanceof Error && err.message === "User already exists") {
            setError("An account with this email already exists");
          } else {
            setError("Registration failed. Please try again.");
          }
        }
      } else {
        // Production mode: use API
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Registration failed");
          return;
        }

        router.push("/login?registered=true");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      {/* Welcome Toast */}
      {toast.visible && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Join Manakhaah to connect with Muslim businesses
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

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
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "CONSUMER" | "BUSINESS_OWNER",
                  })
                }
              >
                <option value="CONSUMER">Consumer</option>
                <option value="BUSINESS_OWNER">Business Owner</option>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
