"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export interface MapSearchFilters {
  search: string;
  category: string;
  tags: string[];
  distance: string;
  sort: string;
  priceRange: string;
  minRating: string;
  // Bounds override lat/lng/distance when present
  ne_lat: string | null;
  ne_lng: string | null;
  sw_lat: string | null;
  sw_lng: string | null;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  reviewCount: number;
  priceRange?: string;
  verificationStatus?: string;
  tags: { tag: string }[];
  photos: { url: string }[];
  distance?: number;
}

export function useMapSearch(
  userLocation: { lat: number; lng: number } | null
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse filters from URL
  const filters: MapSearchFilters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      tags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
      distance: searchParams.get("distance") || "25",
      sort: searchParams.get("sort") || "distance",
      priceRange: searchParams.get("priceRange") || "",
      minRating: searchParams.get("minRating") || "",
      ne_lat: searchParams.get("ne_lat"),
      ne_lng: searchParams.get("ne_lng"),
      sw_lat: searchParams.get("sw_lat"),
      sw_lng: searchParams.get("sw_lng"),
    }),
    [searchParams]
  );

  // Update filters (merges with existing)
  const setFilters = useCallback(
    (updates: Partial<MapSearchFilters>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          value.length > 0
            ? params.set(key, value.join(","))
            : params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Fetch businesses with React Query
  const {
    data: businesses = [],
    isLoading,
    error,
  } = useQuery<Business[]>({
    queryKey: ["businesses", filters, userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", "PUBLISHED");

      if (filters.search) params.set("search", filters.search);
      if (filters.category) params.set("category", filters.category);
      if (filters.tags.length) params.set("tags", filters.tags.join(","));
      if (filters.priceRange) params.set("priceRange", filters.priceRange);
      if (filters.minRating) params.set("minRating", filters.minRating);

      // Use bounds if available, otherwise use radius
      if (filters.ne_lat && filters.sw_lat) {
        params.set("ne_lat", filters.ne_lat);
        params.set("ne_lng", filters.ne_lng!);
        params.set("sw_lat", filters.sw_lat);
        params.set("sw_lng", filters.sw_lng!);
      } else if (userLocation) {
        params.set("lat", String(userLocation.lat));
        params.set("lng", String(userLocation.lng));
        params.set("radius", filters.distance);
      }

      const res = await fetch(`/api/businesses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch businesses");
      return res.json();
    },
    enabled: !!(userLocation || (filters.ne_lat && filters.sw_lat)),
    staleTime: 30000,
  });

  return {
    filters,
    setFilters,
    businesses,
    isLoading,
    error,
  };
}
