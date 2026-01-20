"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useMockSession, useMockSignOut } from "@/components/mock-session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Search, Menu, X, ChevronDown, Building2, Calendar, Users, Bookmark, Camera, Scale, Heart, ClipboardList, TrendingUp, LayoutDashboard, Tag, Settings, CheckCircle, PlusCircle, Store, User, Star, BarChart3, CalendarDays, MessageCircle, Home } from "lucide-react";

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
    }, 150);
  };

  return (
    <header className="sticky top-0 z-[1000] w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-green-600">Manakhaah</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Discover Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("discover")}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium hover:text-green-600 rounded-md transition-colors">
                  Discover
                  <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === "discover" && (
                  <div className="absolute left-0 mt-1 w-64 bg-white border rounded-xl shadow-lg py-2 z-50">
                    <Link href="/search" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <Search className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-medium">Find Businesses</div>
                        <div className="text-xs text-gray-500">Search our directory</div>
                      </div>
                    </Link>
                    <Link href="/search/image" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <Camera className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-medium">Image Search</div>
                        <div className="text-xs text-gray-500">Search by photo</div>
                      </div>
                    </Link>
                    <Link href="/compare" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <Scale className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-medium">Compare</div>
                        <div className="text-xs text-gray-500">Side-by-side comparison</div>
                      </div>
                    </Link>
                    <hr className="my-2" />
                    <Link href="/favorites" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <Heart className="w-4 h-4 text-gray-500" />
                      <span>My Favorites</span>
                    </Link>
                    <Link href="/saved-searches" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <Bookmark className="w-4 h-4 text-gray-500" />
                      <span>Saved Searches</span>
                    </Link>
                    <Link href="/lists" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <ClipboardList className="w-4 h-4 text-gray-500" />
                      <span>My Lists</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Events Link */}
              <Link href="/events" className="flex items-center gap-1 px-3 py-2 text-sm font-medium hover:text-green-600 rounded-md transition-colors">
                <Calendar className="w-4 h-4 mr-1" />
                Events
              </Link>

              {/* Community Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("community")}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium hover:text-green-600 rounded-md transition-colors">
                  Community
                  <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === "community" && (
                  <div className="absolute left-0 mt-1 w-64 bg-white border rounded-xl shadow-lg py-2 z-50">
                    <Link href="/community-impact" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <Heart className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="font-medium">Economic Impact</div>
                        <div className="text-xs text-gray-500">Track community growth</div>
                      </div>
                    </Link>
                    <Link href="/forum" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-medium">Community Forum</div>
                        <div className="text-xs text-gray-500">Join discussions</div>
                      </div>
                    </Link>
                    <Link href="/prayer-times" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <img src="/icons/mosque.png" alt="Prayer Times" className="w-4 h-4" />
                      <span>Prayer Times</span>
                    </Link>
                    <Link href="/trends" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span>Trend Reports</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* For Business Dropdown */}
              {session && (
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnter("business")}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium hover:text-green-600 rounded-md transition-colors">
                    <Building2 className="w-4 h-4 mr-1" />
                    For Business
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {activeDropdown === "business" && (
                    <div className="absolute left-0 mt-1 w-64 bg-white border rounded-xl shadow-lg py-2 z-50">
                      {isBusinessOwner ? (
                        <>
                          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                            <LayoutDashboard className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="font-medium">Dashboard</div>
                              <div className="text-xs text-gray-500">Manage your business</div>
                            </div>
                          </Link>
                          <Link href="/dashboard/analytics" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                            <BarChart3 className="w-4 h-4 text-gray-500" />
                            <span>Analytics</span>
                          </Link>
                          <Link href="/dashboard/deals" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                            <Tag className="w-4 h-4 text-gray-500" />
                            <span>Deals & Offers</span>
                          </Link>
                          <Link href="/dashboard/services" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                            <ClipboardList className="w-4 h-4 text-gray-500" />
                            <span>Service Menu</span>
                          </Link>
                          <hr className="my-2" />
                          <Link href="/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                            <CalendarDays className="w-4 h-4 text-gray-500" />
                            <span>Bookings</span>
                          </Link>
                          <Link href="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                            <MessageCircle className="w-4 h-4 text-gray-500" />
                            <span>Messages</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/claim-business" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                            <CheckCircle className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="font-medium">Claim Your Business</div>
                              <div className="text-xs text-gray-500">Verify ownership</div>
                            </div>
                          </Link>
                          <Link href="/business/register" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                            <PlusCircle className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="font-medium">Add Your Business</div>
                              <div className="text-xs text-gray-500">Get listed for free</div>
                            </div>
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
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 rounded-md transition-colors">
                    Admin
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {activeDropdown === "admin" && (
                    <div className="absolute left-0 mt-1 w-56 bg-white border rounded-xl shadow-lg py-2 z-50">
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <Home className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                      <Link href="/admin/businesses" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <Store className="w-4 h-4" />
                        Manage Businesses
                      </Link>
                      <Link href="/admin/users" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <User className="w-4 h-4" />
                        Manage Users
                      </Link>
                      <Link href="/admin/reviews" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <Star className="w-4 h-4" />
                        Manage Reviews
                      </Link>
                      <hr className="my-2" />
                      <Link href="/admin/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Search Bar & Actions */}
          <div className="flex items-center gap-3">
            {/* Desktop Search */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search businesses..."
                className="w-48 border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>

            {/* Mobile Search Button */}
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Search className="w-5 h-5" />
            </Button>

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
                  <ChevronDown className="w-4 h-4 hidden md:block" />
                </Button>
                {activeDropdown === "user" && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="font-medium">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                    <Link href="/dashboard" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
                      My Dashboard
                    </Link>
                    <Link href={`/profile/${session.user?.id}`} className="block px-4 py-2.5 text-sm hover:bg-gray-50">
                      My Profile
                    </Link>
                    <Link href="/favorites" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
                      My Favorites
                    </Link>
                    <Link href="/lists" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
                      My Lists
                    </Link>
                    <Link href="/bookings" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
                      Bookings
                    </Link>
                    <Link href="/messages" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
                      Messages
                    </Link>
                    <hr className="my-2" />
                    <Link href="/settings/notifications" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
                      Settings
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile Search */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 mb-4">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search businesses..."
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>

            <div className="space-y-6">
              {/* Discover Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Discover</h3>
                <div className="space-y-1">
                  <Link href="/search" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                    Find Businesses
                  </Link>
                  <Link href="/search/image" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                    Image Search
                  </Link>
                  <Link href="/compare" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                    Compare Businesses
                  </Link>
                  <Link href="/events" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                    Events
                  </Link>
                </div>
              </div>

              {/* Community Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Community</h3>
                <div className="space-y-1">
                  <Link href="/community-impact" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                    Economic Impact
                  </Link>
                  <Link href="/forum" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                    Community Forum
                  </Link>
                  <Link href="/prayer-times" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                    Prayer Times
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
                        <Link href="/dashboard" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                          Dashboard
                        </Link>
                        <Link href="/dashboard/analytics" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                          Analytics
                        </Link>
                        <Link href="/bookings" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                          Bookings
                        </Link>
                        <Link href="/messages" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                          Messages
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/claim-business" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                          Claim Your Business
                        </Link>
                        <Link href="/business/register" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                          Add Your Business
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
                    <Link href="/admin" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                    <Link href="/admin/businesses" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Manage Businesses
                    </Link>
                    <Link href="/admin/users" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Manage Users
                    </Link>
                  </div>
                </div>
              )}

              {/* Account Section */}
              {session && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account</h3>
                  <div className="space-y-1">
                    <Link href={`/profile/${session.user?.id}`} className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      My Profile
                    </Link>
                    <Link href="/favorites" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      My Favorites
                    </Link>
                    <Link href="/lists" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      My Lists
                    </Link>
                    <Link href="/settings/notifications" className="block py-2 text-sm hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Settings
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
                    <Button className="w-full bg-green-600 hover:bg-green-700">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
