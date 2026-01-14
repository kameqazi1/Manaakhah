"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useMockSession, useMockSignOut } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header() {
  const { data: session } = useMockSession();
  const signOut = useMockSignOut();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isBusinessOwner = session?.user?.role === "BUSINESS_OWNER";
  const isAdmin = session?.user?.role === "ADMIN";

  const handleMouseEnter = (dropdown: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150); // 150ms delay before closing
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Manakhaah</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {/* Discover Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("discover")}
            onMouseLeave={handleMouseLeave}
          >
            <button className="px-4 py-2 text-sm font-medium hover:text-primary hover:bg-gray-50 rounded-md">
              Discover
            </button>
            {activeDropdown === "discover" && (
              <div className="absolute left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg py-2 z-50">
                <Link href="/search" className="block px-4 py-2 text-sm hover:bg-gray-50">
                  🔍 Find Businesses
                </Link>
                <Link href="/events" className="block px-4 py-2 text-sm hover:bg-gray-50">
                  📅 Events Calendar
                </Link>
                <Link href="/community" className="block px-4 py-2 text-sm hover:bg-gray-50">
                  👥 Community
                </Link>
                <hr className="my-2" />
                <Link href="/favorites" className="block px-4 py-2 text-sm hover:bg-gray-50">
                  ❤️ My Favorites
                </Link>
                <Link href="/referrals" className="block px-4 py-2 text-sm hover:bg-gray-50">
                  🎁 Referral Program
                </Link>
              </div>
            )}
          </div>

          {/* For Business Owners */}
          {session && (
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("business")}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-4 py-2 text-sm font-medium hover:text-primary hover:bg-gray-50 rounded-md">
                For Business
              </button>
              {activeDropdown === "business" && (
                <div className="absolute left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg py-2 z-50">
                  {isBusinessOwner ? (
                    <>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        📊 Dashboard
                      </Link>
                      <Link href="/dashboard/analytics" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        📈 Analytics
                      </Link>
                      <Link href="/dashboard/deals" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        🏷️ Deals & Offers
                      </Link>
                      <Link href="/dashboard/services" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        📋 Service Menu
                      </Link>
                      <Link href="/dashboard/updates" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        📢 Updates & News
                      </Link>
                      <hr className="my-2" />
                      <Link href="/bookings" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        📆 Bookings
                      </Link>
                      <Link href="/messages" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        💬 Messages
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/claim-business" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        ✅ Claim Your Business
                      </Link>
                      <Link href="/business/register" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        ➕ Add Your Business
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Admin Menu */}
          {isAdmin && (
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("admin")}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-4 py-2 text-sm font-medium hover:text-primary hover:bg-gray-50 rounded-md text-red-600">
                Admin
              </button>
              {activeDropdown === "admin" && (
                <div className="absolute left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg py-2 z-50">
                  <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    🏠 Admin Dashboard
                  </Link>
                  <Link href="/admin/businesses" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    🏪 Manage Businesses
                  </Link>
                  <Link href="/admin/users" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    👤 Manage Users
                  </Link>
                  <Link href="/admin/reviews" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    ⭐ Manage Reviews
                  </Link>
                  <Link href="/admin/categories" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    📂 Categories
                  </Link>
                  <hr className="my-2" />
                  <Link href="/admin/analytics/businesses" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    📊 Business Analytics
                  </Link>
                  <Link href="/admin/analytics/engagement" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    📈 Engagement Stats
                  </Link>
                  <hr className="my-2" />
                  <Link href="/admin/settings" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    ⚙️ Settings
                  </Link>
                  <Link href="/admin/export" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    📤 Export Data
                  </Link>
                  <Link href="/admin/import" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    📥 Import Data
                  </Link>
                  <Link href="/admin/backup" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    💾 Backup
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Direct Links */}
          <Link href="/events" className="px-4 py-2 text-sm font-medium hover:text-primary hover:bg-gray-50 rounded-md">
            Events
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          {session && <NotificationBell />}

          {session ? (
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("user")}
              onMouseLeave={handleMouseLeave}
            >
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium">
                  {session.user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
                <span className="hidden md:inline">{session.user?.name || "Account"}</span>
              </Button>
              {activeDropdown === "user" && (
                <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg py-2 z-50">
                  <Link href="/dashboard" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    My Dashboard
                  </Link>
                  <Link href="/favorites" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    My Favorites
                  </Link>
                  <Link href="/referrals" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Referrals
                  </Link>
                  <Link href="/bookings" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Bookings
                  </Link>
                  <Link href="/messages" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Messages
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Discover Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Discover</h3>
              <div className="space-y-1">
                <Link href="/search" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  🔍 Find Businesses
                </Link>
                <Link href="/events" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  📅 Events Calendar
                </Link>
                <Link href="/community" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  👥 Community
                </Link>
                <Link href="/favorites" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  ❤️ My Favorites
                </Link>
                <Link href="/referrals" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  🎁 Referral Program
                </Link>
              </div>
            </div>

            {/* For Business Section */}
            {session && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">For Business</h3>
                <div className="space-y-1">
                  {isBusinessOwner ? (
                    <>
                      <Link href="/dashboard" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        📊 Dashboard
                      </Link>
                      <Link href="/dashboard/analytics" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        📈 Analytics
                      </Link>
                      <Link href="/dashboard/deals" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        🏷️ Deals & Offers
                      </Link>
                      <Link href="/dashboard/services" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        📋 Service Menu
                      </Link>
                      <Link href="/dashboard/updates" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        📢 Updates & News
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/claim-business" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        ✅ Claim Your Business
                      </Link>
                      <Link href="/business/register" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        ➕ Add Your Business
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Admin Section */}
            {isAdmin && (
              <div>
                <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Admin</h3>
                <div className="space-y-1">
                  <Link href="/admin" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    🏠 Admin Dashboard
                  </Link>
                  <Link href="/admin/businesses" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    🏪 Manage Businesses
                  </Link>
                  <Link href="/admin/users" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    👤 Manage Users
                  </Link>
                  <Link href="/admin/reviews" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    ⭐ Manage Reviews
                  </Link>
                  <Link href="/admin/categories" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    📂 Categories
                  </Link>
                  <Link href="/admin/settings" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    ⚙️ Settings
                  </Link>
                </div>
              </div>
            )}

            {/* Account Section */}
            {session && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account</h3>
                <div className="space-y-1">
                  <Link href="/bookings" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    📆 Bookings
                  </Link>
                  <Link href="/messages" className="block py-2 text-sm hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    💬 Messages
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-sm text-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Auth buttons for non-logged in users */}
            {!session && (
              <div className="flex gap-2 pt-4 border-t">
                <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
