import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name, type, imageUrl, variants, price, performedBy } =
    await req.json();
  const totalQuantity = (variants as { quantity: number }[]).reduce(
    (sum, v) => sum + v.quantity,
    0,
  );
  const item = await prisma.inventoryItem.create({
    data: {
      name,
      type,
      imageUrl,
      price: price || 0,
      sizes: variants,
      quantity: totalQuantity,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "ITEM_ADD",
      entityType: "INVENTORY",
      entityId: item.id,
      performedBy: performedBy || "system",
      details: { name, type, price, variants },
    },
  });

  return NextResponse.json({
    ...item,
    variants: (item.sizes as any) || [],
    sizes: undefined,
  });
}

export async function GET() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { createdAt: "desc" },
  });
  const mappedItems = items.map((item: any) => ({
    ...item,
    variants: (item.sizes as any) || [],
    sizes: undefined,
  }));
  return NextResponse.json(mappedItems);
}

export async function PUT(req: Request) {
  const { id, name, type, imageUrl, variants, price, performedBy } =
    await req.json();

  const currentItem = await prisma.inventoryItem.findUnique({ where: { id } });

  const totalQuantity = (variants as { quantity: number }[]).reduce(
    (sum, v) => sum + v.quantity,
    0,
  );
  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name,
      type,
      imageUrl,
      price: price || 0,
      sizes: variants,
      quantity: totalQuantity,
    },
  });

  await prisma.auditLog.create({
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
  });

  return NextResponse.json({
    ...item,
    variants: (item.sizes as any) || [],
    sizes: undefined,
  });
}

export async function DELETE(req: Request) {
  const { id, performedBy } = await req.json();
  const item = await prisma.inventoryItem.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      action: "ITEM_DELETE",
      entityType: "INVENTORY",
      entityId: id,
      performedBy: performedBy || "system",
      details: { name: item.name, type: item.type },
    },
  });

  return NextResponse.json(item);
}
