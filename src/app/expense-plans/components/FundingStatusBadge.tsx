"use client";

import { CheckCircle2, AlertTriangle, Clock, Target } from "lucide-react";
import { FundingStatus, getFundingStatusLabel } from "@/types/expense-plan-types";

interface FundingStatusBadgeProps {
  status: FundingStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const statusConfig: Record<
  FundingStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    className: string;
    iconClassName: string;
  }
> = {
  funded: {
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 border-green-300",
    iconClassName: "text-green-600",
  },
  almost_ready: {
    icon: Target,
    className: "bg-blue-100 text-blue-700 border-blue-300",
    iconClassName: "text-blue-600",
  },
  on_track: {
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
    iconClassName: "text-yellow-600",
  },
  behind: {
    icon: AlertTriangle,
    className: "bg-red-100 text-red-700 border-red-300",
    iconClassName: "text-red-600",
  },
};

export default function FundingStatusBadge({
  status,
  size = "sm",
  showLabel = true,
}: FundingStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const label = getFundingStatusLabel(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
  };

  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${sizeClasses[size]}
        ${config.className}
      `}
      title={label}
    >
      <Icon className={`${iconSizeClasses[size]} ${config.iconClassName}`} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

/**
 * Compact version showing only icon with tooltip
 */
export function FundingStatusIcon({
  status,
  size = "sm",
}: {
  status: FundingStatus;
  size?: "sm" | "md";
}) {
  return <FundingStatusBadge status={status} size={size} showLabel={false} />;
}
