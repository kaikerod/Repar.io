"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Smartphone,
  User,
  FileText,
  MoreVertical,
  ChevronRight,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WorkOrder, OrderStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";
import {
  formatOSNumber,
  formatDuration,
  formatTimeRange,
  findConflictingOrders,
  STATUS_CONFIG,
} from "@/lib/utils";

interface OrderCardProps {
  order: WorkOrder;
  allOrders?: WorkOrder[];
  onUpdateStatus: (id: number, newStatus: OrderStatus) => Promise<void>;
  onEdit: (order: WorkOrder) => void;
  onDelete: (id: number) => Promise<void>;
}

export function OrderCard({
  order,
  allOrders = [],
  onUpdateStatus,
  onEdit,
  onDelete,
}: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const dateObj = new Date(order.scheduledDate);
  const timeFormatted = format(dateObj, "HH:mm");
  const dateFormatted = format(dateObj, "dd/MM/yyyy");
  const timeRangeStr = formatTimeRange(order.scheduledDate, order.estimatedDuration);

  const conflicts = useMemo(() => {
    return findConflictingOrders(
      dateObj,
      order.estimatedDuration || 30,
      allOrders,
      order.id
    );
  }, [dateObj, order, allOrders]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      setIsUpdating(true);
      await onUpdateStatus(order.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-md relative group">
      
      {/* Top row: Time, OS number, Status, and Menu */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {/* Time badge */}
          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg text-sm border border-indigo-100">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeFormatted}</span>
            {order.estimatedDuration ? (
              <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-200/60 px-1.5 py-0.5 rounded ml-0.5">
                ~{formatDuration(order.estimatedDuration)}
              </span>
            ) : null}
          </div>

          {/* OS Number */}
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
            {formatOSNumber(order.id)}
          </span>

          <span className="text-xs text-slate-400 hidden sm:inline">
            {dateFormatted}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status selector */}
          <div className="relative">
            <select
              value={order.status}
              disabled={isUpdating}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              className="text-xs font-semibold py-1 pl-2.5 pr-6 bg-slate-50 border border-slate-200 rounded-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none text-slate-700"
            >
              <option value="AGENDADO">Agendado</option>
              <option value="NA_BANCADA">Na Bancada</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="ENTREGUE">Entregue</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>

          <StatusBadge status={order.status} size="sm" />

          {/* Action button menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(order);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    Editar O.S.
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (confirm(`Deseja realmente excluir a ${formatOSNumber(order.id)}?`)) {
                        onDelete(order.id);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conflict Alert Banner if bench is double-booked */}
      {conflicts.length > 0 && (
        <div className="my-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Horário concorrente:</strong> Coincide com{" "}
              {conflicts.map((c) => formatOSNumber(c.id)).join(", ")} ({timeRangeStr})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onEdit(order)}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline shrink-0 cursor-pointer"
          >
            Ajustar
          </button>
        </div>
      )}

      {/* Main Content: Device and Defect */}
      <div className="py-3">
        <div className="flex items-start gap-2">
          <Smartphone className="w-4 h-4 text-indigo-600 mt-1 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {order.device}
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              <span className="font-medium text-slate-700">Defeito: </span>
              {order.issue}
            </p>
          </div>
        </div>

        {order.notes && (
          <div className="mt-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span className="italic">{order.notes}</span>
          </div>
        )}
      </div>

      {/* Footer row: Customer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-800">{order.customerName}</span>
        </div>
      </div>

    </div>
  );
}
