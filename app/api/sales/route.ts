import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to most recent 50 sales for performance
    });
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Sales GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const saleData = await req.json();
    const {
      receiptNumber,
      customerName,
      customerPhone,
      items,
      subtotal,
      totalDiscount,
      grandTotal,
      amountPaid,
      balance,
      paymentType,
      depositDeadline,
      status,
      soldBy,
    } = saleData;

    const sale = await prisma.sale.create({
      data: {
        receiptNumber,
        customerName,
        customerPhone,
        items,
        subtotal,
        totalDiscount,
        grandTotal,
        amountPaid,
        balance,
        paymentType,
        depositDeadline: depositDeadline
          ? new Date(depositDeadline)
          : undefined,
        status,
        soldBy,
      },
    });

    // Create Audit Log for the sale
    await prisma.auditLog.create({
      data: {
        action: "SALE_COMPLETE",
        entityType: "SALE",
        entityId: sale.id,
        performedBy: soldBy,
        details: { items, grandTotal, receiptNumber },
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Sales POST error:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 },
    );
  }
}
