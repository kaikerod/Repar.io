"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Smartphone,
  AlertCircle,
  FileText,
  AlertTriangle,
  Sparkles,
  CalendarClock,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { WorkOrder } from "@/types";
import {
  findConflictingOrders,
  getOrderInterval,
  formatTimeRange,
  formatOSNumber,
} from "@/lib/utils";

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultDate?: Date | null;
  defaultPending?: boolean;
  existingOrders?: WorkOrder[];
}

export function NewOrderModal({
  isOpen,
  onClose,
  onCreated,
  defaultDate,
  defaultPending = false,
  existingOrders = [],
}: NewOrderModalProps) {
  const initialDateStr = format(defaultDate || new Date(), "yyyy-MM-dd");
  const initialTimeStr = format(new Date(), "HH:mm");

  const [customerName, setCustomerName] = useState("");
  const [device, setDevice] = useState("");
  const [issue, setIssue] = useState("");
  const [isPending, setIsPending] = useState(defaultPending);
  const [date, setDate] = useState(initialDateStr);
  const [time, setTime] = useState(initialTimeStr);
  const [estimatedDuration, setEstimatedDuration] = useState<string>("60");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultDateTimestamp = defaultDate ? defaultDate.getTime() : null;

  // Sync date and reset form when modal opens or defaultDate changes
  useEffect(() => {
    if (isOpen) {
      const targetDate = defaultDate || new Date();
      setDate(format(targetDate, "yyyy-MM-dd"));
      setTime(format(new Date(), "HH:mm"));
      setIsPending(Boolean(defaultPending));
      setCustomerName("");
      setDevice("");
      setIssue("");
      setEstimatedDuration("60");
      setNotes("");
      setError(null);
    }
  }, [isOpen, defaultDateTimestamp, defaultPending]);

  // Overlap detection (only if scheduled)
  const conflictingOrders = useMemo(() => {
    if (isPending || !date || !time) return [];
    const start = new Date(`${date}T${time}:00`);
    if (isNaN(start.getTime())) return [];
    const dur = parseInt(estimatedDuration, 10) || 30;
    return findConflictingOrders(start, dur, existingOrders);
  }, [isPending, date, time, estimatedDuration, existingOrders]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !device.trim() || !issue.trim()) {
      setError("Por favor, preencha os campos obrigatórios (Cliente, Aparelho e Defeito).");
      return;
    }

    if (!isPending && (!date || !time)) {
      setError("Por favor, informe a data e horário ou marque como 'Pendente de Agendamento'.");
      return;
    }

    try {
      setLoading(true);
      const scheduledDateTime = isPending ? null : new Date(`${date}T${time}:00`);

      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          device: device.trim(),
          issue: issue.trim(),
          scheduledDate: scheduledDateTime ? scheduledDateTime.toISOString() : null,
          estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
          notes: notes.trim(),
          isPending,
          status: isPending ? "PENDENTE" : "AGENDADO",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao criar ordem de serviço");
      }

      // Reset and close
      setCustomerName("");
      setDevice("");
      setIssue("");
      setEstimatedDuration("60");
      setNotes("");
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar a ordem de serviço.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isPending ? "Nova O.S. Pendente" : "Agendar Novo Reparo"}
            </h2>
            <p className="text-xs text-slate-500">
              {isPending
                ? "Cadastre a Ordem de Serviço para agendar data posteriormente"
                : "Cadastre a Ordem de Serviço com horário de bancada"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Cliente *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Ex: Carlos Oliveira"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Device & Issue */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Aparelho / Modelo *
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Ex: iPhone 14 Pro Max 256GB"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Defeito Relatado / Serviço *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Ex: Queda na água, não liga e tela piscando..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Toggle: Agendar agora vs Pendente de agendamento */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg ${
                  isPending
                    ? "bg-purple-100 text-purple-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                <CalendarClock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Pendente de agendamento
                </p>
                <p className="text-[11px] text-slate-500">
                  {isPending
                    ? "Sem data/horário marcado. Ficará na lista de pendentes."
                    : "Definir dia e horário agora para a bancada."}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isPending}
                onChange={(e) => setIsPending(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Date and Time (shown only if NOT pending) */}
          {!isPending ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data do Agendamento *
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
                    Horário Previsto *
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
            </div>
          ) : (
            <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Esta O.S. será cadastrada como <strong>Pendente de Agendamento</strong>. Ela não ocupará espaço na agenda diária até que você clique em <strong>Agendar Reparo</strong>.
              </p>
            </div>
          )}

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
                      ? isPending
                        ? "bg-purple-600 text-white border-purple-600 font-semibold"
                        : "bg-indigo-600 text-white border-indigo-600 font-semibold"
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

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Internas (opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                placeholder="Ex: Peça já solicitada, aparelho sem parafusos inferiores..."
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
              className={`px-5 py-2 text-xs sm:text-sm font-semibold text-white disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer ${
                isPending
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading
                ? "Salvando..."
                : isPending
                ? "Criar O.S. Pendente"
                : "Salvar e Agendar"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
