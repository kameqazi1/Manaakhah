"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface Backup {
  id: string;
  name: string;
  createdAt: string;
  size: string;
  type: "full" | "incremental";
  status: "completed" | "failed" | "in_progress";
}

export default function BackupPage() {
  const { data: session } = useMockSession();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");

  useEffect(() => {
    // Load backups from localStorage
    const savedBackups = localStorage.getItem("admin-backups");
    if (savedBackups) {
      try {
        setBackups(JSON.parse(savedBackups));
      } catch {
        setBackups([]);
      }
    } else {
      setBackups([]);
    }

    const settings = localStorage.getItem("admin-backup-settings");
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setAutoBackupEnabled(parsed.autoBackupEnabled ?? true);
        setBackupFrequency(parsed.backupFrequency ?? "daily");
      } catch {}
    }

    setLoading(false);
  }, []);

  const saveBackups = (updatedBackups: Backup[]) => {
    setBackups(updatedBackups);
    localStorage.setItem("admin-backups", JSON.stringify(updatedBackups));
  };

  const saveSettings = () => {
    localStorage.setItem(
      "admin-backup-settings",
      JSON.stringify({ autoBackupEnabled, backupFrequency })
    );
  };

  const handleCreateBackup = async (type: "full" | "incremental") => {
    setCreating(true);

    // Simulate backup creation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const newBackup: Backup = {
      id: Date.now().toString(),
      name: type === "full" ? `Full Backup - ${new Date().toLocaleDateString()}` : "Incremental Backup",
      createdAt: new Date().toISOString(),
      size: type === "full" ? `${Math.floor(Math.random() * 100) + 200} MB` : `${Math.floor(Math.random() * 50) + 20} MB`,
      type,
      status: "completed",
    };

    saveBackups([newBackup, ...backups]);
    setCreating(false);
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm("Are you sure you want to restore this backup? This will overwrite current data.")) {
      return;
    }

    setRestoring(backupId);

    // Simulate restore process
    await new Promise((resolve) => setTimeout(resolve, 4000));

    alert("Backup restored successfully!");
    setRestoring(null);
  };

  const handleDeleteBackup = (backupId: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) {
      return;
    }

    const updatedBackups = backups.filter((b) => b.id !== backupId);
    saveBackups(updatedBackups);
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
          <h1 className="text-3xl font-bold">Backup & Restore</h1>
          <p className="text-gray-600">Manage database backups and restoration</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Create Backup */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() => handleCreateBackup("full")}
                disabled={creating}
                className="flex-1"
              >
                {creating ? "Creating..." : "Create Full Backup"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreateBackup("incremental")}
                disabled={creating}
                className="flex-1"
              >
                Create Incremental Backup
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <strong>Full backup:</strong> Complete snapshot of all data. Recommended for major updates.
              <br />
              <strong>Incremental:</strong> Only changes since last backup. Faster and smaller.
            </p>
          </CardContent>
        </Card>

        {/* Auto Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Automatic Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Automatic Backups</p>
                  <p className="text-sm text-gray-500">Automatically create backups on a schedule</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBackupEnabled}
                    onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {autoBackupEnabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">Backup Frequency</label>
                  <select
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}

              <Button onClick={saveSettings}>Save Settings</Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup History */}
        <Card>
          <CardHeader>
            <CardTitle>Backup History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading backups...</div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No backups found. Create your first backup above.
              </div>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {backup.type === "full" ? "💾" : "📁"}
                        </span>
                        <span className="font-medium">{backup.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            backup.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : backup.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {backup.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(backup.createdAt).toLocaleString()} • {backup.size}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(backup.id)}
                        disabled={restoring === backup.id || backup.status !== "completed"}
                      >
                        {restoring === backup.id ? "Restoring..." : "Restore"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteBackup(backup.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">2.1 GB</div>
                <div className="text-sm text-gray-600">Total Backup Size</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">10 GB</div>
                <div className="text-sm text-gray-600">Storage Limit</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">21%</div>
                <div className="text-sm text-gray-600">Storage Used</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: "21%" }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
