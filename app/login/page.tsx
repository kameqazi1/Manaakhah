"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, CheckCircle, Mail, Loader2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for success query params
  const verified = searchParams.get("verified") === "true";
  const reset = searchParams.get("reset") === "true";
  const registered = searchParams.get("registered") === "true";
  const accountLinked = searchParams.get("success") === "account_linked";
  const linkedProvider = searchParams.get("provider");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (!result?.ok || result?.error) {
        if (result?.error === "CredentialsSignin") {
          setError("Invalid email or password");
        } else if (result?.error === "EMAIL_NOT_VERIFIED") {
          setError("Please verify your email before signing in. Check your inbox for the verification link.");
        } else {
          setError(result?.error || "An error occurred. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      window.location.href = "/dashboard";
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
            {verified && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Email verified successfully! Please sign in.
              </div>
            )}

            {reset && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Password reset successfully! Sign in with your new password.
              </div>
            )}

            {registered && (
              <div className="bg-blue-50 text-blue-600 p-3 rounded-md text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Registration successful! Please check your email to verify your account.
              </div>
            )}

            {accountLinked && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Your {linkedProvider} account has been linked successfully! You can now sign in with either method.
              </div>
            )}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription>
                Enter your email and password to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
