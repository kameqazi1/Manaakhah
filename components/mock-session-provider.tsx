"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SessionProvider, useSession } from "next-auth/react";
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

function MockSessionInner({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MockSession | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const loadSession = () => {
    const mockSession = getMockSession();
    setSession(mockSession);
    setStatus(mockSession ? "authenticated" : "unauthenticated");
  };

  useEffect(() => {
    loadSession();
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

export function MockSessionProvider({ children }: { children: ReactNode }) {
  if (USE_MOCK_DATA) {
    return <MockSessionInner>{children}</MockSessionInner>;
  }

  // In production, wrap with NextAuth SessionProvider
  return <SessionProvider>{children}</SessionProvider>;
}

/**
 * Hook that returns mock context (for mock mode internal use)
 */
function useMockContext() {
  return useContext(MockSessionContext);
}

/**
 * Unified session hook that works with both mock and real auth
 */
export function useMockSession() {
  // In production mode, use NextAuth's useSession
  // This hook will be called inside SessionProvider
  const nextAuthSession = USE_MOCK_DATA ? null : useSession();
  const mockContext = useMockContext();

  if (USE_MOCK_DATA) {
    return mockContext;
  }

  // Map NextAuth session to our interface
  return {
    data: nextAuthSession?.data ? {
      user: {
        id: nextAuthSession.data.user?.id || "",
        email: nextAuthSession.data.user?.email || "",
        name: nextAuthSession.data.user?.name || "",
        role: (nextAuthSession.data.user as any)?.role || "CONSUMER",
        image: nextAuthSession.data.user?.image || null,
      },
      expires: nextAuthSession.data.expires,
    } : null,
    status: nextAuthSession?.status || "loading",
    update: () => nextAuthSession?.update?.(),
  };
}

/**
 * Hook that works with both real NextAuth and mock auth
 */
export function useUnifiedSession() {
  return useMockSession();
}

/**
 * Sign out function that works with both mock and real auth
 */
export function useMockSignOut() {
  const { update } = useMockContext();

  return async () => {
    if (USE_MOCK_DATA) {
      mockLogout();
      update();
    } else {
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/login" });
    }
  };
}
