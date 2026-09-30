"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Smartphone,
  CheckCircle2,
  Calendar as CalendarIcon,
  AlertCircle,
  AlertTriangle,
  Timer,
  CalendarClock,
} from "lucide-react";
import { WorkOrder, OrderStatus } from "@/types";
import {
  formatDuration,
  formatOSNumber,
  formatTimeRange,
  findConflictingOrders,
  STATUS_CONFIG,
} from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

interface CalendarViewProps {
  orders: WorkOrder[];
  onSelectOrder: (order: WorkOrder) => void;
  onOpenNewOrderForDate: (date: Date) => void;
  onViewPending?: () => void;
  pendingCount?: number;
}

export function CalendarView({
  orders,
  onSelectOrder,
  onOpenNewOrderForDate,
  onViewPending,
  pendingCount = 0,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Generate days for current month grid including overflow days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Group orders by date (YYYY-MM-DD)
  const ordersByDate = useMemo(() => {
    const map = new Map<string, WorkOrder[]>();
    for (const order of orders) {
      if (!order.scheduledDate) continue;
      const d = new Date(order.scheduledDate);
      const key = format(d, "yyyy-MM-dd");
      const list = map.get(key) || [];
      list.push(order);
      map.set(key, list);
    }

    // Sort each day's orders by time
    map.forEach((list) => {
      list.sort(
        (a, b) =>
          new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()
      );
    });

    return map;
  }, [orders]);

  // Orders for the selected day
  const selectedDayOrders = useMemo(() => {
    const key = format(selectedDay, "yyyy-MM-dd");
    return ordersByDate.get(key) || [];
  }, [selectedDay, ordersByDate]);

  // Calculate total workload for the selected day
  const totalMinutesForSelectedDay = useMemo(() => {
    return selectedDayOrders.reduce(
      (acc, curr) => acc + (curr.estimatedDuration || 0),
      0
    );
  }, [selectedDayOrders]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDay(now);
  };

  const monthTitle = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });
  const capitalizedMonthTitle =
    monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {capitalizedMonthTitle}
            </h2>
            <p className="text-xs text-slate-500">
              Visão geral dos agendamentos e tempos de bancada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Mês Atual
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={handlePrevMonth}
              title="Mês Anterior"
              className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Próximo Mês"
              className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Grid (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2 text-xs font-bold text-slate-600">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayOrders = ordersByDate.get(dateKey) || [];
              const isSelected = isSameDay(day, selectedDay);
              const isCurrent = isToday(day);
              const inCurrentMonth = isSameMonth(day, currentMonth);

              const totalDurationForDay = dayOrders.reduce(
                (sum, o) => sum + (o.estimatedDuration || 0),
                0
              );
              const hasConflictOnDay = dayOrders.some(
                (o) =>
                  findConflictingOrders(
                    new Date(o.scheduledDate!),
                    o.estimatedDuration || 30,
                    dayOrders,
                    o.id
                  ).length > 0
              );

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 transition-all cursor-pointer flex flex-col justify-between group relative ${
                    !inCurrentMonth
                      ? "bg-slate-50/50 text-slate-400"
                      : isSelected
                      ? "bg-indigo-50/40 ring-2 ring-indigo-500 ring-inset z-10"
                      : hasConflictOnDay
                      ? "bg-amber-50/30 hover:bg-amber-50/50"
                      : "bg-white hover:bg-slate-50/80"
                  }`}
                >
                  {/* Day header: Number, conflict tag, and Workload indicator */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${
                        isCurrent
                          ? "bg-indigo-600 text-white font-bold"
                          : isSelected
                          ? "bg-indigo-100 text-indigo-700 font-bold"
                          : "text-slate-700"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <div className="flex items-center gap-1">
                      {hasConflictOnDay && (
                        <span
                          className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1 rounded flex items-center gap-0.5"
                          title="Dois ou mais reparos com horários sobrepostos neste dia!"
                        >
                          ⚠️
                        </span>
                      )}

                      {totalDurationForDay > 0 && (
                        <span
                          className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1 rounded flex items-center gap-0.5"
                          title={`Total previsto: ${formatDuration(totalDurationForDay)}`}
                        >
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span className="hidden sm:inline">
                            {formatDuration(totalDurationForDay)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Orders preview pills - no overlap */}
                  <div className="space-y-1 my-1 w-full overflow-hidden">
                    {dayOrders.slice(0, 2).map((order) => {
                      const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.AGENDADO;
                      const timeStr = format(new Date(order.scheduledDate!), "HH:mm");
                      const orderHasConflict =
                        findConflictingOrders(
                          new Date(order.scheduledDate!),
                          order.estimatedDuration || 30,
                          dayOrders,
                          order.id
                        ).length > 0;

                      return (
                        <div
                          key={order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDay(day);
                            onSelectOrder(order);
                          }}
                          className={`text-[10px] sm:text-xs truncate px-1.5 py-0.5 rounded border flex items-center gap-1 shadow-2xs hover:opacity-80 transition-opacity ${
                            orderHasConflict
                              ? "bg-amber-50 border-amber-300 text-amber-900"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className="font-semibold text-slate-700">{timeStr}</span>
                          {order.estimatedDuration ? (
                            <span className="text-[9px] text-indigo-600 font-medium hidden sm:inline">
                              ({formatDuration(order.estimatedDuration)})
                            </span>
                          ) : null}
                          <span className="text-slate-500 truncate">{order.device}</span>
                        </div>
                      );
                    })}

                    {dayOrders.length > 2 && (
                      <p className="text-[10px] text-indigo-600 font-medium px-1">
                        +{dayOrders.length - 2} mais
                      </p>
                    )}
                  </div>

                  {/* Add button on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDay(day);
                        onOpenNewOrderForDate(day);
                      }}
                      title="Agendar neste dia"
                      className="p-1 rounded bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Selected Day Details Panel */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            
            {/* Header of selected day */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 capitalize">
                  {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-xs text-slate-500">
                  {isToday(selectedDay) ? "Hoje" : "Dia selecionado"}
                </p>
              </div>

              <button
                onClick={() => onOpenNewOrderForDate(selectedDay)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar</span>
              </button>
            </div>

            {/* Workload badge */}
            <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tempo Total Estimado</p>
                  <p className="text-sm font-bold text-slate-900">
                    {totalMinutesForSelectedDay > 0
                      ? formatDuration(totalMinutesForSelectedDay)
                      : "0 min (Livre)"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">Agendamentos</p>
                <p className="text-sm font-bold text-indigo-600">
                  {selectedDayOrders.length} {selectedDayOrders.length === 1 ? "reparo" : "reparos"}
                </p>
              </div>
            </div>

            {/* List of orders for selected day */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {selectedDayOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs">Nenhum reparo agendado para este dia.</p>
                  <button
                    onClick={() => onOpenNewOrderForDate(selectedDay)}
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    + Agendar agora
                  </button>
                </div>
              ) : (
                selectedDayOrders.map((order) => {
                  const timeFormatted = format(new Date(order.scheduledDate!), "HH:mm");
                  const timeRange = formatTimeRange(order.scheduledDate, order.estimatedDuration);
                  const orderConflicts = findConflictingOrders(
                    new Date(order.scheduledDate!),
                    order.estimatedDuration || 30,
                    selectedDayOrders,
                    order.id
                  );

                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer ${
                        orderConflicts.length > 0
                          ? "border-amber-300 bg-amber-50/40 hover:bg-amber-50/70"
                          : "border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-white"
                      } hover:shadow-sm`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-bold text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            {timeFormatted}
                          </span>
                          {order.estimatedDuration ? (
                            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                              ~{formatDuration(order.estimatedDuration)}
                            </span>
                          ) : null}
                        </div>
                        <StatusBadge status={order.status} size="sm" />
                      </div>

                      {orderConflicts.length > 0 && (
                        <div className="my-1.5 px-2 py-1 bg-amber-100/80 border border-amber-300 text-amber-900 rounded text-[11px] flex items-center justify-between">
                          <span className="flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Sobrepõe ({timeRange}) com {orderConflicts.map((c) => formatOSNumber(c)).join(", ")}</span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-2 mt-2">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {order.device}
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {order.issue}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{order.customerName}</span>
                        <span
                          className="font-mono font-medium"
                          title={`ID interno: #${order.id}${order.osNumber ? ` • OS Externa: ${order.osNumber}` : ""}`}
                        >
                          {formatOSNumber(order)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Clique em um reparo para ver detalhes ou editar o status
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
