-- Add preorder flag on variants (made on demand)
ALTER TABLE "ProductVariant" ADD COLUMN "isPreorder" BOOLEAN NOT NULL DEFAULT false;

