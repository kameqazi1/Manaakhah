"use client";

import { useState, useEffect } from "react";
import { Shield, Smartphone, Mail, Key, AlertTriangle, Check, Eye, EyeOff, Copy, History } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<"select" | "setup" | "verify" | "complete" | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    fetchSecurityStatus();
    fetchActivityLogs();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const res = await fetch("/api/user/me");
      const data = await res.json();
      setTwoFactorEnabled(data.user?.twoFactorEnabled || false);
      setTwoFactorMethod(data.user?.twoFactorMethod || null);
    } catch {
      console.error("Failed to fetch security status");
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await fetch("/api/user/activity?limit=10");
      const data = await res.json();
      setActivities(data.activities || []);
    } catch {
      console.error("Failed to fetch activity logs");
    }
  };

  const startSetup = async (method: "AUTHENTICATOR" | "SMS" | "EMAIL") => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set up 2FA");
      }

      if (method === "AUTHENTICATOR") {
        setQrCode(data.qrCode);
        setSecret(data.secret);
      }

      setSetupStep("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setBackupCodes(data.backupCodes);
      setTwoFactorEnabled(true);
      setSetupStep("complete");
      setSuccess("Two-factor authentication has been enabled!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to disable 2FA");
      }

      setTwoFactorEnabled(false);
      setTwoFactorMethod(null);
      setSetupStep(null);
      setSuccess("Two-factor authentication has been disabled");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard");
    setTimeout(() => setSuccess(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: "Sign in",
      LOGOUT: "Sign out",
      PASSWORD_CHANGE: "Security update",
      CREATE: "Created",
      UPDATE: "Updated",
      DELETE: "Deleted",
    };
    return labels[action] || action;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <Shield className="w-7 h-7 text-emerald-600" />
        Security Settings
      </h1>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <Check className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Two-Factor Authentication Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Two-Factor Authentication (2FA)
        </h2>

        {twoFactorEnabled && !setupStep ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">2FA is enabled</p>
                <p className="text-sm text-green-600">
                  Using {twoFactorMethod === "AUTHENTICATOR" ? "Authenticator App" : twoFactorMethod}
                </p>
              </div>
            </div>

            <button
              onClick={disable2FA}
              disabled={loading}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Disable Two-Factor Authentication
            </button>
          </div>
        ) : setupStep === "select" || (!twoFactorEnabled && !setupStep) ? (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>

            <div className="grid gap-4">
              <button
                onClick={() => {
                  setSetupStep("select");
                  startSetup("AUTHENTICATOR");
                }}
                disabled={loading}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
              >
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Smartphone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Authenticator App</p>
                  <p className="text-sm text-gray-500">
                    Use Google Authenticator, Authy, or similar apps
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setSetupStep("select");
                  startSetup("EMAIL");
                }}
                disabled={loading}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
              >
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email Verification</p>
                  <p className="text-sm text-gray-500">Receive codes via email</p>
                </div>
              </button>
            </div>
          </div>
        ) : setupStep === "verify" ? (
          <div className="space-y-6">
            {qrCode && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Scan this QR code with your authenticator app
                </p>
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className="mx-auto w-48 h-48 border rounded-lg"
                />

                {secret && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Or enter this code manually:
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                        {showSecret ? secret : "••••••••••••••••"}
                      </code>
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(secret)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter the 6-digit code from your app
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSetupStep(null);
                  setQrCode(null);
                  setSecret(null);
                  setVerificationCode("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={verifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Enable 2FA"}
              </button>
            </div>
          </div>
        ) : setupStep === "complete" ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Check className="w-5 h-5" />
                2FA Successfully Enabled
              </h3>
              <p className="text-sm text-green-600">
                Your account is now protected with two-factor authentication.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Save Your Backup Codes
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                These codes can be used to access your account if you lose your authenticator.
                Each code can only be used once.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, index) => (
                  <code
                    key={index}
                    className="px-3 py-2 bg-white border border-yellow-300 rounded text-sm font-mono text-center"
                  >
                    {showBackupCodes ? code : "••••-••••"}
                  </code>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-yellow-700 hover:text-yellow-800"
                >
                  {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showBackupCodes ? "Hide" : "Show"} Codes
                </button>
                <button
                  onClick={() => copyToClipboard(backupCodes.join("\n"))}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-yellow-700 hover:text-yellow-800"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
              </div>
            </div>

            <button
              onClick={() => setSetupStep(null)}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Done
            </button>
          </div>
        ) : null}
      </section>

      {/* Recent Activity Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Security Activity
        </h2>

        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className={`p-2 rounded-full ${
                    activity.action === "LOGIN"
                      ? "bg-green-100"
                      : activity.action === "LOGOUT"
                      ? "bg-gray-100"
                      : "bg-blue-100"
                  }`}
                >
                  <Shield
                    className={`w-4 h-4 ${
                      activity.action === "LOGIN"
                        ? "text-green-600"
                        : activity.action === "LOGOUT"
                        ? "text-gray-600"
                        : "text-blue-600"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    {getActionLabel(activity.action)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(activity.createdAt)}
                    {activity.ipAddress && ` • ${activity.ipAddress}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </section>
    </div>
  );
}
