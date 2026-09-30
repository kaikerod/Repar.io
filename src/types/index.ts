export type OrderStatus =
  | "PENDENTE"
  | "AGENDADO"
  | "NA_BANCADA"
  | "CONCLUIDO"
  | "ENTREGUE"
  | "CANCELADO";

export interface WorkOrder {
  id: number;
  customerName: string;
  device: string;
  issue: string;
  status: OrderStatus;
  scheduledDate?: string | Date | null;
  estimatedDuration?: number | null; // Duração em minutos (ex: 30, 60, 90)
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
