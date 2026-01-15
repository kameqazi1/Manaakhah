"use client";

import { useState, useEffect } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface VerificationStatus {
  email: { verified: boolean; date?: string };
  phone: { verified: boolean; date?: string };
  identity: { verified: boolean; status: "none" | "pending" | "approved" | "rejected"; date?: string };
  business: { verified: boolean; status: "none" | "pending" | "approved" | "rejected"; date?: string };
}

const STORAGE_KEY = "manakhaah-verification-status";

export default function VerificationPage() {
  const { data: session } = useMockSession();
  const [verification, setVerification] = useState<VerificationStatus>({
    email: { verified: false },
    phone: { verified: false },
    identity: { verified: false, status: "none" },
    business: { verified: false, status: "none" },
  });
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    loadVerificationStatus();
  }, [session?.user?.id]);

  const loadVerificationStatus = () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${session.user.id}`);
      if (stored) {
        setVerification(JSON.parse(stored));
      } else {
        // Set email as verified by default for mock session
        const defaultStatus: VerificationStatus = {
          email: { verified: true, date: new Date().toISOString() },
          phone: { verified: false },
          identity: { verified: false, status: "none" },
          business: { verified: false, status: "none" },
        };
        setVerification(defaultStatus);
        saveVerificationStatus(defaultStatus);
      }
    } catch (error) {
      console.error("Error loading verification status:", error);
    }
    setLoading(false);
  };

  const saveVerificationStatus = (status: VerificationStatus) => {
    if (!session?.user?.id) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}-${session.user.id}`, JSON.stringify(status));
    } catch (error) {
      console.error("Error saving verification status:", error);
    }
  };

  const startVerification = async (type: "phone" | "identity" | "business") => {
    setVerifying(type);

    // Simulate verification process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (type === "phone") {
      // Simulate phone verification
      const newStatus = {
        ...verification,
        phone: { verified: true, date: new Date().toISOString() },
      };
      setVerification(newStatus);
      saveVerificationStatus(newStatus);
    } else {
      // For identity and business, set to pending
      const newStatus = {
        ...verification,
        [type]: { verified: false, status: "pending" as const, date: new Date().toISOString() },
      };
      setVerification(newStatus);
      saveVerificationStatus(newStatus);
    }

    setVerifying(null);
  };

  // Simulate approval for demo
  const simulateApproval = (type: "identity" | "business") => {
    const newStatus = {
      ...verification,
      [type]: { verified: true, status: "approved" as const, date: new Date().toISOString() },
    };
    setVerification(newStatus);
    saveVerificationStatus(newStatus);
  };

  const getVerificationLevel = () => {
    const verified = [
      verification.email.verified,
      verification.phone.verified,
      verification.identity.verified,
      verification.business.verified,
    ].filter(Boolean).length;

    if (verified === 4) return { level: "Platinum", color: "bg-purple-100 text-purple-700", icon: "👑" };
    if (verified >= 3) return { level: "Gold", color: "bg-yellow-100 text-yellow-700", icon: "🥇" };
    if (verified >= 2) return { level: "Silver", color: "bg-gray-100 text-gray-700", icon: "🥈" };
    if (verified >= 1) return { level: "Bronze", color: "bg-orange-100 text-orange-700", icon: "🥉" };
    return { level: "Unverified", color: "bg-gray-100 text-gray-500", icon: "⭕" };
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">
              Please sign in to manage your verification status.
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const level = getVerificationLevel();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <Link href="/dashboard" className="text-primary hover:underline text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Identity Verification</h1>
        <p className="text-gray-600 mb-6">
          Verify your identity to build trust and unlock additional features
        </p>

        {/* Verification Level */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{level.icon}</span>
                <div>
                  <p className="text-sm text-gray-500">Your Verification Level</p>
                  <Badge className={level.color}>{level.level} Verified</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {[verification.email.verified, verification.phone.verified, verification.identity.verified, verification.business.verified].filter(Boolean).length}/4
                </p>
                <p className="text-sm text-gray-500">Verifications Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Verification */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">📧</span>
                <div>
                  <h3 className="font-semibold">Email Verification</h3>
                  <p className="text-sm text-gray-500">Verify your email address</p>
                </div>
              </div>
              {verification.email.verified ? (
                <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
              ) : (
                <Button size="sm">Verify Email</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Phone Verification */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="font-semibold">Phone Verification</h3>
                  <p className="text-sm text-gray-500">Verify your phone number via SMS</p>
                </div>
              </div>
              {verification.phone.verified ? (
                <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => startVerification("phone")}
                  disabled={verifying === "phone"}
                >
                  {verifying === "phone" ? "Verifying..." : "Verify Phone"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Identity Verification */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <span className="text-2xl">🪪</span>
                <div>
                  <h3 className="font-semibold">Identity Verification</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Upload a government ID for manual verification
                  </p>
                  {verification.identity.status === "pending" && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      ⏳ Under Review
                    </Badge>
                  )}
                  {verification.identity.status === "rejected" && (
                    <Badge className="bg-red-100 text-red-700">
                      ✗ Rejected - Please resubmit
                    </Badge>
                  )}
                </div>
              </div>
              {verification.identity.verified ? (
                <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
              ) : verification.identity.status === "pending" ? (
                <div className="text-right">
                  <Button size="sm" variant="outline" onClick={() => simulateApproval("identity")}>
                    (Demo: Approve)
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => startVerification("identity")}
                  disabled={verifying === "identity"}
                >
                  {verifying === "identity" ? "Submitting..." : "Start Verification"}
                </Button>
              )}
            </div>

            {!verification.identity.verified && verification.identity.status !== "pending" && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Accepted documents:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Passport</li>
                  <li>• Driver&apos;s License</li>
                  <li>• State ID</li>
                  <li>• National ID Card</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Verification */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <span className="text-2xl">🏢</span>
                <div>
                  <h3 className="font-semibold">Business Verification</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Verify your business ownership with documentation
                  </p>
                  {verification.business.status === "pending" && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      ⏳ Under Review
                    </Badge>
                  )}
                </div>
              </div>
              {verification.business.verified ? (
                <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
              ) : verification.business.status === "pending" ? (
                <Button size="sm" variant="outline" onClick={() => simulateApproval("business")}>
                  (Demo: Approve)
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => startVerification("business")}
                  disabled={verifying === "business"}
                >
                  {verifying === "business" ? "Submitting..." : "Verify Business"}
                </Button>
              )}
            </div>

            {!verification.business.verified && verification.business.status !== "pending" && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Required documents:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Business License</li>
                  <li>• Tax Registration (EIN/TIN)</li>
                  <li>• Utility Bill or Lease Agreement</li>
                  <li>• Halal Certification (if applicable)</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits of Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <h4 className="font-medium">Verified Badge</h4>
                  <p className="text-sm text-gray-500">
                    Display a verified badge on your profile and reviews
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">⭐</span>
                <div>
                  <h4 className="font-medium">Priority Visibility</h4>
                  <p className="text-sm text-gray-500">
                    Verified businesses appear higher in search results
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <h4 className="font-medium">Trust Score Boost</h4>
                  <p className="text-sm text-gray-500">
                    Higher trust scores lead to more engagement
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">💬</span>
                <div>
                  <h4 className="font-medium">Verified Reviews</h4>
                  <p className="text-sm text-gray-500">
                    Your reviews are marked as from a verified user
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
