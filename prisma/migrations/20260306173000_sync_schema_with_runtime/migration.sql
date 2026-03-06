-- Bring database in sync with prisma/schema.prisma used by API routes.

-- Add missing price column used in inventory read/write operations.
ALTER TABLE "InventoryItem"
ADD COLUMN IF NOT EXISTS "price" INTEGER NOT NULL DEFAULT 0;

-- Ensure expected index exists.
CREATE INDEX IF NOT EXISTS "InventoryItem_createdAt_idx" ON "InventoryItem"("createdAt");

-- Create sale table used by POS/sales flows.
CREATE TABLE IF NOT EXISTS "Sale" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "totalDiscount" INTEGER NOT NULL,
    "grandTotal" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "paymentType" TEXT NOT NULL,
    "depositDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "soldBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Sale_receiptNumber_key" ON "Sale"("receiptNumber");
CREATE INDEX IF NOT EXISTS "Sale_createdAt_idx" ON "Sale"("createdAt");

-- Create audit log table used by inventory mutation routes.
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "performedBy" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
