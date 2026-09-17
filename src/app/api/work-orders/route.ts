import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // e.g. "2026-09-16" or "all"
    const search = searchParams.get("search");

    let whereClause: any = {};

    if (dateParam && dateParam !== "all") {
      const startOfDay = new Date(`${dateParam}T00:00:00.000`);
      const endOfDay = new Date(`${dateParam}T23:59:59.999`);
      whereClause.scheduledDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (search && search.trim() !== "") {
      const term = search.trim();
      whereClause.OR = [
        { customerName: { contains: term } },
        { device: { contains: term } },
        { issue: { contains: term } },
      ];
      const parsedNumber = parseInt(term.replace(/\D/g, ""), 10);
      if (!isNaN(parsedNumber)) {
        whereClause.OR.push({ id: parsedNumber });
      }
    }

    const workOrders = await prisma.workOrder.findMany({
      where: whereClause,
      orderBy: {
        scheduledDate: "asc",
      },
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ordens de serviço" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      device,
      issue,
      scheduledDate,
      estimatedDuration,
      notes,
    } = body;

    if (!customerName || !device || !issue || !scheduledDate) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (Cliente, Aparelho, Defeito, Data)" },
        { status: 400 }
      );
    }

    const newOrder = await prisma.workOrder.create({
      data: {
        customerName,
        device,
        issue,
        scheduledDate: new Date(scheduledDate),
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
        notes: notes || null,
        status: "AGENDADO",
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating work order:", error);
    return NextResponse.json(
      { error: "Erro ao criar ordem de serviço" },
      { status: 500 }
    );
  }
}
