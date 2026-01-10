"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// @ts-ignore - markercluster doesn't have proper types
import "leaflet.markercluster";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CATEGORIES, BUSINESS_TAGS } from "./BusinessMap";

// Extend Leaflet namespace to include markerClusterGroup
declare module "leaflet" {
  function markerClusterGroup(options?: any): MarkerClusterGroup;

  interface MarkerClusterGroup extends L.LayerGroup {
    clearLayers(): this;
    addLayer(layer: L.Layer): this;
  }
}

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  reviewCount: number;
  distance?: number;
  tags?: string[];
  imageUrl?: string;
  description?: string;
}

interface LeafletMapProps {
  businesses: Business[];
  userLat: number;
  userLng: number;
  radius: number;
}

export default function LeafletMap({
  businesses,
  userLat,
  userLng,
  radius,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dynamically import markercluster to ensure it loads properly
    import("leaflet.markercluster").then(() => {
      initializeMap();
    });

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [userLat, userLng, radius]);

  const initializeMap = () => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [userLat, userLng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapRef.current = map;

    // Add custom tile layer (CartoDB Positron - clean, modern style)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add user location marker
    const userIcon = L.divIcon({
      className: "user-location-marker",
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 2;"></div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #3B82F6; border-radius: 50%; opacity: 0.3; animation: pulse 2s infinite;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([userLat, userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup("<strong>Your Location</strong>");

    // Add radius circle
    L.circle([userLat, userLng], {
      radius: radius * 1609.34, // Convert miles to meters
      color: "#3B82F6",
      fillColor: "#3B82F6",
      fillOpacity: 0.05,
      weight: 2,
      dashArray: "5, 10",
    }).addTo(map);

    // Initialize marker cluster group
    // Check if markerClusterGroup is available (loaded by the plugin)
    if (typeof (L as any).markerClusterGroup !== "function") {
      console.error("MarkerClusterGroup is not available");
      return;
    }

    const markers = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = "small";
        if (count > 10) size = "medium";
        if (count > 50) size = "large";

        return L.divIcon({
          html: `<div style="
            width: ${size === 'large' ? '50px' : size === 'medium' ? '40px' : '35px'};
            height: ${size === 'large' ? '50px' : size === 'medium' ? '40px' : '35px'};
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${size === 'large' ? '16px' : size === 'medium' ? '14px' : '12px'};
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: "marker-cluster",
          iconSize: L.point(
            size === 'large' ? 50 : size === 'medium' ? 40 : 35,
            size === 'large' ? 50 : size === 'medium' ? 40 : 35
          ),
        });
      },
    });

    markersLayerRef.current = markers;
    map.addLayer(markers);

    // Add custom CSS for animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.3;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.5);
          opacity: 0.1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.3;
        }
      }
      .leaflet-popup-content-wrapper {
        border-radius: 12px;
        padding: 0;
        overflow: hidden;
      }
      .leaflet-popup-content {
        margin: 0;
        width: 300px !important;
      }
      .leaflet-popup-tip {
        background: white;
      }
    `;
    document.head.appendChild(style);
  };

  // Update markers when businesses change
  useEffect(() => {
    if (!markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add new markers
    businesses.forEach((business) => {
      const category = CATEGORIES.find((c) => c.value === business.category);
      const categoryColor = category?.color || "#6B7280";
      const categoryIcon = category?.icon || "📍";

      // Create custom marker icon
      const icon = L.divIcon({
        className: "business-marker",
        html: `
          <div style="position: relative; cursor: pointer;">
            <div style="
              width: 40px;
              height: 40px;
              background: ${categoryColor};
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              box-shadow: 0 3px 10px rgba(0,0,0,0.3);
              transition: transform 0.2s;
            " class="marker-inner">${categoryIcon}</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([business.latitude, business.longitude], { icon });

      // Create rich popup content
      const popupContent = createPopupContent(business);
      marker.bindPopup(popupContent, {
        maxWidth: 300,
        minWidth: 300,
        className: "business-popup",
      });

      // Add hover effect
      marker.on("mouseover", function () {
        this.getElement()?.querySelector(".marker-inner")?.setAttribute(
          "style",
          `
            width: 40px;
            height: 40px;
            background: ${categoryColor};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            transition: transform 0.2s;
            transform: scale(1.2);
          `
        );
      });

      marker.on("mouseout", function () {
        this.getElement()?.querySelector(".marker-inner")?.setAttribute(
          "style",
          `
            width: 40px;
            height: 40px;
            background: ${categoryColor};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            transition: transform 0.2s;
            transform: scale(1);
          `
        );
      });

      marker.on("click", () => {
        setSelectedBusiness(business);
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Fit bounds to show all markers
    if (businesses.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        businesses.map((b) => [b.latitude, b.longitude])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [businesses]);

  const createPopupContent = (business: Business): string => {
    const category = CATEGORIES.find((c) => c.value === business.category);
    const businessTags = business.tags
      ?.map((tag) => BUSINESS_TAGS.find((t) => t.value === tag))
      .filter(Boolean)
      .slice(0, 3);

    return `
      <div style="padding: 0;">
        ${business.imageUrl ? `
          <img
            src="${business.imageUrl}"
            alt="${business.name}"
            style="width: 100%; height: 150px; object-fit: cover;"
          />
        ` : `
          <div style="width: 100%; height: 150px; background: linear-gradient(135deg, ${category?.color || '#6B7280'} 0%, ${adjustColor(category?.color || '#6B7280', -20)} 100%); display: flex; align-items: center; justify-content: center; font-size: 48px;">
            ${category?.icon || '📍'}
          </div>
        `}

        <div style="padding: 16px;">
          <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
            <div style="
              width: 36px;
              height: 36px;
              background: ${category?.color || '#6B7280'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              flex-shrink: 0;
            ">${category?.icon || '📍'}</div>
            <div style="flex: 1; min-width: 0;">
              <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827; line-height: 1.3;">
                ${business.name}
              </h3>
              <p style="margin: 0; font-size: 12px; color: #6B7280;">
                ${category?.label || business.category.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          ${business.averageRating > 0 ? `
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              <span style="color: #EAB308; font-size: 14px;">★</span>
              <span style="font-weight: 600; font-size: 14px; color: #111827;">
                ${business.averageRating.toFixed(1)}
              </span>
              <span style="font-size: 13px; color: #6B7280;">
                (${business.reviewCount} reviews)
              </span>
            </div>
          ` : ''}

          ${businessTags && businessTags.length > 0 ? `
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
              ${businessTags.map((tag) => `
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  padding: 4px 10px;
                  background: #DCFCE7;
                  color: #15803D;
                  border-radius: 12px;
                  font-size: 11px;
                  font-weight: 500;
                ">
                  ${tag?.icon} ${tag?.label}
                </span>
              `).join('')}
            </div>
          ` : ''}

          <p style="margin: 0 0 12px 0; font-size: 13px; color: #4B5563; line-height: 1.4;">
            📍 ${business.address}, ${business.city}
            ${business.distance !== undefined ? `<br/><span style="color: #6B7280;">📏 ${business.distance.toFixed(1)} miles away</span>` : ''}
          </p>

          <a
            href="/business/${business.id}"
            style="
              display: block;
              width: 100%;
              padding: 10px 16px;
              background: #3B82F6;
              color: white;
              text-align: center;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 500;
              font-size: 14px;
              transition: background 0.2s;
            "
            onmouseover="this.style.background='#2563EB'"
            onmouseout="this.style.background='#3B82F6'"
          >
            View Details →
          </a>
        </div>
      </div>
    `;
  };

  const adjustColor = (color: string, amount: number): string => {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Map */}
      <Card className="md:col-span-2">
        <CardContent className="p-0">
          <div
            ref={mapContainerRef}
            className="w-full h-[600px] rounded-lg overflow-hidden"
          />
        </CardContent>
      </Card>

      {/* Selected Business Details */}
      {selectedBusiness && (
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedBusiness.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBusiness(null)}
              >
                ✕
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600">Category</span>
                  <p className="text-base">
                    {CATEGORIES.find((c) => c.value === selectedBusiness.category)?.label ||
                      selectedBusiness.category.replace(/_/g, " ")}
                  </p>
                </div>

                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600">Location</span>
                  <p className="text-base">
                    {selectedBusiness.address}, {selectedBusiness.city}
                  </p>
                  {selectedBusiness.distance !== undefined && (
                    <p className="text-sm text-gray-500">
                      {selectedBusiness.distance.toFixed(1)} miles away
                    </p>
                  )}
                </div>

                {selectedBusiness.averageRating > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-600">Rating</span>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-lg">★</span>
                      <span className="text-base font-semibold">
                        {selectedBusiness.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({selectedBusiness.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {selectedBusiness.tags && selectedBusiness.tags.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-600 block mb-2">
                      Features
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedBusiness.tags.map((tag) => {
                        const tagInfo = BUSINESS_TAGS.find((t) => t.value === tag);
                        return tagInfo ? (
                          <span
                            key={tag}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                          >
                            {tagInfo.icon} {tagInfo.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <Link href={`/business/${selectedBusiness.id}`}>
                  <Button className="w-full">View Full Details →</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
