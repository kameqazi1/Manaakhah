"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  isActive: boolean;
}

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: "1",
    name: "Welcome Email",
    type: "EMAIL",
    subject: "Welcome to Manakhaah!",
    body: "Dear {{user_name}},\n\nWelcome to Manakhaah! We're excited to have you join our community of Muslim businesses and consumers.\n\nStart exploring halal businesses near you today!\n\nBest regards,\nThe Manakhaah Team",
    isActive: true,
  },
  {
    id: "2",
    name: "Business Approved",
    type: "EMAIL",
    subject: "Your Business Has Been Approved!",
    body: "Dear {{owner_name}},\n\nGreat news! Your business \"{{business_name}}\" has been approved and is now live on Manakhaah.\n\nYou can now start receiving reviews and bookings from our community.\n\nBest regards,\nThe Manakhaah Team",
    isActive: true,
  },
  {
    id: "3",
    name: "New Review Notification",
    type: "EMAIL",
    subject: "You Have a New Review!",
    body: "Dear {{owner_name}},\n\nYour business \"{{business_name}}\" has received a new {{rating}}-star review from {{reviewer_name}}.\n\n\"{{review_text}}\"\n\nLog in to respond to this review.\n\nBest regards,\nThe Manakhaah Team",
    isActive: true,
  },
  {
    id: "4",
    name: "Booking Confirmation",
    type: "EMAIL",
    subject: "Booking Confirmed - {{business_name}}",
    body: "Dear {{customer_name}},\n\nYour booking with {{business_name}} has been confirmed!\n\nDetails:\n- Date: {{booking_date}}\n- Time: {{booking_time}}\n- Service: {{service_name}}\n\nWe look forward to serving you!\n\nBest regards,\nThe Manakhaah Team",
    isActive: true,
  },
  {
    id: "5",
    name: "Password Reset",
    type: "EMAIL",
    subject: "Reset Your Password",
    body: "Dear {{user_name}},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n{{reset_link}}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Manakhaah Team",
    isActive: true,
  },
  {
    id: "6",
    name: "Review Flagged",
    type: "EMAIL",
    subject: "Review Flagged for Moderation",
    body: "Dear Admin,\n\nA review has been flagged for moderation:\n\nBusiness: {{business_name}}\nReviewer: {{reviewer_name}}\nReason: {{flag_reason}}\n\nPlease review this content in the admin panel.",
    isActive: true,
  },
];

export default function NotificationsPage() {
  const { data: session } = useMockSession();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);

  useEffect(() => {
    const savedTemplates = localStorage.getItem("admin-notification-templates");
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch {
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
    setLoading(false);
  }, []);

  const saveTemplates = (updatedTemplates: NotificationTemplate[]) => {
    setTemplates(updatedTemplates);
    localStorage.setItem("admin-notification-templates", JSON.stringify(updatedTemplates));
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;

    const updatedTemplates = templates.map((t) =>
      t.id === editingTemplate.id ? editingTemplate : t
    );
    saveTemplates(updatedTemplates);
    setEditingTemplate(null);
  };

  const handleToggleActive = (templateId: string) => {
    const updatedTemplates = templates.map((t) =>
      t.id === templateId ? { ...t, isActive: !t.isActive } : t
    );
    saveTemplates(updatedTemplates);
  };

  const handleResetToDefaults = () => {
    if (confirm("Are you sure you want to reset all templates to defaults?")) {
      saveTemplates(DEFAULT_TEMPLATES);
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
          <h1 className="text-3xl font-bold">Notification Templates</h1>
          <p className="text-gray-600">Manage email and notification templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefaults}>
            Reset to Defaults
          </Button>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Template: {editingTemplate.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Template Name</label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject Line</label>
                  <Input
                    value={editingTemplate.subject}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Body</label>
                  <textarea
                    className="w-full h-48 p-3 border rounded-lg font-mono text-sm"
                    value={editingTemplate.body}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, body: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {"{{variable_name}}"} for dynamic content
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleUpdateTemplate}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Preview: {previewTemplate.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Subject:</div>
                  <div className="font-semibold">{previewTemplate.subject}</div>
                </div>
                <div className="p-4 bg-white border rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">Body:</div>
                  <div className="whitespace-pre-wrap">{previewTemplate.body}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates List */}
      {loading ? (
        <div className="p-8 text-center">Loading templates...</div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={!template.isActive ? "opacity-60" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {template.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          template.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      <strong>Subject:</strong> {template.subject}
                    </p>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                      {template.body.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(template.id)}
                    >
                      {template.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
