"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";

type ResetStatus = "validating" | "valid" | "invalid" | "resetting" | "signing-in" | "success" | "error";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<ResetStatus>("validating");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Handle auto sign-in after successful password reset
  const handleResetSuccess = async (userEmail: string, newPassword: string) => {
    setStatus("signing-in");
    setSuccessMessage("Password reset! Signing you in...");

    try {
      const result = await signIn("credentials", {
        email: userEmail,
        password: newPassword,
        redirect: false,
      });

      if (result?.ok) {
        // Success! Redirect to home
        router.push("/");
        return;
      }
    } catch (error) {
      console.error("Auto sign-in failed:", error);
    }

    // Fallback: redirect to login
    setStatus("success");
    setSuccessMessage("Password reset successfully!");
    setTimeout(() => {
      router.push("/login?reset=true");
    }, 2000);
  };

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("Missing reset token. Please request a new password reset link.");
      return;
    }

    async function validateToken() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await res.json();

        if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
          setErrorMessage(data.error || "This reset link is invalid or has expired.");
        }
      } catch (err) {
        setStatus("invalid");
        setErrorMessage("An error occurred while validating the reset link.");
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Client-side validation
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    setStatus("resetting");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Auto sign-in with the new password
        await handleResetSuccess(data.email, password);
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMessage(data.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          {status === "valid" && (
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "validating" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-gray-600">Validating reset link...</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <XCircle className="h-12 w-12 text-red-600" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-red-600">Invalid reset link</p>
                <p className="text-gray-600">{errorMessage}</p>
              </div>
              <Link href="/forgot-password">
                <Button variant="outline" className="mt-4">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Request a new reset link
                </Button>
              </Link>
            </div>
          )}

          {(status === "valid" || status === "resetting") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {validationError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {validationError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pr-10"
                    disabled={status === "resetting"}
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
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                    disabled={status === "resetting"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={status === "resetting"}>
                {status === "resetting" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}

          {(status === "success" || status === "signing-in") && (
            <div className="flex flex-col items-center py-8 space-y-4">
              {status === "signing-in" ? (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              ) : (
                <CheckCircle className="h-12 w-12 text-green-600" />
              )}
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-green-600">
                  {successMessage || "Password reset successfully!"}
                </p>
                <p className="text-gray-600">
                  {status === "signing-in" ? "Please wait..." : "Redirecting to login..."}
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <XCircle className="h-12 w-12 text-red-600" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-red-600">Reset failed</p>
                <p className="text-gray-600">{errorMessage}</p>
              </div>
              <Link href="/forgot-password">
                <Button variant="outline" className="mt-4">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Request a new reset link
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
