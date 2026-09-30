"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  Smartphone,
  User,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { WorkOrder } from "@/types";
import {
  formatOSNumber,
  formatDuration,
  findConflictingOrders,
  getOrderInterval,
  formatTimeRange,
} from "@/lib/utils";

interface ScheduleOrderModalProps {
  order: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
  existingOrders?: WorkOrder[];
}

export function ScheduleOrderModal({
  order,
  isOpen,
  onClose,
  onScheduled,
  existingOrders = [],
}: ScheduleOrderModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      // Default to today or existing order date if it had one
      const baseDate = order.scheduledDate ? new Date(order.scheduledDate) : new Date();
      setDate(format(baseDate, "yyyy-MM-dd"));
      
      // If order had a time, use it, otherwise suggest current or next full hour
      if (order.scheduledDate) {
        setTime(format(new Date(order.scheduledDate), "HH:mm"));
      } else {
        const now = new Date();
        const nextHour = (now.getHours() + 1) % 24;
        setTime(`${String(nextHour).padStart(2, "0")}:00`);
      }

      setEstimatedDuration(
        order.estimatedDuration ? String(order.estimatedDuration) : "60"
      );
      setError(null);
    }
  }, [isOpen, order]);

  // Overlap detection
  const conflictingOrders = useMemo(() => {
    if (!order || !date || !time) return [];
    const start = new Date(`${date}T${time}:00`);
    if (isNaN(start.getTime())) return [];
    const dur = parseInt(estimatedDuration, 10) || 30;
    return findConflictingOrders(start, dur, existingOrders, order.id);
  }, [order, date, time, estimatedDuration, existingOrders]);

  const nextFreeTime = useMemo(() => {
    if (conflictingOrders.length === 0) return null;
    let latestEnd = new Date(0);
    conflictingOrders.forEach((o) => {
      const { end } = getOrderInterval(o);
      if (end > latestEnd) latestEnd = end;
    });
    const h = String(latestEnd.getHours()).padStart(2, "0");
    const m = String(latestEnd.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }, [conflictingOrders]);

  const handleApplyNextFreeTime = () => {
    if (nextFreeTime) {
      setTime(nextFreeTime);
    }
  };

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !time) {
      setError("Por favor, informe a data e horário para agendar.");
      return;
    }

    try {
      setLoading(true);
      const scheduledDateTime = new Date(`${date}T${time}:00`);

      const res = await fetch(`/api/work-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: scheduledDateTime.toISOString(),
          estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
          status: "AGENDADO",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao agendar reparo");
      }

      onScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao agendar ordem de serviço.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Agendar na Bancada</h2>
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {formatOSNumber(order)}
              </span>
            </div>
            <p className="text-xs text-slate-500">Defina a data e o horário para iniciar este reparo</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Details Brief Card */}
        <div className="mx-6 mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              {order.device}
            </span>
            <span className="flex items-center gap-1 text-slate-500 font-normal">
              <User className="w-3 h-3" />
              {order.customerName}
            </span>
          </div>
          {order.osNumber && (
            <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
              <span className="font-semibold text-slate-700">OS Externa:</span>
              <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                {order.osNumber}
              </span>
            </div>
          )}
          <p className="text-slate-600 line-clamp-2">
            <strong className="text-slate-700">Defeito: </strong>{order.issue}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Date & Time Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Reparo *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário de Início *
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Overlap Alert */}
          {conflictingOrders.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Conflito de Horário na Bancada!</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Coincide com {conflictingOrders.map((co) => formatOSNumber(co)).join(", ")} (
                    {formatTimeRange(conflictingOrders[0].scheduledDate, conflictingOrders[0].estimatedDuration)}
                    ).
                  </p>
                </div>
              </div>
              {nextFreeTime && (
                <button
                  type="button"
                  onClick={handleApplyNextFreeTime}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evitar sobreposição: Ajustar para às {nextFreeTime}</span>
                </button>
              )}
            </div>
          )}

          {/* Estimated Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duração Estimada de Bancada
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: "15 min", val: "15" },
                { label: "30 min", val: "30" },
                { label: "45 min", val: "45" },
                { label: "1h", val: "60" },
                { label: "1h 30m", val: "90" },
                { label: "2h", val: "120" },
              ].map((chip) => (
                <button
                  type="button"
                  key={chip.val}
                  onClick={() => setEstimatedDuration(chip.val)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium border transition-all cursor-pointer ${
                    estimatedDuration === chip.val
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? "Agendando..." : "Confirmar Agendamento"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
