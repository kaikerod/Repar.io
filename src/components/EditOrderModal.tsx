"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Smartphone,
  AlertCircle,
  FileText,
  CheckSquare,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { WorkOrder, OrderStatus } from "@/types";
import {
  formatOSNumber,
  findConflictingOrders,
  getOrderInterval,
  formatTimeRange,
} from "@/lib/utils";

interface EditOrderModalProps {
  order: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  existingOrders?: WorkOrder[];
}

export function EditOrderModal({
  order,
  isOpen,
  onClose,
  onUpdated,
  existingOrders = [],
}: EditOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [device, setDevice] = useState("");
  const [issue, setIssue] = useState("");
  const [status, setStatus] = useState<OrderStatus>("AGENDADO");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Overlap detection excluding this order itself
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

  useEffect(() => {
    if (order) {
      const d = new Date(order.scheduledDate);
      setCustomerName(order.customerName);
      setCustomerPhone(order.customerPhone || "");
      setDevice(order.device);
      setIssue(order.issue);
      setStatus(order.status);
      setDate(format(d, "yyyy-MM-dd"));
      setTime(format(d, "HH:mm"));
      setEstimatedDuration(order.estimatedDuration ? String(order.estimatedDuration) : "");
      setNotes(order.notes || "");
      setError(null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const scheduledDateTime = new Date(`${date}T${time}:00`);

      const res = await fetch(`/api/work-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          device: device.trim(),
          issue: issue.trim(),
          status,
          scheduledDate: scheduledDateTime.toISOString(),
          estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao atualizar ordem de serviço");
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar alterações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Editar Detalhes</h2>
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {formatOSNumber(order.id)}
              </span>
            </div>
            <p className="text-xs text-slate-500">Atualize informações de bancada, status e observações</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Atual da Ordem de Serviço
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-800"
              >
                <option value="AGENDADO">Agendado</option>
                <option value="NA_BANCADA">Na Bancada (Em análise/reparo)</option>
                <option value="CONCLUIDO">Concluído (Pronto para retirada)</option>
                <option value="ENTREGUE">Entregue ao Cliente</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Cliente
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Device & Problem */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Aparelho / Modelo
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Defeito Relatado / Serviço
            </label>
            <textarea
              required
              rows={2}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Agendamento
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário Previsto
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  step="60"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Overlap / Conflict Alert */}
          {conflictingOrders.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs animate-in fade-in duration-150">
              <div className="flex items-start gap-2 text-amber-800 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span>⚠️ Conflito de Horário na Bancada!</span>
                  <p className="text-[11px] font-normal text-amber-700 mt-0.5">
                    Este horário coincide com outro serviço agendado para o mesmo dia:
                  </p>
                </div>
              </div>
              <div className="space-y-1 pl-6">
                {conflictingOrders.map((co) => (
                  <div
                    key={co.id}
                    className="text-[11px] text-amber-900 bg-amber-100/70 px-2 py-1 rounded flex items-center justify-between"
                  >
                    <span>
                      <strong className="font-mono">{formatOSNumber(co.id)}</strong> - {co.device}
                    </span>
                    <span className="font-semibold text-amber-800">
                      {formatTimeRange(co.scheduledDate, co.estimatedDuration)}
                    </span>
                  </div>
                ))}
              </div>
              {nextFreeTime && (
                <div className="pt-1 pl-6">
                  <button
                    type="button"
                    onClick={handleApplyNextFreeTime}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Evitar sobreposição: Ajustar para às {nextFreeTime}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Time Presets */}
          <div>
            <span className="block text-[11px] font-medium text-slate-500 mb-1">
              Horários comuns de bancada:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["08:30", "09:00", "10:00", "11:00", "13:30", "14:00", "15:30", "16:30"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors cursor-pointer ${
                    time === t
                      ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Duration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Tempo Estimado de Reparo (minutos)
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">
                {estimatedDuration ? `${estimatedDuration} min previstos` : "Não definido"}
              </span>
            </div>
            
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: "15 min", val: "15" },
                { label: "30 min", val: "30" },
                { label: "45 min", val: "45" },
                { label: "1h", val: "60" },
                { label: "1h 30m", val: "90" },
                { label: "2h", val: "120" },
                { label: "3h", val: "180" },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => setEstimatedDuration(chip.val)}
                  className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors cursor-pointer ${
                    estimatedDuration === chip.val
                      ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ou digite qualquer valor em minutos (ex: 75)"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Technical notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Laudo Técnico
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
