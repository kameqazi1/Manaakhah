"use client";

import { useState } from "react";
import { switchMockRole, getAvailableMockUsers } from "@/lib/mock-auth";
import { useMockSession } from "./mock-session-provider";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export function RoleSwitcher() {
  const { data: session, update } = useMockSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!USE_MOCK_DATA) return null;

  const users = getAvailableMockUsers();

  const handleSwitch = (role: "CONSUMER" | "BUSINESS_OWNER" | "ADMIN") => {
    switchMockRole(role);
    update();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="shadow-lg bg-yellow-100 border-yellow-300 hover:bg-yellow-200"
        >
          🎭 Mock Mode ({session?.user.role || "None"})
        </Button>
      )}

      {isOpen && (
        <Card className="shadow-xl w-80">
          <CardHeader className="bg-yellow-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">🎭 Role Switcher (Mock Mode)</CardTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Current: {session?.user.email || "Not logged in"}
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Switch Role:
              </p>

              {users.map((user) => (
                <Button
                  key={user.id}
                  onClick={() => handleSwitch(user.role)}
                  variant={session?.user.id === user.id ? "default" : "outline"}
                  className="w-full justify-start text-left"
                  size="sm"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">
                      {user.role.replace("_", " ")}
                    </span>
                    <span className="text-xs opacity-70">{user.email}</span>
                  </div>
                </Button>
              ))}

              <div className="pt-2 border-t mt-3">
                <p className="text-xs text-gray-600 mb-2">Quick Actions:</p>
                <Button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Reset All Data
                </Button>
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  💡 Mock mode: No database required. Data stored in browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
