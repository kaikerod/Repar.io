import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // e.g. "2026-09-16", "all", or "pending"
    const search = searchParams.get("search");

    let whereClause: any = {};

    if (dateParam === "pending") {
      whereClause.OR = [
        { scheduledDate: null },
        { status: "PENDENTE" },
      ];
    } else if (dateParam && dateParam !== "all") {
      const startOfDay = new Date(`${dateParam}T00:00:00.000`);
      const endOfDay = new Date(`${dateParam}T23:59:59.999`);
      whereClause.scheduledDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (search && search.trim() !== "") {
      const term = search.trim();
      const searchConditions: any[] = [
        { customerName: { contains: term } },
        { device: { contains: term } },
        { issue: { contains: term } },
      ];
      const parsedNumber = parseInt(term.replace(/\D/g, ""), 10);
      if (!isNaN(parsedNumber)) {
        searchConditions.push({ id: parsedNumber });
      }

      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR },
          { OR: searchConditions },
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = searchConditions;
      }
    }

    const workOrders = await prisma.workOrder.findMany({
      where: whereClause,
      orderBy: [
        { scheduledDate: "asc" },
        { createdAt: "desc" },
      ],
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
      status,
      isPending,
    } = body;

    const pending = isPending === true || !scheduledDate;

    if (!customerName || !device || !issue) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (Cliente, Aparelho, Defeito)" },
        { status: 400 }
      );
    }

    if (!pending && !scheduledDate) {
      return NextResponse.json(
        { error: "Data de agendamento é obrigatória para serviços agendados" },
        { status: 400 }
      );
    }

    const newOrder = await prisma.workOrder.create({
      data: {
        customerName: customerName.trim(),
        device: device.trim(),
        issue: issue.trim(),
        scheduledDate: pending || !scheduledDate ? null : new Date(scheduledDate),
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
        notes: notes ? notes.trim() : null,
        status: status || (pending ? "PENDENTE" : "AGENDADO"),
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
