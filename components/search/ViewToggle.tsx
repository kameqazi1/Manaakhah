"use client";

import { cn } from "@/lib/utils";

export type ViewMode = "list" | "map" | "split";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const modes: { key: ViewMode; label: string; icon: string }[] = [
    { key: "list", label: "List", icon: "▤" },
    { key: "map", label: "Map", icon: "📍" },
    { key: "split", label: "Split", icon: "◫" },
  ];

  return (
    <div className="flex border rounded-lg overflow-hidden">
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => onChange(mode.key)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1",
            value === mode.key
              ? "bg-primary text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          <span className="hidden sm:inline">{mode.icon}</span>
          {mode.label}
        </button>
      ))}
    </div>
  );
}
