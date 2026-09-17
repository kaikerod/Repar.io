export type OrderStatus =
  | "AGENDADO"
  | "NA_BANCADA"
  | "AGUARDANDO_PECA"
  | "CONCLUIDO"
  | "ENTREGUE"
  | "CANCELADO";

export interface WorkOrder {
  id: number;
  customerName: string;
  customerPhone?: string | null;
  device: string;
  issue: string;
  status: OrderStatus;
  scheduledDate: string | Date;
  estimatedDuration?: number | null; // Duração em minutos (ex: 30, 60, 90)
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
