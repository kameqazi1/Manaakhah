"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface ImportResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  recordsImported: number;
  errors: string[];
}

export default function ImportPage() {
  const { data: session } = useMockSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>("businesses");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);

      // Preview first few lines of file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").slice(0, 5).join("\n");
        setFilePreview(lines);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert("Please select a file to import.");
      return;
    }

    setImporting(true);
    setImportResult(null);

    // Simulate import process
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Mock import result
    const mockResult: ImportResult = {
      success: true,
      message: `Successfully imported ${importType} data`,
      recordsProcessed: Math.floor(Math.random() * 100) + 50,
      recordsImported: Math.floor(Math.random() * 80) + 40,
      errors: [],
    };

    // Simulate some validation errors
    if (Math.random() > 0.7) {
      mockResult.errors = [
        "Row 15: Invalid email format",
        "Row 23: Missing required field 'name'",
      ];
    }

    setImportResult(mockResult);
    setImporting(false);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
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
          <h1 className="text-3xl font-bold">Import Data</h1>
          <p className="text-gray-600">Upload data from CSV or JSON files</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Import Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Data Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: "businesses", name: "Businesses", icon: "🏪" },
                { id: "users", name: "Users", icon: "👥" },
                { id: "reviews", name: "Reviews", icon: "⭐" },
                { id: "categories", name: "Categories", icon: "🏷️" },
                { id: "bookings", name: "Bookings", icon: "📅" },
                { id: "posts", name: "Posts", icon: "📝" },
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
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{type.icon}</span>
                    <span className="font-medium">{type.name}</span>
                  </div>
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
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
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
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {filePreview}
                </pre>
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
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Skip duplicate records</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Validate data before import</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span>Update existing records if found</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span>Send notifications after import</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Import Button */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className="flex-1"
            onClick={handleImport}
            disabled={importing || !selectedFile}
          >
            {importing ? "Importing..." : `Import ${importType}`}
          </Button>
        </div>

        {/* Import Result */}
        {importResult && (
          <Card className={importResult.success ? "border-green-200" : "border-red-200"}>
            <CardHeader>
              <CardTitle className={importResult.success ? "text-green-700" : "text-red-700"}>
                {importResult.success ? "Import Successful" : "Import Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>{importResult.message}</p>
                <div className="flex gap-4 text-sm">
                  <span>Records processed: <strong>{importResult.recordsProcessed}</strong></span>
                  <span>Records imported: <strong>{importResult.recordsImported}</strong></span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Downloads */}
        <Card>
          <CardHeader>
            <CardTitle>Download Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Download template files to see the expected format for each data type.
            </p>
            <div className="flex flex-wrap gap-2">
              {["businesses", "users", "reviews", "categories"].map((type) => (
                <Button key={type} variant="outline" size="sm">
                  📥 {type}.csv
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
