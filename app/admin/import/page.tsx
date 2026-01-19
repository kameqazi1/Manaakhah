"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface ImportResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  recordsImported: number;
  duplicatesSkipped?: number;
  errors: string[];
}

interface ImportOptions {
  skipDuplicates: boolean;
  validateData: boolean;
  updateExisting: boolean;
  city: string;
  state: string;
}

export default function ImportPage() {
  const { data: session } = useMockSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>("businesses");
  const [fileFormat, setFileFormat] = useState<"csv" | "json">("csv");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const [options, setOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    validateData: true,
    updateExisting: false,
    city: "Fremont",
    state: "CA",
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);

      // Detect format from file extension
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "json") {
        setFileFormat("json");
      } else {
        setFileFormat("csv");
      }

      // Read and preview file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);

        // Preview first few lines
        const lines = text.split("\n").slice(0, 6).join("\n");
        setFilePreview(lines);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !fileContent) {
      alert("Please select a file to import.");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify({
          format: fileFormat,
          data: fileContent,
          options: {
            ...options,
            importType,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message,
          recordsProcessed: result.recordsProcessed,
          recordsImported: result.recordsImported,
          duplicatesSkipped: result.duplicatesSkipped,
          errors: result.errors || [],
        });
      } else {
        setImportResult({
          success: false,
          message: result.error || "Import failed",
          recordsProcessed: 0,
          recordsImported: 0,
          errors: [result.error],
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: "Network error occurred",
        recordsProcessed: 0,
        recordsImported: 0,
        errors: ["Failed to connect to server"],
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/import/template?type=${type}`, {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}_template.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download template:", error);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileContent(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          <h1 className="text-3xl font-bold">Bulk Import</h1>
          <p className="text-gray-600">Import business data from CSV or JSON files</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/businesses/scraper">
            <Button variant="outline">Web Scraper</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Data Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Data Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: "businesses", name: "Businesses", icon: "🏪", description: "Import business listings" },
                  { id: "users", name: "Users", icon: "👥", description: "Import user accounts" },
                  { id: "reviews", name: "Reviews", icon: "⭐", description: "Import reviews" },
                ].map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      importType === type.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setImportType(type.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{type.icon}</span>
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div>
                    <div className="text-4xl mb-2">
                      {fileFormat === "json" ? "📋" : "📄"}
                    </div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB • {fileFormat.toUpperCase()} format
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📤</div>
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">CSV or JSON files supported</p>
                  </div>
                )}
              </div>

              {/* File Preview */}
              {filePreview && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">File Preview:</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-40">
                    {filePreview}
                  </pre>
                  {fileContent && fileContent.split("\n").length > 6 && (
                    <p className="text-xs text-gray-500 mt-1">
                      ... and {fileContent.split("\n").length - 6} more rows
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Options */}
          <Card>
            <CardHeader>
              <CardTitle>Import Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={options.skipDuplicates}
                    onChange={(e) =>
                      setOptions({ ...options, skipDuplicates: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-medium">Skip duplicate records</span>
                    <p className="text-xs text-gray-500">
                      Businesses with matching name and address will be skipped
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={options.validateData}
                    onChange={(e) =>
                      setOptions({ ...options, validateData: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-medium">Validate data before import</span>
                    <p className="text-xs text-gray-500">
                      Check for required fields and data format
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={options.updateExisting}
                    onChange={(e) =>
                      setOptions({ ...options, updateExisting: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-medium">Update existing records</span>
                    <p className="text-xs text-gray-500">
                      If duplicate found, update instead of skip
                    </p>
                  </div>
                </label>

                {/* Default location for records without location */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="defaultCity">Default City</Label>
                    <Input
                      id="defaultCity"
                      value={options.city}
                      onChange={(e) => setOptions({ ...options, city: e.target.value })}
                      placeholder="Fremont"
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultState">Default State</Label>
                    <Input
                      id="defaultState"
                      value={options.state}
                      onChange={(e) => setOptions({ ...options, state: e.target.value })}
                      placeholder="CA"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleImport}
            disabled={importing || !selectedFile}
          >
            {importing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Importing...
              </span>
            ) : (
              `Import ${importType}`
            )}
          </Button>

          {/* Import Result */}
          {importResult && (
            <Card className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardHeader>
                <CardTitle className={importResult.success ? "text-green-700" : "text-red-700"}>
                  {importResult.success ? "Import Successful" : "Import Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p>{importResult.message}</p>

                  {importResult.success && (
                    <div className="grid grid-cols-3 gap-4 py-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-700">
                          {importResult.recordsProcessed}
                        </div>
                        <div className="text-xs text-gray-500">Processed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {importResult.recordsImported}
                        </div>
                        <div className="text-xs text-gray-500">Imported</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {importResult.duplicatesSkipped || 0}
                        </div>
                        <div className="text-xs text-gray-500">Skipped</div>
                      </div>
                    </div>
                  )}

                  {importResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-600 mb-2">
                        Errors ({importResult.errors.length}):
                      </h4>
                      <ul className="list-disc list-inside text-sm text-red-600 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>... and {importResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {importResult.success && (
                    <div className="pt-4 border-t flex gap-4">
                      <Link href="/admin/businesses/review-queue">
                        <Button>Go to Review Queue</Button>
                      </Link>
                      <Button variant="outline" onClick={resetForm}>
                        Import More
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Format Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">File Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">CSV Format</h4>
                <p className="text-sm text-gray-600 mb-2">
                  First row must be headers. Required columns:
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• name (required)</li>
                  <li>• address (required)</li>
                  <li>• city (required)</li>
                  <li>• state (required)</li>
                  <li>• zipCode</li>
                  <li>• phone</li>
                  <li>• email</li>
                  <li>• website</li>
                  <li>• category</li>
                  <li>• description</li>
                  <li>• tags (comma-separated)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">JSON Format</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`{
  "businesses": [
    {
      "name": "Business Name",
      "address": "123 Main St",
      "city": "Fremont",
      "state": "CA",
      "zipCode": "94536",
      "category": "RESTAURANT",
      "tags": ["HALAL_VERIFIED"]
    }
  ]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Download Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Download sample templates to see the expected format.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => downloadTemplate("businesses")}
                >
                  📥 businesses_template.csv
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valid Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600 space-y-1 max-h-48 overflow-y-auto">
                {[
                  "RESTAURANT",
                  "HALAL_FOOD",
                  "GROCERY",
                  "MASJID",
                  "AUTO_REPAIR",
                  "BARBER_SALON",
                  "TUTORING",
                  "LEGAL_SERVICES",
                  "ACCOUNTING",
                  "HEALTH_WELLNESS",
                  "REAL_ESTATE",
                  "FINANCIAL_SERVICES",
                  "OTHER",
                ].map((cat) => (
                  <div key={cat} className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {cat}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valid Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600 space-y-1 max-h-48 overflow-y-auto">
                {[
                  "MUSLIM_OWNED",
                  "HALAL_VERIFIED",
                  "ZABIHA_CERTIFIED",
                  "SISTERS_FRIENDLY",
                  "KID_FRIENDLY",
                  "PRAYER_SPACE",
                  "WUDU_FACILITIES",
                  "FAMILY_OWNED",
                  "SHARIA_COMPLIANT",
                  "DELIVERY",
                ].map((tag) => (
                  <div key={tag} className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {tag}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
