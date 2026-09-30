"use client";

import React, { useState } from "react";
import {
  Clock,
  Smartphone,
  User,
  FileText,
  CalendarPlus,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  CalendarClock,
  Sparkles,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WorkOrder, OrderStatus } from "@/types";
import { formatOSNumber, formatDuration } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

interface PendingOrdersViewProps {
  orders: WorkOrder[];
  onSchedule: (order: WorkOrder) => void;
  onEdit: (order: WorkOrder) => void;
  onDelete: (id: number) => Promise<void>;
  onOpenNewOrder: () => void;
  onUpdateStatus: (id: number, newStatus: OrderStatus) => Promise<void>;
}

export function PendingOrdersView({
  orders,
  onSchedule,
  onEdit,
  onDelete,
  onOpenNewOrder,
  onUpdateStatus,
}: PendingOrdersViewProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0 mt-0.5">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Ordens de Serviço Pendentes de Agendamento
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {orders.length} {orders.length === 1 ? "pendente" : "pendentes"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aparelhos na assistência ou orçamentos abertos que aguardam definição de dia e horário para reparo na bancada.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewOrder}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova O.S. Pendente</span>
        </button>
      </div>

      {/* Helpful Hint Banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs text-purple-900">
        <Info className="w-4 h-4 text-purple-600 shrink-0" />
        <span className="leading-relaxed">
          <strong>Fluxo recomendado:</strong> Cadastre a O.S. assim que o cliente der entrada. Quando a peça chegar ou houver vaga na bancada, clique em <strong>Agendar Reparo</strong> para escolher a data sem conflito de horários.
        </span>
      </div>

      {/* Grid of Pending Orders */}
      {orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Nenhuma O.S. pendente de agendamento
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Todas as ordens de serviço cadastradas já possuem dia e horário definidos na bancada.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenNewOrder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar O.S. Pendente</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => {
            const createdAtDate = new Date(order.createdAt);
            const createdFormatted = format(createdAtDate, "dd/MM 'às' HH:mm", {
              locale: ptBR,
            });

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100"
                        title={`ID interno: #${order.id}${order.osNumber ? ` • OS Externa: ${order.osNumber}` : ""}`}
                      >
                        {formatOSNumber(order)}
                      </span>
                      <StatusBadge
                        status={order.status}
                        size="sm"
                        onChange={(newStatus) => onUpdateStatus(order.id, newStatus)}
                      />
                      {order.estimatedDuration ? (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          ~{formatDuration(order.estimatedDuration)}
                        </span>
                      ) : null}
                    </div>

                    {/* Actions menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(activeMenuId === order.id ? null : order.id)
                        }
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Mais opções"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === order.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onEdit(order);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              Editar O.S.
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                if (
                                  confirm(
                                    `Deseja realmente excluir a ${formatOSNumber(
                                      order
                                    )}?`
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

                  {/* Device & Defect info */}
                  <div className="py-3">
                    <div className="flex items-start gap-2">
                      <Smartphone className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
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
                </div>

                {/* Footer and Primary Action Button */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-800">
                        {order.customerName}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Entrada: {createdFormatted}
                    </span>
                  </div>

                  {/* Prominent Schedule Button */}
                  <button
                    onClick={() => onSchedule(order)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Agendar Reparo</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
