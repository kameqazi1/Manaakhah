"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600">
            It looks like you've lost your internet connection. Some features may not be available.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="font-medium text-gray-900 mb-2">
              Available Offline
            </h2>
            <ul className="text-sm text-gray-600 text-left space-y-1">
              <li>• Previously viewed business pages</li>
              <li>• Saved businesses</li>
              <li>• Your bookings history</li>
              <li>• Prayer times (if cached)</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            Your pending actions will be synced when you're back online.
          </p>
        </div>
      </div>
    </div>
  );
}
