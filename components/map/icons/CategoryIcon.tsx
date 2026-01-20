"use client";

import Image from "next/image";

// Map category values to icon file names
const CATEGORY_ICON_MAP: Record<string, string> = {
  ALL: "all-categories",
  RESTAURANT: "restaurant",
  HALAL_MARKET: "halal-market",
  MASJID: "mosque",
  AUTO_REPAIR: "car-repair",
  TUTORING: "tutoring",
  HEALTH_WELLNESS: "health-wellness",
  LEGAL_SERVICES: "legal",
  BARBER_SALON: "barber",
  PLUMBING: "plumbing",
  ELECTRICAL: "electrical",
  REAL_ESTATE: "real-estate",
  OTHER: "other",
};

interface CategoryIconProps {
  category: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ category, size = 20, className = "" }: CategoryIconProps) {
  const iconName = CATEGORY_ICON_MAP[category] || "other";

  return (
    <Image
      src={`/icons/${iconName}.png`}
      alt={category}
      width={size}
      height={size}
      className={className}
    />
  );
}

// Export the icon map for use in other components
export { CATEGORY_ICON_MAP };
