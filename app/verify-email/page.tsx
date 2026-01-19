"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

type VerificationStatus = "loading" | "success" | "error" | "resend-form" | "resend-sent";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing verification token. Please check your email for the correct link.");
      return;
    }

    async function verifyEmail() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setStatus("success");
          // Redirect to login after 2 seconds
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 2000);
        } else {
          const data = await res.json();
          setStatus("error");
          setErrorMessage(data.error || "Verification failed. The link may have expired.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("An error occurred during verification. Please try again.");
      }
    }

    verifyEmail();
  }, [token, router]);

  const handleResendRequest = () => {
    setStatus("resend-form");
  };

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Always show success to prevent email enumeration
      setStatus("resend-sent");
    } catch (err) {
      setStatus("resend-sent");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-green-600">Email verified successfully!</p>
                <p className="text-gray-600">Redirecting to login...</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <XCircle className="h-12 w-12 text-red-600" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-red-600">Verification failed</p>
                <p className="text-gray-600">{errorMessage}</p>
              </div>
              <Button onClick={handleResendRequest} variant="outline" className="mt-4">
                <Mail className="h-4 w-4 mr-2" />
                Request new verification link
              </Button>
              <Link
                href="/login"
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </Link>
            </div>
          )}

          {status === "resend-form" && (
            <form onSubmit={handleResendSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-gray-600">Enter your email address to receive a new verification link.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={resendLoading}>
                {resendLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send verification link"
                )}
              </Button>
              <button
                type="button"
                onClick={() => setStatus("error")}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </form>
          )}

          {status === "resend-sent" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <Mail className="h-12 w-12 text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Check your email</p>
                <p className="text-gray-600">
                  If an account exists with this email, we&apos;ve sent a new verification link.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Don&apos;t forget to check your spam folder.
                </p>
              </div>
              <Link
                href="/login"
                className="text-primary font-medium hover:underline mt-4"
              >
                Back to login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
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
      <VerifyEmailContent />
    </Suspense>
  );
}
