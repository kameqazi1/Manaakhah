"use client";

import Link from "next/link";
import { useMockSession, useMockSignOut } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useMockSession();
  const signOut = useMockSignOut();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Manakhaah</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/search" className="text-sm font-medium hover:text-primary">
            Find Services
          </Link>
          <Link href="/community" className="text-sm font-medium hover:text-primary">
            Community
          </Link>
          {session && (
            <>
              <Link href="/bookings" className="text-sm font-medium hover:text-primary">
                Bookings
              </Link>
              <Link href="/messages" className="text-sm font-medium hover:text-primary">
                Messages
              </Link>
            </>
          )}
          {session?.user.role === "BUSINESS_OWNER" && (
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
              My Listings
            </Link>
          )}
          {session?.user.role === "ADMIN" && (
            <Link href="/admin" className="text-sm font-medium hover:text-primary">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  {session.user.name || "Account"}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
