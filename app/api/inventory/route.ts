import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function apiError(message: string, error: unknown, status = 500) {
  const isDev = process.env.NODE_ENV !== "production";
  const detail = error instanceof Error ? error.message : String(error);
  return NextResponse.json(
    isDev ? { error: message, detail } : { error: message },
    { status },
  );
}

function isTransientDbError(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  const lowered = detail.toLowerCase();
  return (
    lowered.includes("connection timeout") ||
    lowered.includes("timeout exceeded when trying to connect") ||
    lowered.includes("connection terminated")
  );
}

async function withDbRetry<T>(operation: () => Promise<T>, retries = 2) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isTransientDbError(error)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function POST(req: Request) {
  try {
    const { name, type, imageUrl, variants, price, performedBy } =
      await req.json();
    const totalQuantity = (variants as { quantity: number }[]).reduce(
      (sum, v) => sum + v.quantity,
      0,
    );
    const item = await withDbRetry(() =>
      prisma.inventoryItem.create({
      data: {
        name,
        type,
        imageUrl,
        price: price || 0,
        sizes: variants,
        quantity: totalQuantity,
      },
      }),
    );

    await withDbRetry(() =>
      prisma.auditLog.create({
      data: {
        action: "ITEM_ADD",
        entityType: "INVENTORY",
        entityId: item.id,
        performedBy: performedBy || "system",
        details: { name, type, price, variants },
      },
      }),
    );

    return NextResponse.json({
      ...item,
      variants: (item.sizes as any) || [],
      sizes: undefined,
    });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return apiError("Failed to add item", error);
  }
}

export async function GET() {
  try {
    const items = await withDbRetry(() =>
      prisma.inventoryItem.findMany({
        orderBy: { createdAt: "desc" },
      }),
    );
    const mappedItems = items.map((item: any) => ({
      ...item,
      variants: (item.sizes as any) || [],
      sizes: undefined,
    }));
    return NextResponse.json(mappedItems);
  } catch (error) {
    console.error("Inventory GET error:", error);
    // Keep app usable when DB is unreachable or misconfigured.
    return NextResponse.json([]);
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, type, imageUrl, variants, price, performedBy } =
      await req.json();

    const currentItem = await withDbRetry(() =>
      prisma.inventoryItem.findUnique({
        where: { id },
      }),
    );

    const totalQuantity = (variants as { quantity: number }[]).reduce(
      (sum, v) => sum + v.quantity,
      0,
    );
    const item = await withDbRetry(() =>
      prisma.inventoryItem.update({
        where: { id },
        data: {
          name,
          type,
          imageUrl,
          price: price || 0,
          sizes: variants,
          quantity: totalQuantity,
        },
      }),
    );

    await withDbRetry(() =>
      prisma.auditLog.create({
        data: {
          action: "ITEM_UPDATE",
          entityType: "INVENTORY",
          entityId: id,
          performedBy: performedBy || "system",
          details: {
            before: currentItem,
            after: { name, type, price, variants },
          },
        },
      }),
    );

    return NextResponse.json({
      ...item,
      variants: (item.sizes as any) || [],
      sizes: undefined,
    });
  } catch (error) {
    console.error("Inventory PUT error:", error);
    return apiError("Failed to update item", error);
  }
}

export async function DELETE(req: Request) {
  try {
    const { id, performedBy } = await req.json();
    const item = await withDbRetry(() =>
      prisma.inventoryItem.delete({
        where: { id },
      }),
    );

    await withDbRetry(() =>
      prisma.auditLog.create({
        data: {
          action: "ITEM_DELETE",
          entityType: "INVENTORY",
          entityId: id,
          performedBy: performedBy || "system",
          details: { name: item.name, type: item.type },
        },
      }),
    );

    return NextResponse.json(item);
  } catch (error) {
    console.error("Inventory DELETE error:", error);
    return apiError("Failed to delete item", error);
  }
}
