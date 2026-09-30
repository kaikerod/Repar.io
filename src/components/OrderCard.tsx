"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Smartphone,
  User,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import { WorkOrder, OrderStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";
import {
  formatOSNumber,
  formatDuration,
  formatTimeRange,
  findConflictingOrders,
} from "@/lib/utils";

interface OrderCardProps {
  order: WorkOrder;
  allOrders?: WorkOrder[];
  onUpdateStatus: (id: number, newStatus: OrderStatus) => Promise<void>;
  onEdit: (order: WorkOrder) => void;
  onDelete: (id: number) => Promise<void>;
  onSchedule?: (order: WorkOrder) => void;
}

export function OrderCard({
  order,
  allOrders = [],
  onUpdateStatus,
  onEdit,
  onDelete,
  onSchedule,
}: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isPending = order.status === "PENDENTE" || !order.scheduledDate;

  const dateObj = order.scheduledDate ? new Date(order.scheduledDate) : null;
  const timeFormatted = dateObj ? format(dateObj, "HH:mm") : null;
  const dateFormatted = dateObj
    ? format(dateObj, "dd/MM/yyyy")
    : format(new Date(order.createdAt), "dd/MM/yyyy");
  const timeRangeStr = order.scheduledDate
    ? formatTimeRange(order.scheduledDate, order.estimatedDuration)
    : "Sem agendamento";

  const conflicts = useMemo(() => {
    if (isPending || !dateObj) return [];
    return findConflictingOrders(
      dateObj,
      order.estimatedDuration || 30,
      allOrders,
      order.id
    );
  }, [isPending, dateObj, order, allOrders]);

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
          {/* Time badge or Pending badge */}
          {isPending ? (
            <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-purple-100">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Pendente</span>
              {order.estimatedDuration ? (
                <span className="text-[11px] font-semibold text-purple-800 bg-purple-200/60 px-1.5 py-0.5 rounded ml-0.5">
                  ~{formatDuration(order.estimatedDuration)}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg text-sm border border-indigo-100">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeFormatted}</span>
              {order.estimatedDuration ? (
                <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-200/60 px-1.5 py-0.5 rounded ml-0.5">
                  ~{formatDuration(order.estimatedDuration)}
                </span>
              ) : null}
            </div>
          )}

          {/* OS Number */}
          <span
            className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md"
            title={`ID interno: #${order.id}${order.osNumber ? ` • OS Externa: ${order.osNumber}` : ""}`}
          >
            {formatOSNumber(order)}
          </span>

          <span className="text-xs text-slate-400 hidden sm:inline">
            {dateFormatted}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Schedule Button if Pending */}
          {isPending && onSchedule && (
            <button
              onClick={() => onSchedule(order)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200 transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Agendar</span>
            </button>
          )}

          {/* Unified Interactive Status Badge */}
          <StatusBadge
            status={order.status}
            size="sm"
            disabled={isUpdating}
            onChange={handleStatusChange}
          />

          {/* Action button menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Mais opções"
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
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    Editar O.S.
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (
                        confirm(
                          `Deseja realmente excluir a ${formatOSNumber(order)}?`
                        )
                      ) {
                        onDelete(order.id);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
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
              {conflicts.map((c) => formatOSNumber(c)).join(", ")} ({timeRangeStr})
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
