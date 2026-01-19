"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getMockSession, mockLogout, type MockSession } from "@/lib/mock-auth";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

interface MockSessionContextType {
  data: MockSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => void;
}

const MockSessionContext = createContext<MockSessionContextType>({
  data: null,
  status: "loading",
  update: () => {},
});

export function MockSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MockSession | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const loadSession = () => {
    if (USE_MOCK_DATA) {
      const mockSession = getMockSession();
      setSession(mockSession);
      setStatus(mockSession ? "authenticated" : "unauthenticated");
    } else {
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    loadSession();
    // Note: sessionStorage doesn't fire storage events cross-tab, which is intentional
    // Each tab has its own independent session
  }, []);

  return (
    <MockSessionContext.Provider
      value={{
        data: session,
        status,
        update: loadSession,
      }}
    >
      {children}
    </MockSessionContext.Provider>
  );
}

export function useMockSession() {
  return useContext(MockSessionContext);
}

/**
 * Hook that works with both real NextAuth and mock auth
 */
export function useUnifiedSession() {
  const mockSession = useMockSession();

  if (USE_MOCK_DATA) {
    return {
      data: mockSession.data,
      status: mockSession.status,
      update: mockSession.update,
    };
  }

  // Fall through to NextAuth if not in mock mode
  // This will be handled by the actual SessionProvider
  return {
    data: null,
    status: "unauthenticated" as const,
    update: () => {},
  };
}

/**
 * Mock sign out function
 */
export function useMockSignOut() {
  const { update } = useMockSession();

  return () => {
    mockLogout();
    update();
  };
}
