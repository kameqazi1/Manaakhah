/**
 * Mock Authentication System
 * Bypasses NextAuth for local development
 */

import { mockStorage } from "./mock-data/storage";
import type { MockUser, UserRole } from "./mock-data/types";

const MOCK_SESSION_KEY = "manakhaah-mock-session";

export interface MockSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    image: string | null;
  };
}

/**
 * Mock login - just checks if user exists with matching password
 */
export function mockLogin(email: string, password: string): MockUser | null {
  const users = mockStorage.getUsers();
  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (user) {
    // Store session in localStorage
    if (typeof window !== "undefined") {
      const session: MockSession = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        },
      };
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    }
    return user;
  }

  return null;
}

/**
 * Mock register - creates new user
 */
export function mockRegister(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}): MockUser {
  const users = mockStorage.getUsers();

  // Check if user already exists
  if (users.find((u) => u.email === data.email)) {
    throw new Error("User already exists");
  }

  // Check for auto-admin
  const isAdmin = data.email.toLowerCase().includes("admin");

  const newUser: MockUser = {
    id: mockStorage.generateId("user"),
    email: data.email,
    password: data.password, // In mock mode, we store plain text (never do this in production!)
    name: data.name,
    phone: data.phone || null,
    role: isAdmin ? "ADMIN" : data.role || "CONSUMER",
    image: null,
    emailVerified: new Date(), // Auto-verify in mock mode
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.push(newUser);
  mockStorage.setUsers(users);

  return newUser;
}

/**
 * Get current session from localStorage
 */
export function getMockSession(): MockSession | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(MOCK_SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Set mock session (for role switching)
 */
export function setMockSession(userId: string) {
  const users = mockStorage.getUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    throw new Error("User not found");
  }

  const session: MockSession = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    },
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

/**
 * Mock logout
 */
export function mockLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(MOCK_SESSION_KEY);
  }
}

/**
 * Switch role (for testing)
 * This allows you to quickly switch between consumer/business/admin
 */
export function switchMockRole(role: UserRole) {
  const users = mockStorage.getUsers();
  const user = users.find((u) => u.role === role);

  if (!user) {
    throw new Error(`No ${role} user found in mock data`);
  }

  return setMockSession(user.id);
}

/**
 * Get all available mock users (for role switcher UI)
 */
export function getAvailableMockUsers() {
  return mockStorage.getUsers().map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
  }));
}
