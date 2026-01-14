"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_TAGS, HALAL_CERTIFICATION_LEVELS, REPORT_REASONS, DEAL_TYPES } from "@/lib/constants";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { useMockSession } from "@/components/mock-session-provider";

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  website?: string;
  hours?: any;
  services: string[];
  averageRating: number;
  reviewCount: number;
  tags: { tag: string }[];
  photos: { url: string }[];
  halalCertification?: string;
  priceRange?: string;
  owner: {
    id: string;
    name: string;
    phone: string;
  };
  reviews: any[];
  events: any[];
  deals?: Deal[];
}

interface Deal {
  id: string;
  title: string;
  description: string;
  dealType: string;
  discountValue: number;
  code?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface QAItem {
  id: string;
  question: string;
  answer?: string;
  askedBy: string;
  askedAt: string;
  answeredBy?: string;
  answeredAt?: string;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const { data: session } = useMockSession();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // Favorites & Follow
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Q&A
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState("");

  // Quote Request
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  // Report
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Share
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchBusiness();
      loadLocalData();
    }
  }, [params.id]);

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/businesses/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setBusiness(data);

        // Add to recently viewed
        addToRecentlyViewed(data);
      }
    } catch (error) {
      console.error("Error fetching business:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalData = () => {
    // Load favorites
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setIsFavorite(favorites.includes(params.id));

    // Load following
    const following = JSON.parse(localStorage.getItem("following") || "[]");
    setIsFollowing(following.includes(params.id));

    // Load Q&A
    const allQA = JSON.parse(localStorage.getItem("businessQA") || "{}");
    setQaItems(allQA[params.id as string] || []);
  };

  const addToRecentlyViewed = (business: Business) => {
    const recent = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    const filtered = recent.filter((b: any) => b.id !== business.id);
    const updated = [
      {
        id: business.id,
        name: business.name,
        category: business.category,
        city: business.city,
        averageRating: business.averageRating,
        viewedAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, 20);
    localStorage.setItem("recentlyViewed", JSON.stringify(updated));
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    let updated;
    if (isFavorite) {
      updated = favorites.filter((id: string) => id !== params.id);
    } else {
      updated = [...favorites, params.id];
    }
    localStorage.setItem("favorites", JSON.stringify(updated));
    setIsFavorite(!isFavorite);
  };

  const toggleFollow = () => {
    const following = JSON.parse(localStorage.getItem("following") || "[]");
    let updated;
    if (isFollowing) {
      updated = following.filter((id: string) => id !== params.id);
    } else {
      updated = [...following, params.id];
    }
    localStorage.setItem("following", JSON.stringify(updated));
    setIsFollowing(!isFollowing);
  };

  const handleAskQuestion = () => {
    if (!newQuestion.trim()) return;

    const newQA: QAItem = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      askedBy: session?.user?.name || "Anonymous",
      askedAt: new Date().toISOString(),
    };

    const allQA = JSON.parse(localStorage.getItem("businessQA") || "{}");
    const businessQA = allQA[params.id as string] || [];
    allQA[params.id as string] = [newQA, ...businessQA];
    localStorage.setItem("businessQA", JSON.stringify(allQA));

    setQaItems([newQA, ...qaItems]);
    setNewQuestion("");
    setShowAskQuestion(false);
  };

  const handleAnswerQuestion = (qaId: string) => {
    if (!newAnswer.trim()) return;

    const updatedQA = qaItems.map((qa) =>
      qa.id === qaId
        ? {
            ...qa,
            answer: newAnswer.trim(),
            answeredBy: session?.user?.name || business?.owner.name || "Business Owner",
            answeredAt: new Date().toISOString(),
          }
        : qa
    );

    const allQA = JSON.parse(localStorage.getItem("businessQA") || "{}");
    allQA[params.id as string] = updatedQA;
    localStorage.setItem("businessQA", JSON.stringify(allQA));

    setQaItems(updatedQA);
    setNewAnswer("");
    setAnsweringId(null);
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API
    console.log("Quote request:", quoteForm);
    setQuoteSubmitted(true);
    setTimeout(() => {
      setShowQuoteModal(false);
      setQuoteSubmitted(false);
      setQuoteForm({ name: "", email: "", phone: "", service: "", message: "" });
    }, 2000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API
    console.log("Report:", { reason: reportReason, details: reportDetails });
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportReason("");
      setReportDetails("");
    }, 2000);
  };

  const handleShare = async (method: string) => {
    const url = window.location.href;
    const text = `Check out ${business?.name} on Manaakhah!`;

    switch (method) {
      case "copy":
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`);
        break;
    }
    setShowShareMenu(false);
  };

  const getCertificationInfo = (level: string) => {
    return HALAL_CERTIFICATION_LEVELS.find((c) => c.value === level);
  };

  const getDealTypeInfo = (type: string) => {
    return DEAL_TYPES.find((d) => d.value === type);
  };

  const isOwner = session?.user?.id === business?.owner.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Business not found</h1>
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const certInfo = business.halalCertification ? getCertificationInfo(business.halalCertification) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="h-64 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
        <span className="text-6xl">
          {business.category === "MASJID" ? "🕌" : "🏪"}
        </span>

        {/* Action buttons in hero */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFavorite}
            className={isFavorite ? "bg-red-100 text-red-600" : ""}
          >
            {isFavorite ? "❤️ Saved" : "🤍 Save"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFollow}
            className={isFollowing ? "bg-blue-100 text-blue-600" : ""}
          >
            {isFollowing ? "✓ Following" : "+ Follow"}
          </Button>
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              Share
            </Button>
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => handleShare("copy")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  {copied ? "✓ Copied!" : "📋 Copy Link"}
                </button>
                <button
                  onClick={() => handleShare("whatsapp")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  💬 WhatsApp
                </button>
                <button
                  onClick={() => handleShare("twitter")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  🐦 Twitter
                </button>
                <button
                  onClick={() => handleShare("facebook")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  📘 Facebook
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 -mt-8">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{business.name}</h1>
                  {certInfo && (
                    <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                      <span>{certInfo.icon}</span>
                      <span>{certInfo.label}</span>
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {business.averageRating > 0 && (
                    <div className="flex items-center">
                      <span className="text-yellow-500 text-xl">★</span>
                      <span className="ml-1 font-semibold">
                        {business.averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({business.reviewCount} reviews)
                      </span>
                    </div>
                  )}

                  {business.priceRange && (
                    <Badge variant="outline">{business.priceRange}</Badge>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag) => {
                      const tagInfo = BUSINESS_TAGS.find((t) => t.value === tag.tag);
                      return (
                        <Badge key={tag.tag} variant="secondary">
                          {tagInfo?.icon} {tagInfo?.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{business.description}</p>
              </div>

              <div className="flex flex-col gap-2 md:min-w-[200px]">
                <a href={`tel:${business.phone}`}>
                  <Button className="w-full">Call Now</Button>
                </a>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowQuoteModal(true)}
                >
                  Request Quote
                </Button>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    business.address + ", " + business.city
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    Get Directions
                  </Button>
                </a>
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      Visit Website
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Deals Section */}
        {business.deals && business.deals.length > 0 && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                🏷️ Current Deals & Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {business.deals.filter(d => d.isActive).map((deal) => {
                  const dealType = getDealTypeInfo(deal.dealType);
                  return (
                    <div key={deal.id} className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{dealType?.icon}</span>
                            <span className="font-bold text-lg text-green-700">
                              {deal.dealType === "PERCENTAGE_OFF" && `${deal.discountValue}% Off`}
                              {deal.dealType === "FIXED_AMOUNT_OFF" && `$${deal.discountValue} Off`}
                              {deal.dealType === "BUY_ONE_GET_ONE" && "Buy One Get One"}
                              {deal.dealType === "SPECIAL_PRICE" && `Only $${deal.discountValue}`}
                              {deal.dealType === "FREE_ITEM" && "Free Item"}
                            </span>
                          </div>
                          <h3 className="font-semibold">{deal.title}</h3>
                          <p className="text-sm text-gray-600">{deal.description}</p>
                        </div>
                        {deal.code && (
                          <div className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                            {deal.code}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Valid until {new Date(deal.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Services */}
            {business.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-2 gap-2">
                    {business.services.map((service, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <span className="mr-2 text-green-600">✓</span>
                        {service}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Q&A Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Questions & Answers</CardTitle>
                <Button size="sm" onClick={() => setShowAskQuestion(!showAskQuestion)}>
                  Ask a Question
                </Button>
              </CardHeader>
              <CardContent>
                {showAskQuestion && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <Textarea
                      placeholder="What would you like to know about this business?"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAskQuestion}>
                        Submit Question
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAskQuestion(false);
                          setNewQuestion("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {qaItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No questions yet. Be the first to ask!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {qaItems.map((qa) => (
                      <div key={qa.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-blue-600">Q:</span>
                          <div className="flex-1">
                            <p className="font-medium">{qa.question}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Asked by {qa.askedBy} on {new Date(qa.askedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {qa.answer ? (
                          <div className="flex items-start gap-2 mt-3 ml-4">
                            <span className="font-bold text-green-600">A:</span>
                            <div className="flex-1">
                              <p>{qa.answer}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Answered by {qa.answeredBy} on {new Date(qa.answeredAt!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ) : isOwner ? (
                          answeringId === qa.id ? (
                            <div className="mt-3 ml-4">
                              <Textarea
                                placeholder="Write your answer..."
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                className="mb-2"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAnswerQuestion(qa.id)}>
                                  Submit Answer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAnsweringId(null);
                                    setNewAnswer("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 ml-4"
                              onClick={() => setAnsweringId(qa.id)}
                            >
                              Answer this question
                            </Button>
                          )
                        ) : (
                          <p className="text-sm text-gray-400 mt-2 ml-4">
                            Awaiting response from business
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <ReviewSection
              businessId={business.id}
              businessOwnerId={business.owner.id}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold mb-1">Address</p>
                  <p className="text-gray-600">
                    {business.address}
                    <br />
                    {business.city}, {business.state} {business.zipCode}
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Phone</p>
                  <a
                    href={`tel:${business.phone}`}
                    className="text-primary hover:underline"
                  >
                    {business.phone}
                  </a>
                </div>

                {business.email && (
                  <div>
                    <p className="font-semibold mb-1">Email</p>
                    <a
                      href={`mailto:${business.email}`}
                      className="text-primary hover:underline"
                    >
                      {business.email}
                    </a>
                  </div>
                )}

                {business.website && (
                  <div>
                    <p className="font-semibold mb-1">Website</p>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hours */}
            {business.hours && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Hours</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-gray-600">Hours information coming soon</p>
                </CardContent>
              </Card>
            )}

            {/* Halal Certification Details */}
            {certInfo && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{certInfo.icon}</span>
                    Halal Certification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-green-700">{certInfo.label}</p>
                  <p className="text-sm text-gray-600 mt-1">{certInfo.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Report Button */}
            <Card>
              <CardContent className="p-4">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
                >
                  🚩 Report this business
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quote Request Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Request a Quote</CardTitle>
            </CardHeader>
            <CardContent>
              {quoteSubmitted ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">✅</span>
                  <p className="font-semibold">Quote Request Sent!</p>
                  <p className="text-gray-600">The business will contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleQuoteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Your Name</label>
                    <Input
                      required
                      value={quoteForm.name}
                      onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      type="email"
                      required
                      value={quoteForm.email}
                      onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      type="tel"
                      required
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Service Needed</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={quoteForm.service}
                      onChange={(e) => setQuoteForm({ ...quoteForm, service: e.target.value })}
                      required
                    >
                      <option value="">Select a service</option>
                      {business.services.map((service, i) => (
                        <option key={i} value={service}>{service}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <Textarea
                      placeholder="Describe what you need..."
                      value={quoteForm.message}
                      onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Send Request</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuoteModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Report Business</CardTitle>
            </CardHeader>
            <CardContent>
              {reportSubmitted ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">✅</span>
                  <p className="font-semibold">Report Submitted</p>
                  <p className="text-gray-600">Thank you for helping keep our community safe.</p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Reason for reporting</label>
                    <div className="space-y-2">
                      {REPORT_REASONS.map((reason) => (
                        <label key={reason.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="reportReason"
                            value={reason.value}
                            checked={reportReason === reason.value}
                            onChange={(e) => setReportReason(e.target.value)}
                            required
                          />
                          <span>{reason.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Additional Details</label>
                    <Textarea
                      placeholder="Please provide more details about your concern..."
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                      Submit Report
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReportModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
