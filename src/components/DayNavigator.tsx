"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListFilter,
  RotateCcw,
} from "lucide-react";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DayNavigatorProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
}

export function DayNavigator({ selectedDate, onDateChange }: DayNavigatorProps) {
  const isAll = selectedDate === null;

  const handlePrevDay = () => {
    const current = selectedDate || new Date();
    onDateChange(subDays(current, 1));
  };

  const handleNextDay = () => {
    const current = selectedDate || new Date();
    onDateChange(addDays(current, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);
    onDateChange(newDate);
  };

  const getDateLabel = () => {
    if (isAll) return "Todos os Agendamentos Cadastrados";

    let label = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    label = label.charAt(0).toUpperCase() + label.slice(1);

    if (isToday(selectedDate)) {
      return `${label} (Hoje)`;
    } else if (isTomorrow(selectedDate)) {
      return `${label} (Amanhã)`;
    } else if (isYesterday(selectedDate)) {
      return `${label} (Ontem)`;
    }
    return label;
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
      
      {/* Date title & Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevDay}
          disabled={isAll}
          title="Dia Anterior"
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>

        <div className="flex items-center gap-2 min-w-48 sm:min-w-64">
          <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 tracking-tight">
            {getDateLabel()}
          </span>
        </div>

        <button
          onClick={handleNextDay}
          disabled={isAll}
          title="Próximo Dia"
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Quick shortcuts and Pickers */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToday}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
            selectedDate && isToday(selectedDate)
              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          }`}
        >
          Hoje
        </button>

        {/* Date picker input */}
        <input
          type="date"
          value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
          onChange={handleDateInput}
          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        />

        {/* Toggle All vs Single Day */}
        <button
          onClick={() => onDateChange(isAll ? new Date() : null)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
            isAll
              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>{isAll ? "Filtrando: Todos" : "Ver Todos"}</span>
        </button>
      </div>

    </div>
  );
}
