/*
  Warnings:

  - You are about to drop the column `pricePerSizePerEpoch` on the `listed_storage` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerSizePerEpoch` on the `storage_listed_events` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "listed_storage_pricePerSizePerEpoch_idx";

-- AlterTable
ALTER TABLE "listed_storage" DROP COLUMN "pricePerSizePerEpoch";

-- AlterTable
ALTER TABLE "storage_listed_events" DROP COLUMN "pricePerSizePerEpoch";

-- CreateIndex
CREATE INDEX "listed_storage_totalPrice_idx" ON "listed_storage"("totalPrice");
