"use client";

import React from "react";
import { Calendar, Cpu, CheckCircle2, Layers, CalendarClock } from "lucide-react";
import { WorkOrder, OrderStatus } from "@/types";

interface MetricsBarProps {
  orders: WorkOrder[];
  activeFilter: string | null;
  onSelectFilter: (status: OrderStatus | null) => void;
}

export function MetricsBar({ orders, activeFilter, onSelectFilter }: MetricsBarProps) {
  const countByStatus = {
    total: orders.length,
    pendente: orders.filter((o) => o.status === "PENDENTE" || !o.scheduledDate).length,
    agendado: orders.filter((o) => o.status === "AGENDADO" && o.scheduledDate).length,
    naBancada: orders.filter((o) => o.status === "NA_BANCADA").length,
    concluido: orders.filter(
      (o) => o.status === "CONCLUIDO" || o.status === "ENTREGUE"
    ).length,
  };

  const metrics = [
    {
      id: null,
      label: "Total no Período",
      count: countByStatus.total,
      icon: Layers,
      color: "text-slate-700 bg-slate-100 border-slate-200",
      activeColor: "ring-2 ring-slate-800 bg-slate-100",
    },
    {
      id: "PENDENTE" as OrderStatus,
      label: "Pendentes",
      count: countByStatus.pendente,
      icon: CalendarClock,
      color: "text-purple-700 bg-purple-50 border-purple-200",
      activeColor: "ring-2 ring-purple-600 bg-purple-50",
    },
    {
      id: "AGENDADO" as OrderStatus,
      label: "Agendados",
      count: countByStatus.agendado,
      icon: Calendar,
      color: "text-blue-700 bg-blue-50 border-blue-200",
      activeColor: "ring-2 ring-blue-600 bg-blue-50",
    },
    {
      id: "NA_BANCADA" as OrderStatus,
      label: "Na Bancada",
      count: countByStatus.naBancada,
      icon: Cpu,
      color: "text-amber-700 bg-amber-50 border-amber-200",
      activeColor: "ring-2 ring-amber-500 bg-amber-50",
    },
    {
      id: "CONCLUIDO" as OrderStatus,
      label: "Concluídos",
      count: countByStatus.concluido,
      icon: CheckCircle2,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      activeColor: "ring-2 ring-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((item) => {
        const Icon = item.icon;
        const isActive = activeFilter === item.id;

        return (
          <button
            key={item.label}
            onClick={() => onSelectFilter(item.id)}
            className={`flex items-center justify-between p-3.5 rounded-xl border bg-white text-left transition-all hover:shadow-sm cursor-pointer ${
              isActive ? item.activeColor : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{item.count}</p>
            </div>
            <div className={`p-2.5 rounded-lg border ${item.color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
