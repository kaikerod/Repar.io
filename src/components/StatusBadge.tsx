"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { OrderStatus } from "@/types";
import { STATUS_CONFIG, cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md";
  className?: string;
  onChange?: (newStatus: OrderStatus) => void;
  disabled?: boolean;
}

const ALL_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "PENDENTE", label: "Pendente de Agendamento" },
  { value: "AGENDADO", label: "Agendado" },
  { value: "NA_BANCADA", label: "Na Bancada" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "CANCELADO", label: "Cancelado" },
];

export function StatusBadge({
  status,
  size = "md",
  className,
  onChange,
  disabled = false,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.AGENDADO;

  if (onChange) {
    return (
      <div
        className={cn(
          "relative inline-flex items-center gap-1.5 font-semibold rounded-full border transition-all hover:opacity-90 focus-within:ring-2 focus-within:ring-indigo-500 cursor-pointer shadow-2xs",
          config.bg,
          config.text,
          config.border,
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs sm:text-sm",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
        <span className="leading-none">{config.label}</span>
        <ChevronDown className="w-3 h-3 shrink-0 opacity-60 ml-0.5" />
        <select
          value={status}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as OrderStatus)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none disabled:cursor-not-allowed"
          title="Clique para alterar status do reparo"
        >
          {ALL_STATUSES.map((item) => (
            <option key={item.value} value={item.value} className="text-slate-800 bg-white font-normal">
              {item.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

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
