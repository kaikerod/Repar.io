"use client";

import React from "react";
import { OrderStatus } from "@/types";
import { STATUS_CONFIG, cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.AGENDADO;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-all",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs sm:text-sm",
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}
