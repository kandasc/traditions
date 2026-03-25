-- Delivery zones (admin-managed fees) + order shipping fields

CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "feeXof" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryZone_slug_key" ON "DeliveryZone"("slug");

ALTER TABLE "Order" ADD COLUMN "customerPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryZoneId" TEXT;
ALTER TABLE "Order" ADD COLUMN "subtotalXof" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "deliveryFeeXof" INTEGER NOT NULL DEFAULT 0;

UPDATE "Order" SET "subtotalXof" = "amountXof";

ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Order_deliveryZoneId_idx" ON "Order"("deliveryZoneId");
