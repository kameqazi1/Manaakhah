'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CATEGORIES, BUSINESS_TAGS } from './BusinessMap';

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

interface MapLibreMapProps {
  businesses: Business[];
  userLat: number;
  userLng: number;
  radius: number;
}

export default function MapLibreMap({
  businesses,
  userLat,
  userLng,
  radius,
}: MapLibreMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [hoveredBusinessId, setHoveredBusinessId] = useState<string | null>(null);

  // Fit bounds when businesses change
  useEffect(() => {
    if (!mapRef.current || businesses.length === 0) return;

    // Calculate bounds from all business coordinates
    const lats = businesses.map(b => b.latitude);
    const lngs = businesses.map(b => b.longitude);

    const minLat = Math.min(...lats, userLat);
    const maxLat = Math.max(...lats, userLat);
    const minLng = Math.min(...lngs, userLng);
    const maxLng = Math.max(...lngs, userLng);

    // Add padding
    const padding = 0.01;

    mapRef.current.fitBounds(
      [
        [minLng - padding, minLat - padding],
        [maxLng + padding, maxLat + padding]
      ],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
        duration: 1000
      }
    );
  }, [businesses, userLat, userLng]);

  const handleMarkerClick = useCallback((business: Business) => {
    setSelectedBusiness(business);
  }, []);

  const adjustColor = (color: string, amount: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const getCategoryInfo = (categoryValue: string) => {
    return CATEGORIES.find(c => c.value === categoryValue) || {
      value: categoryValue,
      label: categoryValue.replace(/_/g, ' '),
      icon: '📍',
      color: '#6B7280'
    };
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Map */}
      <Card className="md:col-span-2">
        <CardContent className="p-0">
          <div className="w-full h-[600px] rounded-lg overflow-hidden">
            <Map
              ref={mapRef}
              initialViewState={{
                latitude: userLat,
                longitude: userLng,
                zoom: 13
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`}
            >
              <NavigationControl position="top-right" />

              {/* User location marker with pulse animation */}
              <Marker
                latitude={userLat}
                longitude={userLng}
                anchor="center"
              >
                <div className="relative w-6 h-6">
                  <div
                    className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-500 border-[3px] border-white rounded-full shadow-lg z-10"
                    style={{ transform: 'translate(-50%, -50%)' }}
                  />
                  <div
                    className="absolute top-1/2 left-1/2 w-6 h-6 bg-blue-500 rounded-full opacity-30 animate-pulse"
                    style={{ transform: 'translate(-50%, -50%)' }}
                  />
                </div>
              </Marker>

              {/* Business markers */}
              {businesses.map((business) => {
                const category = getCategoryInfo(business.category);
                const isHovered = hoveredBusinessId === business.id;

                return (
                  <Marker
                    key={business.id}
                    latitude={business.latitude}
                    longitude={business.longitude}
                    anchor="center"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      handleMarkerClick(business);
                    }}
                  >
                    <div
                      className="cursor-pointer transition-transform duration-200"
                      style={{ transform: isHovered ? 'scale(1.25)' : 'scale(1)' }}
                      onMouseEnter={() => setHoveredBusinessId(business.id)}
                      onMouseLeave={() => setHoveredBusinessId(null)}
                    >
                      <div className="relative">
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            background: category.color,
                            border: '4px solid white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            boxShadow: isHovered
                              ? '0 6px 16px rgba(0,0,0,0.5)'
                              : '0 4px 12px rgba(0,0,0,0.4)',
                            position: 'relative',
                            zIndex: 2,
                          }}
                        >
                          {category.icon}
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) scale(${isHovered ? 1.5 : 1})`,
                            width: '44px',
                            height: '44px',
                            background: category.color,
                            borderRadius: '50%',
                            opacity: isHovered ? 0.4 : 0.3,
                            zIndex: 1,
                            transition: 'all 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </Marker>
                );
              })}

              {/* Popup for selected business */}
              {selectedBusiness && (
                <Popup
                  latitude={selectedBusiness.latitude}
                  longitude={selectedBusiness.longitude}
                  anchor="bottom"
                  onClose={() => setSelectedBusiness(null)}
                  closeButton={true}
                  closeOnClick={false}
                  maxWidth="320px"
                  className="maplibre-popup"
                >
                  <div className="w-[300px]">
                    {/* Image or gradient header */}
                    {selectedBusiness.imageUrl ? (
                      <img
                        src={selectedBusiness.imageUrl}
                        alt={selectedBusiness.name}
                        className="w-full h-[150px] object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-[150px] flex items-center justify-center text-5xl"
                        style={{
                          background: `linear-gradient(135deg, ${getCategoryInfo(selectedBusiness.category).color} 0%, ${adjustColor(getCategoryInfo(selectedBusiness.category).color, -20)} 100%)`
                        }}
                      >
                        {getCategoryInfo(selectedBusiness.category).icon}
                      </div>
                    )}

                    <div className="p-4">
                      {/* Header with icon and name */}
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: getCategoryInfo(selectedBusiness.category).color }}
                        >
                          {getCategoryInfo(selectedBusiness.category).icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 leading-tight mb-1">
                            {selectedBusiness.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {getCategoryInfo(selectedBusiness.category).label}
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      {selectedBusiness.averageRating > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-yellow-500 text-sm">&#9733;</span>
                          <span className="font-semibold text-sm text-gray-900">
                            {selectedBusiness.averageRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({selectedBusiness.reviewCount} reviews)
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {selectedBusiness.tags && selectedBusiness.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {selectedBusiness.tags.slice(0, 3).map((tagValue) => {
                            const tag = BUSINESS_TAGS.find(t => t.value === tagValue);
                            if (!tag) return null;
                            return (
                              <span
                                key={tagValue}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-xl text-xs font-medium"
                              >
                                {tag.icon} {tag.label}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Address and distance */}
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="mr-1">📍</span>
                        {selectedBusiness.address}, {selectedBusiness.city}
                        {selectedBusiness.distance !== undefined && (
                          <>
                            <br />
                            <span className="text-gray-500">
                              📏 {selectedBusiness.distance.toFixed(1)} miles away
                            </span>
                          </>
                        )}
                      </p>

                      {/* View Details button */}
                      <Link href={`/business/${selectedBusiness.id}`}>
                        <Button className="w-full">
                          View Details &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        </CardContent>
      </Card>

      {/* Selected Business Details Card (below map) */}
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
                &#10005;
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600">Category</span>
                  <p className="text-base">
                    {getCategoryInfo(selectedBusiness.category).label}
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
                      <span className="text-yellow-500 text-lg">&#9733;</span>
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
                      {selectedBusiness.tags.map((tagValue) => {
                        const tagInfo = BUSINESS_TAGS.find(t => t.value === tagValue);
                        return tagInfo ? (
                          <span
                            key={tagValue}
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
                  <Button className="w-full">View Full Details &rarr;</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom styles for MapLibre popup */}
      <style jsx global>{`
        .maplibregl-popup-content {
          padding: 0 !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .maplibregl-popup-close-button {
          font-size: 18px;
          padding: 8px 12px;
          color: #6B7280;
        }
        .maplibregl-popup-close-button:hover {
          background: transparent;
          color: #111827;
        }
        .maplibregl-popup-tip {
          border-top-color: white !important;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.1;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}
