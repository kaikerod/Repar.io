"use client";

import React from "react";
import { Wrench, Plus, Search, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NavbarProps {
  onOpenNewOrder: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

export function Navbar({ onOpenNewOrder, searchTerm, onSearchChange }: NavbarProps) {
  const todayStr = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedToday = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Repar<span className="text-indigo-600">.io</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Técnico
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Gestão de Reparos e Agendamentos
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por Nº da OS, cliente, aparelho ou defeito..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Actions & Current Date */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>{capitalizedToday}</span>
            </div>

            <button
              onClick={onOpenNewOrder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nova O.S.</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por O.S., cliente, aparelho..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
            />
          </div>
        </div>

      </div>
    </header>
  );
}
