"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  ListTodo,
} from "lucide-react";
import { WorkOrder, OrderStatus } from "@/types";
import { Navbar } from "@/components/Navbar";
import { MetricsBar } from "@/components/MetricsBar";
import { DayNavigator } from "@/components/DayNavigator";
import { OrderCard } from "@/components/OrderCard";
import { CalendarView } from "@/components/CalendarView";
import { NewOrderModal } from "@/components/NewOrderModal";
import { EditOrderModal } from "@/components/EditOrderModal";

export default function Home() {
  const [allOrders, setAllOrders] = useState<WorkOrder[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<OrderStatus | null>(null);
  const [viewMode, setViewMode] = useState<"agenda" | "calendar">("agenda");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newModalDefaultDate, setNewModalDefaultDate] = useState<Date | null>(new Date());
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/work-orders?date=all");
      if (res.ok) {
        const data = await res.json();
        setAllOrders(data);
      }
    } catch (err) {
      console.error("Erro ao carregar ordens:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update status directly from card
  const handleUpdateStatus = async (id: number, newStatus: OrderStatus) => {
    try {
      setAllOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );

      const res = await fetch(`/api/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        await fetchOrders();
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      await fetchOrders();
    }
  };

  // Delete order
  const handleDelete = async (id: number) => {
    try {
      setAllOrders((prev) => prev.filter((o) => o.id !== id));
      await fetch(`/api/work-orders/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Erro ao deletar ordem:", err);
      await fetchOrders();
    }
  };

  const handleOpenNewOrderWithDate = (d?: Date | null) => {
    setNewModalDefaultDate(d || selectedDate || new Date());
    setIsNewModalOpen(true);
  };

  // Orders filtered by search term
  const searchedOrders = useMemo(() => {
    if (!searchTerm.trim()) return allOrders;
    const term = searchTerm.toLowerCase().trim();
    return allOrders.filter(
      (o) =>
        o.customerName.toLowerCase().includes(term) ||
        o.device.toLowerCase().includes(term) ||
        o.issue.toLowerCase().includes(term) ||
        String(o.id).includes(term)
    );
  }, [allOrders, searchTerm]);

  // Orders displayed in Agenda view
  const agendaOrders = useMemo(() => {
    let list = searchedOrders;

    if (selectedDate) {
      list = list.filter((o) => isSameDay(new Date(o.scheduledDate), selectedDate));
    }

    if (activeStatusFilter) {
      list = list.filter((o) =>
        activeStatusFilter === "CONCLUIDO"
          ? o.status === "CONCLUIDO" || o.status === "ENTREGUE"
          : o.status === activeStatusFilter
      );
    }

    return list;
  }, [searchedOrders, selectedDate, activeStatusFilter]);

  // Orders displayed in Calendar view (responds to search & status filter)
  const calendarOrders = useMemo(() => {
    if (!activeStatusFilter) return searchedOrders;
    return searchedOrders.filter((o) =>
      activeStatusFilter === "CONCLUIDO"
        ? o.status === "CONCLUIDO" || o.status === "ENTREGUE"
        : o.status === activeStatusFilter
    );
  }, [searchedOrders, activeStatusFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80">
      {/* Navbar with brand, search and + Nova O.S. */}
      <Navbar
        onOpenNewOrder={() => handleOpenNewOrderWithDate(selectedDate)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* View Mode Switcher and Top Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Tabs: Agenda vs Calendário */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl w-fit shadow-2xs">
            <button
              onClick={() => setViewMode("agenda")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "agenda"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Agenda Diária</span>
            </button>

            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Visão Calendário</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => fetchOrders()}
              title="Atualizar dados"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 bg-slate-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => handleOpenNewOrderWithDate(selectedDate)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar Novo Reparo</span>
            </button>
          </div>

        </div>

        {/* Top Summary Metrics */}
        <MetricsBar
          orders={viewMode === "agenda" && selectedDate ? agendaOrders : allOrders}
          activeFilter={activeStatusFilter}
          onSelectFilter={setActiveStatusFilter}
        />

        {/* Conditionally Render View */}
        {viewMode === "calendar" ? (
          /* Calendar View */
          <CalendarView
            orders={calendarOrders}
            onSelectOrder={(ord) => setEditingOrder(ord)}
            onOpenNewOrderForDate={(d) => handleOpenNewOrderWithDate(d)}
          />
        ) : (
          /* Agenda / Day List View */
          <div className="space-y-6">
            
            {/* Date Selector & Day View Navigation */}
            <DayNavigator
              selectedDate={selectedDate}
              onDateChange={(d) => {
                setSelectedDate(d);
                setActiveStatusFilter(null);
              }}
            />

            {/* Header row of Agenda */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>Horários na Bancada</span>
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {agendaOrders.length} {agendaOrders.length === 1 ? "reparo" : "reparos"}
                </span>
              </div>
            </div>

            {/* Content: List / Cards of repairs */}
            {loading && allOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Carregando agendamentos...</p>
              </div>
            ) : agendaOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Nenhum reparo agendado
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm
                    ? "Nenhuma ordem de serviço corresponde à pesquisa."
                    : "Não há reparos marcados para este dia ou filtro."}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenNewOrderWithDate(selectedDate)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agendar Primeiro Reparo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agendaOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    allOrders={allOrders}
                    onUpdateStatus={handleUpdateStatus}
                    onEdit={(ord) => setEditingOrder(ord)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modals with full overlap check */}
      <NewOrderModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={fetchOrders}
        defaultDate={newModalDefaultDate}
        existingOrders={allOrders}
      />

      <EditOrderModal
        order={editingOrder}
        isOpen={editingOrder !== null}
        onClose={() => setEditingOrder(null)}
        onUpdated={fetchOrders}
        existingOrders={allOrders}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Repar.io • Gestão pessoal de reparos e horários agendados
        </div>
      </footer>
    </div>
  );
}
