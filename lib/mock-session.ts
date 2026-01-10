"use client";

import { useState, useEffect } from "react";
import { getMockSession, type MockSession } from "./mock-auth";

/**
 * Hook that mimics useSession from NextAuth
 * Returns the current mock session from localStorage
 */
export function useMockSession() {
  const [session, setSession] = useState<MockSession | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    // Get session from localStorage
    const currentSession = getMockSession();
    setSession(currentSession);
    setStatus(currentSession ? "authenticated" : "unauthenticated");

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = () => {
      const updatedSession = getMockSession();
      setSession(updatedSession);
      setStatus(updatedSession ? "authenticated" : "unauthenticated");
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom session change events
    window.addEventListener("mock-session-change", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("mock-session-change", handleStorageChange);
    };
  }, []);

  return {
    data: session,
    status,
  };
}

/**
 * Trigger a session update across the app
 */
export function triggerSessionUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mock-session-change"));
  }
}
