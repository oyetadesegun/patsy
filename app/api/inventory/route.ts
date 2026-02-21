import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name, type, imageUrl, variants } = await req.json();
  const totalQuantity = (variants as { quantity: number }[]).reduce(
    (sum, v) => sum + v.quantity,
    0,
  );
  const item = await prisma.inventoryItem.create({
    data: {
      name,
      type,
      imageUrl,
      sizes: variants, // Store variants in the 'sizes' JSON column
      quantity: totalQuantity,
    },
  });
  return NextResponse.json(item);
}

export async function GET() {
  const items = await prisma.inventoryItem.findMany();
  // Map 'sizes' DB field to 'variants' for the frontend
  const mappedItems = items.map((item) => ({
    ...item,
    variants: (item.sizes as any) || [],
    sizes: undefined,
  }));
  return NextResponse.json(mappedItems);
}

export async function PUT(req: Request) {
  const { id, name, type, imageUrl, variants } = await req.json();
  const totalQuantity = (variants as { quantity: number }[]).reduce(
    (sum, v) => sum + v.quantity,
    0,
  );
  const item = await prisma.inventoryItem.update({
    where: {
      id,
    },
    data: {
      name,
      type,
      imageUrl,
      sizes: variants,
      quantity: totalQuantity,
    },
  });
  return NextResponse.json(item);
}
export async function DELETE(req: Request) {
  const { id } = await req.json();
  const item = await prisma.inventoryItem.delete({
    where: {
      id,
    },
  });
  return NextResponse.json(item);
}
