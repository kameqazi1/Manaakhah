"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface Settings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  defaultRadius: number;
  requireEmailVerification: boolean;
  requireBusinessApproval: boolean;
  enableCommunityPosts: boolean;
  enableBookings: boolean;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  siteName: "Manakhaah",
  siteDescription: "Keep Muslim money within the Muslim community",
  contactEmail: "contact@manakhaah.com",
  defaultRadius: 10,
  requireEmailVerification: true,
  requireBusinessApproval: true,
  enableCommunityPosts: true,
  enableBookings: true,
  maintenanceMode: false,
};

export default function AdminSettingsPage() {
  const { data: session } = useMockSession();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage in mock mode
    const savedSettings = localStorage.getItem("admin-settings");
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In mock mode, save to localStorage
      localStorage.setItem("admin-settings", JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem("admin-settings");
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-gray-600">Configure platform settings and preferences</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site Name</label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Site Description</label>
              <Input
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <Input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Search Radius (miles)</label>
              <Input
                type="number"
                value={settings.defaultRadius}
                onChange={(e) => setSettings({ ...settings, defaultRadius: parseInt(e.target.value) || 10 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Email Verification</p>
                <p className="text-sm text-gray-500">Users must verify email before accessing features</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Business Approval</p>
                <p className="text-sm text-gray-500">New businesses require admin approval before publishing</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireBusinessApproval}
                  onChange={(e) => setSettings({ ...settings, requireBusinessApproval: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Community Posts</p>
                <p className="text-sm text-gray-500">Allow users to create community posts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableCommunityPosts}
                  onChange={(e) => setSettings({ ...settings, enableCommunityPosts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Bookings</p>
                <p className="text-sm text-gray-500">Allow users to book services from businesses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableBookings}
                  onChange={(e) => setSettings({ ...settings, enableBookings: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Mode */}
        <Card className={settings.maintenanceMode ? "border-red-200 bg-red-50" : ""}>
          <CardHeader>
            <CardTitle className={settings.maintenanceMode ? "text-red-700" : ""}>
              Maintenance Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Maintenance Mode</p>
                <p className="text-sm text-gray-500">
                  When enabled, only admins can access the site
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            {settings.maintenanceMode && (
              <p className="mt-4 text-red-600 font-medium">
                Warning: Maintenance mode is ON. Regular users cannot access the site.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </div>

        {saved && (
          <p className="text-center text-green-600 font-medium">
            Settings saved successfully!
          </p>
        )}
      </div>
    </div>
  );
}
