'use client';

import { Marker, Popup } from 'react-map-gl/maplibre';
import { useState } from 'react';

interface UserLocationMarkerProps {
  latitude: number;
  longitude: number;
}

export function UserLocationMarker({ latitude, longitude }: UserLocationMarkerProps) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <Marker
        latitude={latitude}
        longitude={longitude}
        anchor="center"
      >
        <div
          className="relative cursor-pointer"
          onClick={() => setShowPopup(!showPopup)}
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
        >
          {/* Pulse ring */}
          <div className="absolute inset-0 w-6 h-6 bg-blue-500 rounded-full opacity-30 animate-ping" />
          {/* Solid center dot */}
          <div
            className="relative w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"
            style={{ margin: '4px' }}
          />
        </div>
      </Marker>

      {showPopup && (
        <Popup
          latitude={latitude}
          longitude={longitude}
          anchor="bottom"
          offset={15}
          closeButton={false}
          closeOnClick={false}
        >
          <div className="px-2 py-1 text-sm font-medium">
            Your Location
          </div>
        </Popup>
      )}
    </>
  );
}
