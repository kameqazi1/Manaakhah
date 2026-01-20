'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef, MapMouseEvent } from 'react-map-gl/maplibre';
import type { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { clusterLayer, clusterCountLayer, unclusteredPointLayer } from './clusterLayers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CATEGORIES, BUSINESS_TAGS } from './BusinessMap';
import { UserLocationMarker } from './UserLocationMarker';

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

// Haversine formula for distance calculation in miles
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapLibreMap({
  businesses,
  userLat,
  userLng,
  radius,
}: MapLibreMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Request user's geolocation
  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('Unable to get location');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 min cache
      }
    );
  }, []);

  // Request location on mount
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Compute distances for businesses based on user location
  const businessesWithDistance = useMemo(() => {
    const userPos = userLocation || { lat: userLat, lng: userLng };
    return businesses.map((business) => ({
      ...business,
      distance: calculateDistance(
        userPos.lat,
        userPos.lng,
        business.latitude,
        business.longitude
      ),
    }));
  }, [businesses, userLocation, userLat, userLng]);

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

  // Convert businesses to GeoJSON FeatureCollection for clustering
  const geojsonData = useMemo((): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
    type: 'FeatureCollection',
    features: businessesWithDistance.map(business => ({
      type: 'Feature',
      properties: {
        id: business.id,
        name: business.name,
        category: business.category,
        address: business.address,
        city: business.city,
        averageRating: business.averageRating,
        reviewCount: business.reviewCount,
        distance: business.distance,
        tags: business.tags,
        imageUrl: business.imageUrl
      },
      geometry: {
        type: 'Point',
        coordinates: [business.longitude, business.latitude]
      }
    }))
  }), [businessesWithDistance]);

  // Unified click handler for clusters and individual points
  const onMapClick = useCallback(async (event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setSelectedBusiness(null);
      return;
    }

    // Cluster click - zoom to expand
    const clusterId = feature.properties?.cluster_id;
    if (clusterId !== undefined) {
      const source = mapRef.current?.getSource('businesses') as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      mapRef.current?.easeTo({
        center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
        zoom,
        duration: 500
      });
      return;
    }

    // Individual point click - show popup
    const businessId = feature.properties?.id;
    const business = businessesWithDistance.find(b => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
    }
  }, [businessesWithDistance]);

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
              interactiveLayerIds={['clusters', 'unclustered-point']}
              onClick={onMapClick}
            >
              <NavigationControl position="top-right" />

              {/* Center on my location button */}
              <button
                onClick={() => {
                  if (userLocation) {
                    mapRef.current?.flyTo({
                      center: [userLocation.lng, userLocation.lat],
                      zoom: 14,
                      duration: 1000,
                    });
                  } else {
                    requestUserLocation();
                  }
                }}
                disabled={isLocating}
                className="absolute top-24 right-2 z-10 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 disabled:opacity-50"
                title="Center on my location"
              >
                {isLocating ? (
                  <span className="w-5 h-5 block border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>

              {/* User location marker - show at geolocation or fallback to props */}
              {userLocation ? (
                <UserLocationMarker
                  latitude={userLocation.lat}
                  longitude={userLocation.lng}
                />
              ) : (
                <UserLocationMarker
                  latitude={userLat}
                  longitude={userLng}
                />
              )}

              {/* Business markers with clustering */}
              <Source
                id="businesses"
                type="geojson"
                data={geojsonData}
                cluster={true}
                clusterMaxZoom={14}
                clusterRadius={50}
              >
                <Layer {...clusterLayer} />
                <Layer {...clusterCountLayer} />
                <Layer {...unclusteredPointLayer} />
              </Source>

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

              {/* Location error message */}
              {locationError && (
                <div className="absolute bottom-4 left-4 z-10 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                  {locationError}
                </div>
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
