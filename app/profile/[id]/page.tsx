"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  joinedAt: string;
  bio?: string;
  location?: string;
  isVerified: boolean;
  verificationLevel: "none" | "email" | "phone" | "id";
  stats: {
    reviewsWritten: number;
    helpfulVotes: number;
    photosUploaded: number;
    questionsAsked: number;
    answersGiven: number;
    listsCreated: number;
    checkIns: number;
  };
  badges: Badge[];
  recentReviews: Review[];
  recentActivity: Activity[];
  following: string[];
  followers: string[];
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

interface Review {
  id: string;
  businessId: string;
  businessName: string;
  rating: number;
  content: string;
  createdAt: string;
}

interface Activity {
  id: string;
  type: "review" | "photo" | "question" | "answer" | "check_in" | "list";
  description: string;
  createdAt: string;
  link?: string;
}

const REPUTATION_LEVELS = [
  { name: "Newcomer", minPoints: 0, icon: "🌱", color: "bg-gray-100 text-gray-700" },
  { name: "Explorer", minPoints: 50, icon: "🔍", color: "bg-blue-100 text-blue-700" },
  { name: "Contributor", minPoints: 150, icon: "✍️", color: "bg-green-100 text-green-700" },
  { name: "Guide", minPoints: 500, icon: "🧭", color: "bg-purple-100 text-purple-700" },
  { name: "Expert", minPoints: 1000, icon: "⭐", color: "bg-yellow-100 text-yellow-700" },
  { name: "Master", minPoints: 2500, icon: "👑", color: "bg-orange-100 text-orange-700" },
  { name: "Legend", minPoints: 5000, icon: "🏆", color: "bg-red-100 text-red-700" },
];

const AVAILABLE_BADGES = [
  { id: "first_review", name: "First Review", icon: "📝", description: "Wrote your first review" },
  { id: "helpful_10", name: "Helpful Hand", icon: "👍", description: "Received 10 helpful votes" },
  { id: "helpful_50", name: "Community Helper", icon: "🤝", description: "Received 50 helpful votes" },
  { id: "photos_10", name: "Shutterbug", icon: "📸", description: "Uploaded 10 photos" },
  { id: "reviews_10", name: "Regular Reviewer", icon: "⭐", description: "Wrote 10 reviews" },
  { id: "reviews_50", name: "Super Reviewer", icon: "🌟", description: "Wrote 50 reviews" },
  { id: "verified", name: "Verified User", icon: "✅", description: "Verified identity" },
  { id: "early_adopter", name: "Early Adopter", icon: "🚀", description: "Joined in the first month" },
  { id: "local_guide", name: "Local Guide", icon: "🗺️", description: "Reviewed 20 businesses in one city" },
  { id: "halal_expert", name: "Halal Expert", icon: "🥇", description: "Specialist in halal reviews" },
];

export default function UserProfilePage() {
  const params = useParams();
  const { data: session } = useMockSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "activity" | "badges" | "lists">("reviews");

  const isOwnProfile = session?.user?.id === params.id;

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  const loadProfile = () => {
    // Load from localStorage or generate mock data
    const savedProfiles = localStorage.getItem("userProfiles");
    let profiles = savedProfiles ? JSON.parse(savedProfiles) : {};

    if (profiles[params.id as string]) {
      setProfile(profiles[params.id as string]);
    } else {
      // Generate mock profile
      const mockProfile: UserProfile = {
        id: params.id as string,
        name: session?.user?.id === params.id ? session?.user?.name || "User" : "Community Member",
        email: session?.user?.id === params.id ? session?.user?.email || "" : "",
        joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        bio: "Passionate about supporting Muslim-owned businesses in my community!",
        location: "Bay Area, CA",
        isVerified: Math.random() > 0.5,
        verificationLevel: "email",
        stats: {
          reviewsWritten: Math.floor(Math.random() * 30),
          helpfulVotes: Math.floor(Math.random() * 100),
          photosUploaded: Math.floor(Math.random() * 20),
          questionsAsked: Math.floor(Math.random() * 10),
          answersGiven: Math.floor(Math.random() * 15),
          listsCreated: Math.floor(Math.random() * 5),
          checkIns: Math.floor(Math.random() * 50),
        },
        badges: [
          { id: "first_review", name: "First Review", icon: "📝", description: "Wrote your first review", earnedAt: new Date().toISOString() },
          { id: "early_adopter", name: "Early Adopter", icon: "🚀", description: "Joined in the first month", earnedAt: new Date().toISOString() },
        ],
        recentReviews: [],
        recentActivity: [
          { id: "1", type: "review", description: "Reviewed Saffron Kitchen", createdAt: new Date().toISOString() },
          { id: "2", type: "photo", description: "Added 3 photos to Al-Noor Restaurant", createdAt: new Date(Date.now() - 86400000).toISOString() },
        ],
        following: [],
        followers: [],
      };
      setProfile(mockProfile);

      // Save to localStorage
      profiles[params.id as string] = mockProfile;
      localStorage.setItem("userProfiles", JSON.stringify(profiles));
    }

    // Check if current user is following this profile
    const followingList = JSON.parse(localStorage.getItem("userFollowing") || "{}");
    setIsFollowing(followingList[session?.user?.id || ""]?.includes(params.id));

    setLoading(false);
  };

  const calculateReputationPoints = () => {
    if (!profile) return 0;
    return (
      profile.stats.reviewsWritten * 10 +
      profile.stats.helpfulVotes * 5 +
      profile.stats.photosUploaded * 3 +
      profile.stats.questionsAsked * 2 +
      profile.stats.answersGiven * 5 +
      profile.stats.listsCreated * 10 +
      profile.stats.checkIns * 1
    );
  };

  const getReputationLevel = () => {
    const points = calculateReputationPoints();
    let level = REPUTATION_LEVELS[0];
    for (const l of REPUTATION_LEVELS) {
      if (points >= l.minPoints) {
        level = l;
      }
    }
    return level;
  };

  const handleFollow = () => {
    if (!session?.user?.id) return;

    const followingList = JSON.parse(localStorage.getItem("userFollowing") || "{}");
    if (!followingList[session.user.id]) {
      followingList[session.user.id] = [];
    }

    if (isFollowing) {
      followingList[session.user.id] = followingList[session.user.id].filter((id: string) => id !== params.id);
    } else {
      followingList[session.user.id].push(params.id);
    }

    localStorage.setItem("userFollowing", JSON.stringify(followingList));
    setIsFollowing(!isFollowing);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const reputationLevel = getReputationLevel();
  const reputationPoints = calculateReputationPoints();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-5xl text-green-600 font-bold shadow-lg">
                {profile.image ? (
                  <img src={profile.image} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              {profile.isVerified && (
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  ✓
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <Badge className={reputationLevel.color}>
                  {reputationLevel.icon} {reputationLevel.name}
                </Badge>
                {profile.isVerified && (
                  <Badge className="bg-blue-500 text-white">✓ Verified</Badge>
                )}
              </div>

              {profile.bio && <p className="text-green-100 mb-2">{profile.bio}</p>}

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-green-100">
                {profile.location && (
                  <span>📍 {profile.location}</span>
                )}
                <span>📅 Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
                <span>⭐ {reputationPoints} reputation points</span>
              </div>

              {/* Follow Stats */}
              <div className="flex justify-center md:justify-start gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.followers.length}</div>
                  <div className="text-sm text-green-100">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.following.length}</div>
                  <div className="text-sm text-green-100">Following</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <Link href="/profile/edit">
                  <Button variant="secondary">Edit Profile</Button>
                </Link>
              ) : (
                <>
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={handleFollow}
                    className={isFollowing ? "" : "bg-white text-green-700 hover:bg-green-50"}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Link href={`/messages?to=${profile.id}`}>
                    <Button variant="secondary">Message</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Contribution Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{profile.stats.reviewsWritten}</div>
                    <div className="text-xs text-gray-600">Reviews</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{profile.stats.helpfulVotes}</div>
                    <div className="text-xs text-gray-600">Helpful Votes</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{profile.stats.photosUploaded}</div>
                    <div className="text-xs text-gray-600">Photos</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{profile.stats.checkIns}</div>
                    <div className="text-xs text-gray-600">Check-ins</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reputation Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Reputation Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {REPUTATION_LEVELS.map((level, idx) => {
                    const nextLevel = REPUTATION_LEVELS[idx + 1];
                    const isCurrentLevel = level.name === reputationLevel.name;
                    const isAchieved = reputationPoints >= level.minPoints;

                    return (
                      <div key={level.name} className={`flex items-center gap-3 ${!isAchieved ? "opacity-40" : ""}`}>
                        <span className="text-xl">{level.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${isCurrentLevel ? "text-green-600" : ""}`}>
                              {level.name}
                            </span>
                            <span className="text-xs text-gray-500">{level.minPoints}+ pts</span>
                          </div>
                          {isCurrentLevel && nextLevel && (
                            <div className="mt-1">
                              <div className="h-1.5 bg-gray-200 rounded-full">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{
                                    width: `${Math.min(100, ((reputationPoints - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100)}%`
                                  }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {nextLevel.minPoints - reputationPoints} more points to {nextLevel.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              {(["reviews", "activity", "badges", "lists"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "reviews" && (
              <Card>
                <CardContent className="p-6">
                  {profile.recentReviews.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No reviews yet</p>
                  ) : (
                    <div className="space-y-4">
                      {profile.recentReviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <Link href={`/business/${review.businessId}`} className="font-semibold hover:text-green-600">
                            {review.businessName}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-yellow-500">
                              {[...Array(5)].map((_, i) => (
                                <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{review.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "activity" && (
              <Card>
                <CardContent className="p-6">
                  {profile.recentActivity.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No recent activity</p>
                  ) : (
                    <div className="space-y-4">
                      {profile.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">
                            {activity.type === "review" && "📝"}
                            {activity.type === "photo" && "📸"}
                            {activity.type === "question" && "❓"}
                            {activity.type === "answer" && "💬"}
                            {activity.type === "check_in" && "📍"}
                            {activity.type === "list" && "📋"}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "badges" && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Earned Badges ({profile.badges.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {profile.badges.map((badge) => (
                      <div key={badge.id} className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-3xl">{badge.icon}</span>
                        <p className="font-medium mt-2">{badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.description}</p>
                      </div>
                    ))}
                  </div>

                  <h3 className="font-semibold mb-4">Available Badges</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {AVAILABLE_BADGES.filter(b => !profile.badges.find(pb => pb.id === b.id)).map((badge) => (
                      <div key={badge.id} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-50">
                        <span className="text-3xl grayscale">{badge.icon}</span>
                        <p className="font-medium mt-2">{badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "lists" && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Created Lists</h3>
                    {isOwnProfile && (
                      <Link href="/lists/create">
                        <Button size="sm">Create List</Button>
                      </Link>
                    )}
                  </div>
                  <p className="text-center text-gray-500 py-8">No lists created yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
