import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url, "http://localhost:3000");
    const { searchParams } = url;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Audit GET error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      { error: "Failed to fetch audit logs", details: error.message },
      { status: 500 },
    );
  }
}
