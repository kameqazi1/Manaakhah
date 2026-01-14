"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface ClaimRequest {
  id: string;
  businessId: string;
  businessName: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  verificationMethod: string;
  verificationCode?: string;
  documents?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

const VERIFICATION_METHODS = [
  {
    id: "phone",
    label: "Phone Verification",
    description: "We'll call the business phone number on file to verify your ownership",
    icon: "📞",
  },
  {
    id: "email",
    label: "Email Verification",
    description: "We'll send a verification code to the business email on file",
    icon: "✉️",
  },
  {
    id: "document",
    label: "Document Upload",
    description: "Upload business documents (license, utility bill, tax documents)",
    icon: "📄",
  },
  {
    id: "google",
    label: "Google Business Profile",
    description: "Verify using your Google Business Profile access",
    icon: "🔗",
  },
];

export default function ClaimBusinessPage() {
  const { data: session } = useMockSession();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("business");

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [verificationMethod, setVerificationMethod] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [myClaims, setMyClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadMyClaims();
    }
    if (businessId) {
      fetchBusiness(businessId);
    }
  }, [session?.user?.id, businessId]);

  const loadMyClaims = () => {
    const savedClaims = localStorage.getItem("businessClaims");
    if (savedClaims) {
      try {
        const allClaims = JSON.parse(savedClaims);
        const userClaims = allClaims.filter((c: ClaimRequest) => c.userId === session?.user?.id);
        setMyClaims(userClaims);
      } catch {
        setMyClaims([]);
      }
    }
  };

  const fetchBusiness = async (id: string) => {
    try {
      const response = await fetch(`/api/businesses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedBusiness(data);
        setStep(2);
      }
    } catch (error) {
      console.error("Error fetching business:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/businesses?search=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.businesses || []);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = (business: any) => {
    setSelectedBusiness(business);
    setStep(2);
  };

  const handleSendCode = () => {
    // Simulate sending verification code
    setCodeSent(true);
    alert(`A verification code has been sent via ${verificationMethod}. (Demo: Use code 123456)`);
  };

  const handleSubmitClaim = () => {
    if (!selectedBusiness || !verificationMethod) return;

    // Validate verification code for phone/email methods
    if ((verificationMethod === "phone" || verificationMethod === "email") && verificationCode !== "123456") {
      alert("Invalid verification code. Please try again. (Demo: Use code 123456)");
      return;
    }

    const newClaim: ClaimRequest = {
      id: Date.now().toString(),
      businessId: selectedBusiness.id,
      businessName: selectedBusiness.name,
      userId: session?.user?.id || "",
      userName: session?.user?.name || "",
      userEmail: session?.user?.email || "",
      status: "pending",
      verificationMethod,
      verificationCode: verificationCode || undefined,
      notes: additionalInfo || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedClaims = localStorage.getItem("businessClaims");
    const allClaims = savedClaims ? JSON.parse(savedClaims) : [];
    allClaims.push(newClaim);
    localStorage.setItem("businessClaims", JSON.stringify(allClaims));

    setMyClaims([...myClaims, newClaim]);
    setSubmitted(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "under_review":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Claim Your Business</h2>
            <p className="text-gray-600 mb-4">
              Please sign in to claim your business listing.
            </p>
            <Link href="/auth/signin">
              <Button>Sign In to Continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <span className="text-6xl block mb-4">✅</span>
            <h2 className="text-2xl font-bold mb-2">Claim Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for submitting your claim for <strong>{selectedBusiness?.name}</strong>.
              We'll review your request and get back to you within 2-3 business days.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={() => {
                setSubmitted(false);
                setStep(1);
                setSelectedBusiness(null);
                setVerificationMethod("");
                setVerificationCode("");
                setCodeSent(false);
                setAdditionalInfo("");
              }}>
                Claim Another Business
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Claim Your Business</h1>
        <p className="text-gray-600">
          Verify ownership of your business to manage your listing, respond to reviews, and access analytics.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 1 ? "bg-green-600 text-white" : "bg-gray-200"
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? "bg-green-600" : "bg-gray-200"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 2 ? "bg-green-600 text-white" : "bg-gray-200"
          }`}>
            2
          </div>
          <div className={`w-16 h-1 ${step >= 3 ? "bg-green-600" : "bg-gray-200"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 3 ? "bg-green-600 text-white" : "bg-gray-200"
          }`}>
            3
          </div>
        </div>
      </div>

      {/* Step 1: Find Business */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Find Your Business</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search by business name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm text-gray-500">{searchResults.length} businesses found</p>
                {searchResults.map((business) => (
                  <div
                    key={business.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectBusiness(business)}
                  >
                    <div>
                      <p className="font-semibold">{business.name}</p>
                      <p className="text-sm text-gray-500">
                        {business.address}, {business.city}
                      </p>
                    </div>
                    <Button size="sm">Select</Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Can't find your business?</strong>{" "}
                <Link href="/business/register" className="text-green-600 hover:underline">
                  Add it to Manaakhah
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose Verification Method */}
      {step === 2 && selectedBusiness && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Verify Your Ownership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Claiming:</p>
              <p className="font-semibold text-lg">{selectedBusiness.name}</p>
              <p className="text-sm text-gray-500">{selectedBusiness.address}, {selectedBusiness.city}</p>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-green-600"
                onClick={() => {
                  setStep(1);
                  setSelectedBusiness(null);
                }}
              >
                Change
              </Button>
            </div>

            <p className="text-gray-600 mb-4">
              Choose how you'd like to verify your ownership:
            </p>

            <div className="space-y-3">
              {VERIFICATION_METHODS.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    verificationMethod === method.id
                      ? "border-green-500 bg-green-50"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setVerificationMethod(method.id);
                    setCodeSent(false);
                    setVerificationCode("");
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-semibold">{method.label}</p>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                    <div className="ml-auto">
                      <input
                        type="radio"
                        name="verification"
                        checked={verificationMethod === method.id}
                        onChange={() => setVerificationMethod(method.id)}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {verificationMethod && (
              <div className="mt-6">
                <Button
                  className="w-full"
                  onClick={() => setStep(3)}
                >
                  Continue with {VERIFICATION_METHODS.find((m) => m.id === verificationMethod)?.label}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Complete Verification */}
      {step === 3 && selectedBusiness && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Complete Verification</CardTitle>
          </CardHeader>
          <CardContent>
            {(verificationMethod === "phone" || verificationMethod === "email") && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  {verificationMethod === "phone"
                    ? `We'll call the phone number ending in ${selectedBusiness.phone?.slice(-4) || "****"} with a verification code.`
                    : `We'll send a code to the email associated with this business.`}
                </p>

                {!codeSent ? (
                  <Button onClick={handleSendCode}>
                    {verificationMethod === "phone" ? "Request Call" : "Send Code"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-green-600 text-sm">
                      {verificationMethod === "phone"
                        ? "We're calling you now. Please enter the code you hear."
                        : "Code sent! Please check your email."}
                    </p>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Enter Verification Code
                      </label>
                      <Input
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {verificationMethod === "document" && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Please upload one of the following documents to verify your ownership:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Business license or registration</li>
                  <li>Utility bill showing business name and address</li>
                  <li>Tax documents (EIN letter, tax return)</li>
                  <li>Lease agreement</li>
                </ul>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <span className="text-4xl block mb-2">📄</span>
                  <p className="text-gray-600 mb-2">Drag and drop files here, or</p>
                  <Button variant="outline">Browse Files</Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Max file size: 10MB. Supported formats: PDF, JPG, PNG
                  </p>
                </div>
              </div>
            )}

            {verificationMethod === "google" && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  If you have access to this business's Google Business Profile, we can verify your ownership instantly.
                </p>
                <Button className="w-full" variant="outline">
                  Connect with Google Business
                </Button>
              </div>
            )}

            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">
                Additional Information (Optional)
              </label>
              <Textarea
                placeholder="Any additional details that might help us verify your ownership..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
              />
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmitClaim}
                className="flex-1"
                disabled={
                  (verificationMethod === "phone" || verificationMethod === "email") &&
                  (!codeSent || !verificationCode)
                }
              >
                Submit Claim
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Claims */}
      {myClaims.length > 0 && step === 1 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>My Claim Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myClaims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{claim.businessName}</p>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                    {claim.status.replace("_", " ").charAt(0).toUpperCase() + claim.status.replace("_", " ").slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
