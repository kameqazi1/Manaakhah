"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface Referral {
  id: string;
  referrerId: string;
  referredEmail: string;
  status: "pending" | "signed_up" | "completed";
  createdAt: string;
  completedAt?: string;
  reward?: number;
}

interface ReferralReward {
  id: string;
  userId: string;
  amount: number;
  type: "referral_bonus" | "signup_bonus";
  status: "pending" | "claimed";
  createdAt: string;
  claimedAt?: string;
}

export default function ReferralProgramPage() {
  const { data: session } = useMockSession();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
      generateReferralCode();
    }
  }, [session?.user?.id]);

  const generateReferralCode = () => {
    // Generate a unique referral code based on user ID
    const userId = session?.user?.id || "";
    const code = `MANA-${userId.slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Check if user already has a code
    const savedCode = localStorage.getItem(`referralCode-${userId}`);
    if (savedCode) {
      setReferralCode(savedCode);
    } else {
      localStorage.setItem(`referralCode-${userId}`, code);
      setReferralCode(code);
    }
  };

  const loadData = () => {
    const userId = session?.user?.id;

    // Load referrals
    const savedReferrals = localStorage.getItem("referrals");
    if (savedReferrals) {
      try {
        const allReferrals = JSON.parse(savedReferrals);
        const userReferrals = allReferrals.filter((r: Referral) => r.referrerId === userId);
        setReferrals(userReferrals);
      } catch {
        setReferrals([]);
      }
    }

    // Load rewards
    const savedRewards = localStorage.getItem("referralRewards");
    if (savedRewards) {
      try {
        const allRewards = JSON.parse(savedRewards);
        const userRewards = allRewards.filter((r: ReferralReward) => r.userId === userId);
        setRewards(userRewards);
      } catch {
        setRewards([]);
      }
    }

    setLoading(false);
  };

  const getReferralLink = () => {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${referralCode}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    // Create a new referral
    const newReferral: Referral = {
      id: Date.now().toString(),
      referrerId: session?.user?.id || "",
      referredEmail: inviteEmail,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const savedReferrals = localStorage.getItem("referrals");
    const allReferrals = savedReferrals ? JSON.parse(savedReferrals) : [];
    allReferrals.push(newReferral);
    localStorage.setItem("referrals", JSON.stringify(allReferrals));

    setReferrals([...referrals, newReferral]);
    setInviteEmail("");
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
  };

  const handleClaimReward = (rewardId: string) => {
    const savedRewards = localStorage.getItem("referralRewards");
    let allRewards = savedRewards ? JSON.parse(savedRewards) : [];

    allRewards = allRewards.map((r: ReferralReward) =>
      r.id === rewardId ? { ...r, status: "claimed", claimedAt: new Date().toISOString() } : r
    );

    localStorage.setItem("referralRewards", JSON.stringify(allRewards));
    setRewards(allRewards.filter((r: ReferralReward) => r.userId === session?.user?.id));

    alert("Reward claimed! Credits have been added to your account.");
  };

  const handleShare = (platform: string) => {
    const link = getReferralLink();
    const text = "Join Manaakhah - The best platform to discover Muslim-owned businesses in your community! Use my referral link:";

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + link)}`);
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`);
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`);
        break;
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent("Join Manaakhah!")}&body=${encodeURIComponent(text + "\n\n" + link)}`);
        break;
    }
  };

  const getTotalEarnings = () => {
    return rewards.reduce((acc, r) => acc + r.amount, 0);
  };

  const getPendingRewards = () => {
    return rewards.filter((r) => r.status === "pending").reduce((acc, r) => acc + r.amount, 0);
  };

  const getSuccessfulReferrals = () => {
    return referrals.filter((r) => r.status === "completed").length;
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Please log in to view your referrals.</p>
            <Link href="/auth/signin">
              <Button className="mt-4">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Refer Friends, Earn Rewards</h1>
        <p className="text-gray-600">
          Share Manaakhah with friends and family. Earn $5 for every successful referral!
        </p>
      </div>

      {/* How It Works */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="font-semibold mb-1">Share Your Link</h3>
              <p className="text-sm text-gray-600">
                Send your unique referral link to friends and family
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="font-semibold mb-1">They Sign Up</h3>
              <p className="text-sm text-gray-600">
                Your friend creates an account using your link
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="font-semibold mb-1">Earn Rewards</h3>
              <p className="text-sm text-gray-600">
                You both get $5 credit when they write their first review!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Referral Link */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={getReferralLink()}
              readOnly
              className="flex-1 bg-gray-50"
            />
            <Button onClick={handleCopyLink}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-gray-500">Or share your code:</span>
            <div className="flex items-center gap-2">
              <code className="px-3 py-1 bg-gray-100 rounded font-mono text-lg">
                {referralCode}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopyCode}>
                Copy
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 mr-2">Share via:</span>
            <Button variant="outline" size="sm" onClick={() => handleShare("whatsapp")}>
              💬 WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare("twitter")}>
              🐦 Twitter
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare("facebook")}>
              📘 Facebook
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare("email")}>
              ✉️ Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Send Direct Invite */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Send Direct Invite</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter friend's email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Send Invite</Button>
          </form>
          {inviteSent && (
            <p className="text-green-600 text-sm mt-2">
              Invitation sent successfully!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              ${getTotalEarnings().toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Earned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              ${getPendingRewards().toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Pending Rewards</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {getSuccessfulReferrals()}
            </div>
            <div className="text-sm text-gray-600">Successful Referrals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {referrals.length}
            </div>
            <div className="text-sm text-gray-600">Total Invites Sent</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Rewards */}
      {rewards.filter((r) => r.status === "pending").length > 0 && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Claim Your Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rewards
                .filter((r) => r.status === "pending")
                .map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                  >
                    <div>
                      <span className="font-semibold">${reward.amount.toFixed(2)}</span>
                      <span className="text-gray-500 ml-2">
                        {reward.type === "referral_bonus" ? "Referral Bonus" : "Signup Bonus"}
                      </span>
                    </div>
                    <Button size="sm" onClick={() => handleClaimReward(reward.id)}>
                      Claim
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading...</p>
          ) : referrals.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No referrals yet. Share your link to start earning!
            </p>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{referral.referredEmail}</p>
                    <p className="text-sm text-gray-500">
                      Invited on {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        referral.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : referral.status === "signed_up"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {referral.status === "completed"
                        ? "Completed"
                        : referral.status === "signed_up"
                        ? "Signed Up"
                        : "Pending"}
                    </span>
                    {referral.reward && (
                      <p className="text-sm text-green-600 mt-1">
                        +${referral.reward.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
