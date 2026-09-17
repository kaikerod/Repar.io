import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    const order = await prisma.workOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar ordem" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.customerName !== undefined) dataToUpdate.customerName = body.customerName;
    if (body.device !== undefined) dataToUpdate.device = body.device;
    if (body.issue !== undefined) dataToUpdate.issue = body.issue;
    if (body.notes !== undefined) dataToUpdate.notes = body.notes;
    if (body.estimatedDuration !== undefined) {
      dataToUpdate.estimatedDuration = body.estimatedDuration === "" || body.estimatedDuration === null ? null : parseInt(body.estimatedDuration, 10);
    }
    if (body.scheduledDate !== undefined) {
      dataToUpdate.scheduledDate = new Date(body.scheduledDate);
    }

    const updated = await prisma.workOrder.update({
      where: { id: orderId },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Erro ao atualizar ordem de serviço" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    await prisma.workOrder.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ error: "Erro ao remover ordem" }, { status: 500 });
  }
}
