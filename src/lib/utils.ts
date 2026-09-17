import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return "R$ --";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatOSNumber(id: number): string {
  return `OS #${String(id).padStart(4, "0")}`;
}

export function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function getOrderInterval(order: {
  scheduledDate: string | Date;
  estimatedDuration?: number | null;
}) {
  const start = new Date(order.scheduledDate);
  const durationMs = (order.estimatedDuration && order.estimatedDuration > 0 ? order.estimatedDuration : 30) * 60000;
  const end = new Date(start.getTime() + durationMs);
  return { start, end };
}

export function formatTimeRange(
  scheduledDate: string | Date,
  durationMinutes?: number | null
): string {
  const start = new Date(scheduledDate);
  const duration = durationMinutes && durationMinutes > 0 ? durationMinutes : 30;
  const end = new Date(start.getTime() + duration * 60000);

  const startH = String(start.getHours()).padStart(2, "0");
  const startM = String(start.getMinutes()).padStart(2, "0");
  const endH = String(end.getHours()).padStart(2, "0");
  const endM = String(end.getMinutes()).padStart(2, "0");

  return `${startH}:${startM} às ${endH}:${endM}`;
}

export function findConflictingOrders<
  T extends { id: number; scheduledDate: string | Date; estimatedDuration?: number | null; status: string }
>(
  newStart: Date,
  durationMinutes: number,
  existingOrders: T[],
  excludeOrderId?: number
): T[] {
  const duration = durationMinutes > 0 ? durationMinutes : 30;
  const newEnd = new Date(newStart.getTime() + duration * 60000);

  return existingOrders.filter((order) => {
    if (order.id === excludeOrderId) return false;
    if (order.status === "CANCELADO" || order.status === "ENTREGUE") return false;

    const { start: oStart, end: oEnd } = getOrderInterval(order);

    // Only compare on same calendar day
    if (
      newStart.getFullYear() !== oStart.getFullYear() ||
      newStart.getMonth() !== oStart.getMonth() ||
      newStart.getDate() !== oStart.getDate()
    ) {
      return false;
    }

    // Overlap condition: newStart < oEnd and oStart < newEnd
    return newStart.getTime() < oEnd.getTime() && oStart.getTime() < newEnd.getTime();
  });
}

export function formatPhone(phone?: string | null): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function getWhatsAppUrl(phone?: string | null, message?: string): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned.startsWith("55") && (cleaned.length === 10 || cleaned.length === 11)) {
    cleaned = `55${cleaned}`;
  }
  const text = encodeURIComponent(message || "Olá! Entro em contato referente à sua ordem de serviço na assistência.");
  return `https://wa.me/${cleaned}?text=${text}`;
}

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  AGENDADO: {
    label: "Agendado",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  NA_BANCADA: {
    label: "Na Bancada",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  CONCLUIDO: {
    label: "Concluído",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  ENTREGUE: {
    label: "Entregue",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  CANCELADO: {
    label: "Cancelado",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};
