"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { id: "businesses", name: "Businesses", description: "Export all business data including details, categories, and locations", icon: "🏪" },
  { id: "users", name: "Users", description: "Export user accounts and profile information", icon: "👥" },
  { id: "reviews", name: "Reviews", description: "Export all reviews with ratings and comments", icon: "⭐" },
  { id: "bookings", name: "Bookings", description: "Export booking history and transaction data", icon: "📅" },
  { id: "posts", name: "Community Posts", description: "Export community posts and discussions", icon: "📝" },
  { id: "analytics", name: "Analytics Data", description: "Export platform analytics and metrics", icon: "📊" },
];

export default function ExportPage() {
  const { data: session } = useMockSession();
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedExports((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedExports(EXPORT_OPTIONS.map((o) => o.id));
  };

  const clearSelection = () => {
    setSelectedExports([]);
  };

  const handleExport = async () => {
    if (selectedExports.length === 0) {
      alert("Please select at least one data type to export.");
      return;
    }

    setExporting(true);
    setExportComplete(false);

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real implementation, this would call an API endpoint
    // For mock mode, we'll create a sample data file
    const mockData = {
      exportDate: new Date().toISOString(),
      exportedBy: session?.user?.name || "Admin",
      dataTypes: selectedExports,
      format: exportFormat,
      records: {
        businesses: selectedExports.includes("businesses") ? 150 : 0,
        users: selectedExports.includes("users") ? 500 : 0,
        reviews: selectedExports.includes("reviews") ? 320 : 0,
        bookings: selectedExports.includes("bookings") ? 180 : 0,
        posts: selectedExports.includes("posts") ? 95 : 0,
        analytics: selectedExports.includes("analytics") ? 1 : 0,
      },
    };

    // Create and download file
    const blob = new Blob(
      [exportFormat === "json" ? JSON.stringify(mockData, null, 2) : generateCSV(mockData)],
      { type: exportFormat === "json" ? "application/json" : "text/csv" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manakhaah-export-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExporting(false);
    setExportComplete(true);
    setTimeout(() => setExportComplete(false), 5000);
  };

  const generateCSV = (data: any) => {
    const lines = [
      "Export Report - Manakhaah",
      `Export Date: ${data.exportDate}`,
      `Exported By: ${data.exportedBy}`,
      `Format: ${data.format}`,
      "",
      "Data Type,Records Exported",
    ];

    Object.entries(data.records).forEach(([key, value]) => {
      lines.push(`${key},${value}`);
    });

    return lines.join("\n");
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
          <h1 className="text-3xl font-bold">Export Data</h1>
          <p className="text-gray-600">Download platform data in various formats</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Export Format Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Export Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                  className="w-4 h-4"
                />
                <span className="font-medium">CSV</span>
                <span className="text-sm text-gray-500">(Spreadsheet compatible)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={exportFormat === "json"}
                  onChange={() => setExportFormat("json")}
                  className="w-4 h-4"
                />
                <span className="font-medium">JSON</span>
                <span className="text-sm text-gray-500">(Structured data)</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Data Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Select Data to Export</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {EXPORT_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedExports.includes(option.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleSelection(option.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedExports.includes(option.id)}
                      onChange={() => toggleSelection(option.id)}
                      className="mt-1 w-4 h-4"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{option.icon}</span>
                        <span className="font-medium">{option.name}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className="flex-1"
            onClick={handleExport}
            disabled={exporting || selectedExports.length === 0}
          >
            {exporting ? "Exporting..." : `Export Selected Data (${selectedExports.length})`}
          </Button>
        </div>

        {exportComplete && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
            Export completed successfully! Check your downloads folder.
          </div>
        )}

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 text-center py-4">
              Export history will appear here in production mode.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
