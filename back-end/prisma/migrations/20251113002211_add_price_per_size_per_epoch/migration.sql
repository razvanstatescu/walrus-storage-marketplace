/*
  Warnings:

  - Added the required column `pricePerSizePerEpoch` to the `listed_storage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerSizePerEpoch` to the `storage_listed_events` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add columns as nullable first
ALTER TABLE "listed_storage" ADD COLUMN "pricePerSizePerEpoch" BIGINT;
ALTER TABLE "storage_listed_events" ADD COLUMN "pricePerSizePerEpoch" BIGINT;

-- Step 2: Calculate and populate pricePerSizePerEpoch from existing data
-- Formula: (totalPrice * PRECISION_SCALE) / (size * duration)
-- where PRECISION_SCALE = 1000000000 (1e9)
-- and duration = (endEpoch - startEpoch)

UPDATE "listed_storage"
SET "pricePerSizePerEpoch" = (
  ("totalPrice"::numeric * 1000000000::numeric) /
  ("size"::numeric * (("endEpoch" - "startEpoch")::numeric))
)::bigint
WHERE "pricePerSizePerEpoch" IS NULL;

UPDATE "storage_listed_events"
SET "pricePerSizePerEpoch" = (
  ("totalPrice"::numeric * 1000000000::numeric) /
  ("size"::numeric * (("endEpoch" - "startEpoch")::numeric))
)::bigint
WHERE "pricePerSizePerEpoch" IS NULL;

-- Step 3: Make columns NOT NULL
ALTER TABLE "listed_storage" ALTER COLUMN "pricePerSizePerEpoch" SET NOT NULL;
ALTER TABLE "storage_listed_events" ALTER COLUMN "pricePerSizePerEpoch" SET NOT NULL;
