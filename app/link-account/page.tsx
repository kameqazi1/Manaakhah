"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, Loader2 } from "lucide-react";

function LinkAccountContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const provider = searchParams.get("provider");
  const error = searchParams.get("error");

  const providerName = provider
    ? provider.charAt(0).toUpperCase() + provider.slice(1)
    : "OAuth";

  const errorMessages: Record<string, string> = {
    missing_token: "The verification link is invalid.",
    invalid_token: "The verification link is invalid or has already been used.",
    expired_token: "The verification link has expired. Please try signing in again.",
    server_error: "Something went wrong. Please try again.",
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">Link Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-red-600 mb-6">
              {errorMessages[error] || "An unknown error occurred."}
            </p>
            <Link href="/login">
              <Button variant="default">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            An account with <strong className="text-gray-900">{email}</strong> already exists.
          </p>
          <p className="text-gray-600">
            We've sent a verification email to confirm you want to link your{" "}
            <strong className="text-gray-900">{providerName}</strong> account. Click the link in the email
            to complete the process.
          </p>
          <p className="text-sm text-gray-500">
            The link will expire in 24 hours.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button variant="outline">Back to Login</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LinkAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="max-w-md w-full">
            <CardContent className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="mt-4 text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LinkAccountContent />
    </Suspense>
  );
}
